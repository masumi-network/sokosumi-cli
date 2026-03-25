export class JobEvent {
  constructor({id, jobId, type, message, data, createdAt}) {
    this.id = id ?? null;
    this.jobId = jobId ?? null;
    this.type = type ?? null;
    this.message = message ?? null;
    this.data = data ?? null;
    this.createdAt = createdAt ? new Date(createdAt) : null;
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new JobEvent({});
    return new JobEvent(input);
  }
}
