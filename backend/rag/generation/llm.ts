import Anthropic from '@anthropic-ai/sdk';
import type { RagConfig } from '../../config.ts';
import type { ConversationTurn } from '../types.ts';
import { SYSTEM_PROMPT } from './prompt.ts';

export type LlmErrorKind = 'config' | 'auth' | 'rate_limit' | 'unavailable' | 'refusal' | 'bad_request';

export class LlmError extends Error {
  readonly kind: LlmErrorKind;

  constructor(kind: LlmErrorKind, message: string) {
    super(message);
    this.name = 'LlmError';
    this.kind = kind;
  }
}

/** The two things the RAG service needs from a language model. */
export interface AnswerModel {
  answer(userPrompt: string): Promise<string>;
  rewriteFollowUp(question: string, history: ConversationTurn[], candidates: string[]): Promise<string | null>;
}

/**
 * Claude via the official Anthropic SDK. Uses refusal fallbacks
 * (`fallbacks: "default"`), so a safety-classifier decline is re-run on
 * Anthropic's recommended fallback model instead of failing the answer.
 * The SDK already retries 408/409/429/5xx and connection errors (2 retries).
 */
export class ClaudeAnswerModel implements AnswerModel {
  private client: Anthropic | null = null;
  private readonly settings: RagConfig['llm'];

  constructor(settings: RagConfig['llm']) {
    this.settings = settings;
  }

  /** Created on first use, so a missing key surfaces as a clear LlmError rather than a startup crash. */
  private getClient(): Anthropic {
    // Reads ANTHROPIC_API_KEY (or an `ant auth login` profile) from the environment.
    this.client ??= new Anthropic();
    return this.client;
  }

  async answer(userPrompt: string): Promise<string> {
    return this.complete(
      [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      userPrompt,
      this.settings.effort,
    );
  }

  async rewriteFollowUp(question: string, history: ConversationTurn[], candidates: string[]): Promise<string | null> {
    const transcript = history
      .slice(-4)
      .map((turn) => `${turn.role === 'user' ? 'Visitor' : 'Assistant'}: ${turn.content.slice(0, 400)}`)
      .join('\n');
    const text = await this.complete(
      'Rewrite the visitor\'s last question so it stands alone, replacing pronouns like "he", "him" or "they" with the person or people they refer to. Choose only from the candidate names given. Reply with the rewritten question only — no quotes, no explanation. If the question is already standalone, repeat it unchanged.',
      `Conversation:\n${transcript}\n\nCandidate names: ${candidates.join(', ')}\n\nLast question: ${question}`,
      'low',
    );
    return text.trim() || null;
  }

  private async complete(
    system: string | Anthropic.Beta.BetaTextBlockParam[],
    userPrompt: string,
    effort: RagConfig['llm']['effort'],
  ): Promise<string> {
    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await this.getClient().beta.messages.create({
        model: this.settings.model,
        max_tokens: this.settings.maxTokens,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort },
        system,
        messages: [{ role: 'user', content: userPrompt }],
      });
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
        throw new LlmError('auth', 'The Anthropic API rejected the credentials (check ANTHROPIC_API_KEY).');
      }
      if (error instanceof Anthropic.RateLimitError) throw new LlmError('rate_limit', 'The Anthropic API rate limit was reached.');
      if (error instanceof Anthropic.BadRequestError) throw new LlmError('bad_request', error.message);
      if (error instanceof Anthropic.APIConnectionError || error instanceof Anthropic.InternalServerError) {
        throw new LlmError('unavailable', 'The Anthropic API is unavailable.');
      }
      if (error instanceof Anthropic.APIError) throw new LlmError('unavailable', `Anthropic API error ${error.status}.`);
      if (error instanceof Error && /api key|apiKey|authentication/i.test(error.message)) {
        throw new LlmError('config', 'No Anthropic credentials: set ANTHROPIC_API_KEY.');
      }
      throw error;
    }

    if (response.stop_reason === 'refusal') throw new LlmError('refusal', 'The model declined to answer.');
    const text = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();
    if (!text) throw new LlmError('unavailable', 'The model returned an empty answer.');
    return text;
  }
}
