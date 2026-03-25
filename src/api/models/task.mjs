export class TaskJob {
  constructor({id, agentId, agentName, name, status, createdAt, updatedAt, completedAt, input, output, result, credits}) {
    this.id = id ?? null;
    this.agentId = agentId ?? null;
    this.agentName = agentName ?? null;
    this.name = name ?? null;
    this.status = status ?? null;
    this.createdAt = createdAt ? new Date(createdAt) : null;
    this.updatedAt = updatedAt ? new Date(updatedAt) : null;
    this.completedAt = completedAt ? new Date(completedAt) : null;
    this.input = input ?? null;
    this.output = output ?? result ?? null;
    this.result = result ?? null;
    this.credits = Number.isFinite(credits) ? credits : null;
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new TaskJob({});
    return new TaskJob(input);
  }
}

export class Task {
  constructor({
    id,
    createdAt,
    updatedAt,
    userId,
    organizationId,
    name,
    description,
    status,
    coworkerId,
    coworkerName,
    coworker,
    jobs,
    totalCredits,
    credits,
    events
  }) {
    this.id = id ?? null;
    this.createdAt = createdAt ? new Date(createdAt) : null;
    this.updatedAt = updatedAt ? new Date(updatedAt) : null;
    this.userId = userId ?? null;
    this.organizationId = organizationId ?? null;
    this.name = name ?? null;
    this.description = description ?? null;
    this.status = status ?? null;
    this.coworkerId = coworkerId ?? null;
    this.coworkerName = coworkerName ?? coworker?.name ?? null;
    this.jobs = Array.isArray(jobs) ? jobs.map(TaskJob.from) : [];
    this.totalCredits = Number.isFinite(totalCredits) ? totalCredits : (Number.isFinite(credits) ? credits : null);
    this.events = Array.isArray(events) ? events : [];
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new Task({});
    return new Task(input);
  }
}
