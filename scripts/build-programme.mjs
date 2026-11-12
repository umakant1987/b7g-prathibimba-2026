// Builds knowledge/programme-2026.json from the official Cultural Events Schedule 2026
// (public/Cultural_Events_Schedule_2026.pdf). Edit the tables below and run:
//   node scripts/build-programme.mjs && npm run rag:ingest
import { writeFileSync } from 'node:fs';

const DATE = '2026-11-15';
const DAY = 'Sunday, 15 November 2026';
const EVENT = 'B7G Kannada Rajyotsava 2026';
const SOURCE = 'Cultural Events Schedule 2026 (public/Cultural_Events_Schedule_2026.pdf)';
const UPDATED = '2026-11-12';

// [listing, performer, performance type, start, end, extra aliases, extra note]
const MORNING = [
  ['Arrival of Guests', null, 'arrival', '08:30', '08:45', ['guest arrival', 'arrival']],
  ['Breakfast with the Chief Guests', null, 'breakfast', '08:45', '09:00', ['breakfast']],
  ['Invocation Song by Poornima & Lamp Lighting Ceremony', 'Poornima', 'invocation & lamp lighting', '09:10', '09:15',
    ['invocation', 'invocation song', 'prayer', 'lamp lighting', 'lighting the lamp', 'deepa', 'poornima']],
  ['Welcome Address by the President', null, 'welcome address', '09:20', '09:25', ['welcome address', 'welcome speech', 'president']],
  ['Samvada (Interaction with the Chief Guests)', null, 'interaction', '09:30', '10:30',
    ['samvada', 'samvaada', 'ಸಂವಾದ', 'interaction with the chief guests', 'guest talk', 'chief guest talk'],
    'The Chief Guests for the morning are Shri Dharmendra Kumar Arenahalli and Shri Neernalli Ramakrishna.'],
  ['Chief Guests Interaction with GSS Team', null, 'interaction', '10:30', '10:45', ['gss team', 'gss']],
  ['Inauguration of B7G Sante', null, 'inauguration', '10:45', '11:00',
    ['B7G Sante', 'sante', 'B7G Santhe', 'Santhe', 'santhe inauguration', 'Taste of Karnataka'],
    'B7G Santhe (the community market of stalls run by B7G residents) stays open until the evening.'],
];
const EVENING = [
  ['Jai Bharat Juniors', 'Jai Bharat Juniors', 'group song', '16:40', '16:50', ['jai bharat']],
  ['Danzo Chinnara Balaga', 'Danzo Chinnara Balaga', 'kids dance', '16:50', '17:00', ['danzo', 'chinnara balaga']],
  ['Diganth', 'Diganth', 'flute', '17:00', '17:10', ['digant']],
  ['Soul Stretch Yoga and Fitness Studio', 'Soul Stretch Yoga and Fitness Studio', 'group yoga performance', '17:10', '17:30',
    ['soul stretch', 'soul strech', 'soul stretch yoga', 'yoga']],
  ['Double Chords', 'Double Chords', 'instrumental', '17:30', '17:40', ['double chord']],
  ['SriRanga Group', 'SriRanga Group', 'singing', '17:40', '17:50', ['sriranga', 'sri ranga group']],
  ['Tanya PV', 'Tanya PV', 'violin instrumental', '17:50', '18:00', ['tanya', 'violin']],
  ['Kannadave Satya', 'Kannadave Satya', 'dance drama', '18:00', '18:15', ['kannadave sathya']],
  ['Chinnara Aatagalu', 'Chinnara Aatagalu', 'dance cum skit', '18:15', '18:25', ['chinnara atagalu']],
  ['Geetha Guchcha Group', 'Geetha Guchcha Group', 'Naada Geethe (patriotic song)', '18:25', '18:35',
    ['geetha guchcha', 'geetha guchha', 'naada geethe', 'nada geethe', 'patriotic song']],
  ['Kannada Chinnaru', 'Kannada Chinnaru', 'singing', '18:35', '18:45', []],
  ['Rhythm of B7G', 'Rhythm of B7G', 'dance drama', '18:45', '19:05', ['rhythm']],
  ['Sand Art', 'Mr. Raghavendra Hegde', 'sand art', '19:05', '20:00', ['sand art', 'sand artist', 'raghavendra hegde'],
    'The sand art performance is by Mr. Raghavendra Hegde, a renowned sand artist.'],
  ['Jamming', null, 'jamming', '20:45', '22:30', ['jamming', 'jam session', 'live band'], 'Jamming is the last item of the day.'],
];

