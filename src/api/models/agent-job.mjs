export class AgentJobPrice {
  constructor({credits, includedFee}) {
    this.credits = Number.isFinite(credits) ? credits : null;
    this.includedFee = Number.isFinite(includedFee) ? includedFee : null;
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new AgentJobPrice({});
    return new AgentJobPrice(input);
  }
}

export class AgentJob {
  constructor({
    id,
    createdAt,
    updatedAt,
    name,
    status,
    agentId,
    userId,
    organizationId,
    agentJobId,
    agentJobStatus,
    onChainStatus,
    input,
    output,
    startedAt,
    completedAt,
    resultSubmittedAt,
    isDemo,
    price,
    refund,
    jobStatusSettled
  }) {
    this.id = id ?? null;
    this.createdAt = createdAt ? new Date(createdAt) : null;
    this.updatedAt = updatedAt ? new Date(updatedAt) : null;
    this.name = name ?? null;
    this.status = status ?? null;
    this.agentId = agentId ?? null;
    this.userId = userId ?? null;
    this.organizationId = organizationId ?? null;
    this.agentJobId = agentJobId ?? null;
    this.agentJobStatus = agentJobStatus ?? null;
    this.onChainStatus = onChainStatus ?? null;
    this.input = typeof input === 'string' ? input : (input ? JSON.stringify(input) : null);
    this.output = typeof output === 'string' ? output : (output ? JSON.stringify(output) : null);
    this.startedAt = startedAt ? new Date(startedAt) : null;
    this.completedAt = completedAt ? new Date(completedAt) : null;
    this.resultSubmittedAt = resultSubmittedAt ? new Date(resultSubmittedAt) : null;
    this.isDemo = Boolean(isDemo);
    this.price = price instanceof AgentJobPrice ? price : AgentJobPrice.from(price || {});
    this.refund = refund ?? null;
    this.jobStatusSettled = Boolean(jobStatusSettled);
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new AgentJob({});
    return new AgentJob(input);
  }
}



