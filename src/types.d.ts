declare module 'canvas-confetti' {
  const confetti: (options?: Record<string, unknown>) => Promise<null> | null;
  export default confetti;
}
