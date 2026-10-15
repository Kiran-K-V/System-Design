export interface Pt2 {
  id: string;
  label: string;
  /** Degrees, counterclockwise from the +x axis. Illustrative, not a real embedding. */
  angle: number;
  /** Vector length. Real embedding APIs often return unit vectors, so length is shown to prove it does not matter. */
  len: number;
}

export const POINTS: Pt2[] = [
  { id: 'refund', label: 'refund my order', angle: 18, len: 2.0 },
  { id: 'return', label: 'return an item', angle: 50, len: 1.5 },
  { id: 'money', label: 'money back', angle: 4, len: 1.4 },
  { id: 'norefund', label: 'do not refund me', angle: 22, len: 2.5 },
  { id: 'password', label: 'reset password', angle: 100, len: 1.8 },
  { id: 'login', label: 'forgot login', angle: 118, len: 1.4 },
  { id: 'kitten', label: 'kitten photos', angle: 200, len: 1.5 },
];

export const toXY = (p: { angle: number; len: number }): [number, number] => [p.len * Math.cos((p.angle * Math.PI) / 180), p.len * Math.sin((p.angle * Math.PI) / 180)];

export const dot = (a: [number, number], b: [number, number]) => a[0] * b[0] + a[1] * b[1];
export const norm = (a: [number, number]) => Math.hypot(a[0], a[1]);
export const cosine = (a: [number, number], b: [number, number]) => dot(a, b) / (norm(a) * norm(b));
export const angleBetween = (a: [number, number], b: [number, number]) => (Math.acos(Math.max(-1, Math.min(1, cosine(a, b)))) * 180) / Math.PI;
