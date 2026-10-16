/** Logic for lesson A7.9 (A2A task states). State names are from the A2A v1.0.0 spec. The transition table is a typical path, not quoted from the spec. */

export type TaskState =
  | 'TASK_STATE_SUBMITTED'
  | 'TASK_STATE_WORKING'
  | 'TASK_STATE_INPUT_REQUIRED'
  | 'TASK_STATE_AUTH_REQUIRED'
  | 'TASK_STATE_COMPLETED'
  | 'TASK_STATE_FAILED'
  | 'TASK_STATE_CANCELED'
  | 'TASK_STATE_REJECTED';

export const TERMINAL: TaskState[] = ['TASK_STATE_COMPLETED', 'TASK_STATE_FAILED', 'TASK_STATE_CANCELED', 'TASK_STATE_REJECTED'];
export const INTERRUPTED: TaskState[] = ['TASK_STATE_INPUT_REQUIRED', 'TASK_STATE_AUTH_REQUIRED'];

export const NEXT: Record<TaskState, TaskState[]> = {
  TASK_STATE_SUBMITTED: ['TASK_STATE_WORKING', 'TASK_STATE_REJECTED'],
  TASK_STATE_WORKING: ['TASK_STATE_INPUT_REQUIRED', 'TASK_STATE_AUTH_REQUIRED', 'TASK_STATE_COMPLETED', 'TASK_STATE_FAILED', 'TASK_STATE_CANCELED'],
  TASK_STATE_INPUT_REQUIRED: ['TASK_STATE_WORKING', 'TASK_STATE_CANCELED'],
  TASK_STATE_AUTH_REQUIRED: ['TASK_STATE_WORKING', 'TASK_STATE_CANCELED'],
  TASK_STATE_COMPLETED: [],
  TASK_STATE_FAILED: [],
  TASK_STATE_CANCELED: [],
  TASK_STATE_REJECTED: [],
};

export const kind = (s: TaskState): 'terminal' | 'interrupted' | 'active' => (TERMINAL.includes(s) ? 'terminal' : INTERRUPTED.includes(s) ? 'interrupted' : 'active');

export const short = (s: TaskState) => s.replace('TASK_STATE_', '');

/** Walk a path. Returns the index of the first illegal move, or -1 when the path is legal. */
export function firstIllegal(path: TaskState[]): number {
  for (let i = 1; i < path.length; i++) if (!NEXT[path[i - 1]].includes(path[i])) return i;
  return -1;
}

/** A terminal task takes no more messages. A follow-up needs a new task in the same context. */
export const acceptsMessages = (s: TaskState) => !TERMINAL.includes(s);