const SESSIONS = {
  morning: { name: 'Morning Session', items: MORNING },
  evening: { name: 'Evening Session · Cultural Programme', items: EVENING },
};

const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
function clock(t) {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
function duration(a, b) {
  const d = toMin(b) - toMin(a);
  const h = Math.floor(d / 60), m = d % 60;
  return [h ? `${h} hr` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
}
const title = (listing, performer, type) => (performer && listing === performer ? `${listing} – ${type[0].toUpperCase()}${type.slice(1)}` : listing);

const base = { category: 'programme', language: 'en', event: EVENT, source: SOURCE, version: 2, updated_by: 'B7G Admin', updated_at: UPDATED };
const docs = [];

const allLines = (items) => items.map(([l, p, ty, s, e], i) => `${i + 1}. ${clock(s)} – ${clock(e)}: ${title(l, p, ty)}`).join('\n');
docs.push({
  ...base,
  id: 'programme-2026/overview',
  title: `${EVENT} Programme — ${DAY}`,
  subcategory: 'overview',
  entity_type: 'event',
  entity_name: EVENT,
  content:
    `${EVENT} is a one-day celebration on ${DAY} at Brigade 7 Gardens (it was earlier planned for 31 October and 1 November). ` +
    `The morning session runs from 8:30 AM to 11:00 AM (arrival of guests, breakfast with the Chief Guests, invocation and lamp lighting, welcome address, Samvada with the Chief Guests, and the inauguration of B7G Santhe at 10:45 AM; Santhe stays open until the evening). ` +
    `The evening session (cultural programme) starts at 4:40 PM with performances by B7G residents, followed by sand art by Mr. Raghavendra Hegde from 7:05 PM to 8:00 PM and jamming from 8:45 PM to 10:30 PM.`,
});

for (const [session, { name, items }] of Object.entries(SESSIONS)) {
  const first = items[0], last = items[items.length - 1];
  docs.push({
    ...base,
    id: `programme-2026/${DATE}-${session}`,
    title: `${EVENT} — ${DAY} ${name}`,
    subcategory: 'day_schedule',
    entity_type: 'programme_session',
    entity_name: `15 November 2026 ${session} programme`,
    event_date: DATE,
    session,
    session_name: name,
    item_count: items.length,
    start_time: first[3],
    end_time: last[4],
    content: `The ${session} session (${name}) of ${EVENT} on ${DAY} runs from ${clock(first[3])} to ${clock(last[4])} and has ${items.length} items, in this order:\n${allLines(items)}`,
  });

  items.forEach(([listing, performer, type, start, end, aliases = [], note], i) => {
    const t = title(listing, performer, type);
    const prev = items[i - 1], next = items[i + 1];
    const order = [
      prev ? `It comes after ${title(prev[0], prev[1], prev[2])}` : `It is the first item of the ${session} session`,
      next ? `and before ${title(next[0], next[1], next[2])}.` : `and is the last item of the ${session} session.`,
    ].join(' ');
    const what = performer && performer !== 'Poornima' && performer !== 'Mr. Raghavendra Hegde'
      ? `${performer} will present a ${type} performance`
      : `${listing} is part of the programme`;
    docs.push({
      ...base,
      id: `programme-2026/${DATE}-${session}-${String(i + 1).padStart(2, '0')}`,
      title: t,
      subcategory: 'performance',
      entity_type: performer ? 'performer' : 'programme_item',
      entity_name: listing === 'Inauguration of B7G Sante' ? 'B7G Santhe' : performer && performer === listing ? performer : listing,
      aliases: [...new Set([t, listing, ...aliases])],
      event_date: DATE,
      session,
      sequence: i + 1,
      performer,
      performance_type: type,
      programme_listing: t,
      start_time: start,
      end_time: end,
      content:
        `${what} in the ${session} session (${name}) of ${EVENT} on ${DAY}, from ${clock(start)} to ${clock(end)} (${duration(start, end)}). ` +
        `Official listing: "${t}". It is item ${i + 1} of ${items.length} in that session. ${order}` +
        (note ? ` ${note}` : ''),
    });
  });
}

writeFileSync(new URL('../knowledge/programme-2026.json', import.meta.url), `${JSON.stringify({ documents: docs }, null, 2)}\n`);
console.log(`knowledge/programme-2026.json: ${docs.length} records`);
