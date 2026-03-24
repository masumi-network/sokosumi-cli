export class TaskJob {
  constructor({id, agentId, agentName, status, createdAt, completedAt, input, output}) {
    this.id = id ?? null;
    this.agentId = agentId ?? null;
    this.agentName = agentName ?? null;
    this.status = status ?? null;
    this.createdAt = createdAt ? new Date(createdAt) : null;
    this.completedAt = completedAt ? new Date(completedAt) : null;
    this.input = input ?? null;
    this.output = output ?? null;
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new TaskJob({});
    return new TaskJob(input);
  }
}

export class Task {
  constructor({id, createdAt, updatedAt, name, description, status, coworkerId, coworkerName, jobs, totalCredits}) {
    this.id = id ?? null;
    this.createdAt = createdAt ? new Date(createdAt) : null;
    this.updatedAt = updatedAt ? new Date(updatedAt) : null;
    this.name = name ?? null;
    this.description = description ?? null;
    this.status = status ?? null;
    this.coworkerId = coworkerId ?? null;
    this.coworkerName = coworkerName ?? null;
    this.jobs = Array.isArray(jobs) ? jobs.map(TaskJob.from) : [];
    this.totalCredits = Number.isFinite(totalCredits) ? totalCredits : null;
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new Task({});
    return new Task(input);
  }
}
