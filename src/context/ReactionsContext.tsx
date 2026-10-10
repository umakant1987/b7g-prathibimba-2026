import { createContext, useContext, type ReactNode } from 'react';
import { useReactions } from '../hooks/useReactions';

type ReactionsContextValue = ReturnType<typeof useReactions>;

const ReactionsContext = createContext<ReactionsContextValue | undefined>(undefined);

export function ReactionsProvider({ children }: { children: ReactNode }) {
  const value = useReactions();
  return <ReactionsContext.Provider value={value}>{children}</ReactionsContext.Provider>;
}

export function useReactionsContext(): ReactionsContextValue {
  const context = useContext(ReactionsContext);
  if (!context) {
    throw new Error('useReactionsContext must be used within a ReactionsProvider');
  }
  return context;
}
