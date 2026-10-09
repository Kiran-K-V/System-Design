/** Minimal protobuf wire encoder, only for the lesson widgets. Wire format: https://protobuf.dev/programming-guides/encoding/ */

/** Varint: 7 payload bits per byte, low group first, MSB set on every byte except the last. */
export function varint(n: number): number[] {
  const out: number[] = [];
  let v = n;
  while (v >= 0x80) {
    out.push((v % 0x80) | 0x80);
    v = Math.floor(v / 0x80);
  }
  out.push(v);
  return out;
}

/** Tag = (field_number << 3) | wire_type, encoded as a varint. */
export const tag = (field: number, wireType: number): number[] => varint(field * 8 + wireType);

export interface Piece {
  /** Which part of the field these bytes belong to. */
  kind: 'tag' | 'len' | 'value';
  bytes: number[];
  field: string;
}

export interface UserMsg {
  id: number;
  name: string;
  active: boolean;
}

/** proto3 implicit presence: a field equal to its default value is not written. */
export function encodeUser(m: UserMsg, idField = 1): Piece[] {
  const pieces: Piece[] = [];
  if (m.id !== 0) {
    pieces.push({ kind: 'tag', bytes: tag(idField, 0), field: 'id' });
    pieces.push({ kind: 'value', bytes: varint(m.id), field: 'id' });
  }
  const nameBytes = Array.from(new TextEncoder().encode(m.name));
  if (nameBytes.length > 0) {
    pieces.push({ kind: 'tag', bytes: tag(2, 2), field: 'name' });
    pieces.push({ kind: 'len', bytes: varint(nameBytes.length), field: 'name' });
    pieces.push({ kind: 'value', bytes: nameBytes, field: 'name' });
  }
  if (m.active) {
    pieces.push({ kind: 'tag', bytes: tag(3, 0), field: 'active' });
    pieces.push({ kind: 'value', bytes: [1], field: 'active' });
  }
  return pieces;
}

export const hex = (b: number) => b.toString(16).padStart(2, '0');

/** Compact JSON as UTF-8 bytes. */
export function jsonBytes(m: UserMsg): number[] {
  return Array.from(new TextEncoder().encode(JSON.stringify({ id: m.id, name: m.name, active: m.active })));
}

export const totalBytes = (p: Piece[]) => p.reduce((a, x) => a + x.bytes.length, 0);
