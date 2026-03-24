const TASK_STATUS_GROUPS = {
  draft: new Set(['DRAFT']),
  todo: new Set(['READY', 'CREDITS_TOPPED_UP']),
  running: new Set(['RUNNING', 'AWAITING_EXTERNAL', 'CANCEL_REQUESTED', 'AUTHENTICATION_REQUIRED']),
  attention: new Set(['INPUT_REQUIRED', 'OUT_OF_CREDITS']),
  done: new Set(['COMPLETED', 'FAILED', 'CANCELED'])
};

const JOB_STATUS_ALIASES = {
  processing: 'running',
  initiated: 'pending',
  awaiting_payment: 'pending',
  awaiting_input: 'input_required',
  payment_failed: 'failed'
};

export function normalizeTaskStatus(status) {
  return String(status || 'UNKNOWN').toUpperCase();
}

export function normalizeJobStatus(status) {
  const normalized = String(status || 'unknown').toLowerCase();
  return JOB_STATUS_ALIASES[normalized] || normalized;
}

export function getTaskStatusLabel(status) {
  return normalizeTaskStatus(status).replaceAll('_', ' ');
}

export function getJobStatusLabel(status) {
  return normalizeJobStatus(status).replaceAll('_', ' ').toUpperCase();
}

export function getTaskStatusTone(status) {
  const normalized = normalizeTaskStatus(status);

  if (TASK_STATUS_GROUPS.done.has(normalized)) {
    if (normalized === 'COMPLETED') return 'green';
    if (normalized === 'FAILED') return 'red';
    return 'gray';
  }

  if (TASK_STATUS_GROUPS.running.has(normalized)) return 'yellow';
  if (TASK_STATUS_GROUPS.attention.has(normalized)) return 'red';
  if (TASK_STATUS_GROUPS.todo.has(normalized)) return 'cyan';
  return 'white';
}

export function getJobStatusTone(status) {
  const normalized = normalizeJobStatus(status);

  if (normalized === 'completed') return 'green';
  if (normalized === 'failed') return 'red';
  if (normalized === 'input_required') return 'red';
  if (normalized === 'running' || normalized === 'pending') return 'yellow';
  return 'white';
}

export function isTaskDraft(status) {
  return TASK_STATUS_GROUPS.draft.has(normalizeTaskStatus(status));
}

export function isTaskOpen(status) {
  const normalized = normalizeTaskStatus(status);
  return (
    TASK_STATUS_GROUPS.todo.has(normalized) ||
    TASK_STATUS_GROUPS.running.has(normalized) ||
    TASK_STATUS_GROUPS.attention.has(normalized)
  );
}

export function isTaskDone(status) {
  return TASK_STATUS_GROUPS.done.has(normalizeTaskStatus(status));
}

export function isJobActive(status) {
  const normalized = normalizeJobStatus(status);
  return normalized === 'running' || normalized === 'pending' || normalized === 'input_required';
}

export function isJobDone(status) {
  const normalized = normalizeJobStatus(status);
  return normalized === 'completed' || normalized === 'failed';
}

export function getTaskDashboardState(status) {
  const normalized = normalizeTaskStatus(status);

  if (TASK_STATUS_GROUPS.draft.has(normalized)) return 'draft';
  if (TASK_STATUS_GROUPS.todo.has(normalized)) return 'todo';
  if (TASK_STATUS_GROUPS.running.has(normalized)) return 'running';
  if (TASK_STATUS_GROUPS.attention.has(normalized)) return 'attention';
  if (normalized === 'COMPLETED') return 'completed';
  if (normalized === 'FAILED') return 'failed';
  if (normalized === 'CANCELED') return 'canceled';
  return 'unknown';
}
