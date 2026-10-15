/**
 * The last-seat race, replayed one operation at a time.
 * Two buyers, A and B, want the only seat. Each strategy is a fixed interleaving of operations.
 * `run` applies the operations to a tiny model of the database and returns the state after each step,
 * so the animation shows what the model computed and the test checks it.
 */

export type Strategy = 'none' | 'lock' | 'version' | 'hold' | 'queue';
export type Who = 'A' | 'B';

export interface Db {
  seats: number;
  version: number;
  /** Row lock holder (SELECT ... FOR UPDATE). */
  lock: Who | null;
  /** Buyer who holds a reservation, and whether it has expired. */
  hold: Who | null;
  /** Buyers who were told "booked". */
  sold: Who[];
  /** Buyers who were told "sold out" or "try again". */
  refused: Who[];
  /** True once a hold has timed out. */
  expired: boolean;
  /** Buyer waiting on the row lock. */
  waiting: Who | null;
  /** Queue of requests waiting for the single worker. */
  queue: Who[];
}

export type Op =
  | { op: 'read'; who: Who }
  | { op: 'blindWrite'; who: Who }
  | { op: 'lock'; who: Who }
  | { op: 'lockedBook'; who: Who }
  | { op: 'unlock'; who: Who }
  | { op: 'cas'; who: Who }
  | { op: 'hold'; who: Who }
  | { op: 'confirm'; who: Who }
  | { op: 'expire' }
  | { op: 'enqueue'; who: Who }
  | { op: 'process' };

/** What each buyer last read: used by blind and version-checked writes. */
export interface Seen {
  seats: number;
  version: number;
}

export interface Frame {
  op: Op;
  db: Db;
  seen: Record<Who, Seen | null>;
  /** Result shown to the actor of this op, if any. */
  result: 'ok' | 'refused' | 'waiting' | 'none';
}

const start = (): Db => ({ seats: 1, version: 1, lock: null, hold: null, sold: [], refused: [], expired: false, waiting: null, queue: [] });

function book(db: Db, who: Who) {
  db.seats -= 1;
  db.version += 1;
  db.sold.push(who);
}

export function run(ops: Op[]): Frame[] {
  let db = start();
  const seen: Record<Who, Seen | null> = { A: null, B: null };
  const frames: Frame[] = [];
  for (const o of ops) {
    db = { ...db, sold: [...db.sold], refused: [...db.refused], queue: [...db.queue] };
    let result: Frame['result'] = 'none';
    switch (o.op) {
      case 'read':
        seen[o.who] = { seats: db.seats, version: db.version };
        break;
      case 'blindWrite': {
        // The buyer saw a free seat earlier and writes "seats = seen - 1" without checking again.
        const s = seen[o.who];
        if (s && s.seats > 0) {
          db.seats = s.seats - 1;
          db.version += 1;
          db.sold.push(o.who);
          result = 'ok';
        } else {
          db.refused.push(o.who);
          result = 'refused';
        }
        break;
      }
      case 'lock':
        if (db.lock === null) {
          db.lock = o.who;
          seen[o.who] = { seats: db.seats, version: db.version };
        } else {
          db.waiting = o.who;
          result = 'waiting';
        }
        break;
      case 'lockedBook':
        if (db.lock === o.who && seen[o.who]!.seats > 0) {
          book(db, o.who);
          result = 'ok';
        } else {
          db.refused.push(o.who);
          result = 'refused';
        }
        break;
      case 'unlock':
        db.lock = null;
        if (db.waiting) {
          // The waiter gets the lock and re-reads the row. It now sees the committed change.
          db.lock = db.waiting;
          seen[db.waiting] = { seats: db.seats, version: db.version };
          db.waiting = null;
        }
        break;
      case 'cas': {
        const s = seen[o.who];
        if (s && db.version === s.version && db.seats > 0) {
          book(db, o.who);
          result = 'ok';
        } else {
          db.refused.push(o.who);
          result = 'refused';
        }
        break;
      }
      case 'hold':
        if (db.hold === null && db.seats > 0) {
          db.hold = o.who;
          result = 'ok';
        } else {
          db.refused.push(o.who);
          result = 'refused';
        }
        break;
      case 'confirm':
        if (db.hold === o.who && db.seats > 0) {
          book(db, o.who);
          db.hold = null;
          result = 'ok';
        } else {
          db.refused.push(o.who);
          result = 'refused';
        }
        break;
      case 'expire':
        db.hold = null;
        db.expired = true;
        break;
      case 'enqueue':
        db.queue.push(o.who);
        break;
      case 'process': {
        const who = db.queue.shift();
        if (who) {
          if (db.seats > 0) {
            book(db, who);
            result = 'ok';
          } else {
            db.refused.push(who);
            result = 'refused';
          }
        }
        break;
      }
    }
    frames.push({ op: o, db: { ...db }, seen: { A: seen.A && { ...seen.A }, B: seen.B && { ...seen.B } }, result });
  }
  return frames;
}

export const SCRIPTS: Record<Strategy, Op[]> = {
  // Both read "1 seat" before either writes. Both write. The seat is sold twice.
  none: [
    { op: 'read', who: 'A' },
    { op: 'read', who: 'B' },
    { op: 'blindWrite', who: 'A' },
    { op: 'blindWrite', who: 'B' },
  ],
  lock: [
    { op: 'lock', who: 'A' },
    { op: 'lock', who: 'B' },
    { op: 'lockedBook', who: 'A' },
    { op: 'unlock', who: 'A' },
    { op: 'lockedBook', who: 'B' },
    { op: 'unlock', who: 'B' },
  ],
  version: [
    { op: 'read', who: 'A' },
    { op: 'read', who: 'B' },
    { op: 'cas', who: 'A' },
    { op: 'cas', who: 'B' },
  ],
  // A holds the seat and walks away. The hold expires. B then holds and confirms.
  hold: [
    { op: 'hold', who: 'A' },
    { op: 'hold', who: 'B' },
    { op: 'expire' },
    { op: 'hold', who: 'B' },
    { op: 'confirm', who: 'B' },
  ],
  queue: [
    { op: 'enqueue', who: 'A' },
    { op: 'enqueue', who: 'B' },
    { op: 'process' },
    { op: 'process' },
  ],
};
