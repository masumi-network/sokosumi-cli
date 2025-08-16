export class AgentTag {
  constructor({name}) {
    this.name = name ?? null;
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new AgentTag({});
    return new AgentTag(input);
  }
}

export class AgentPrice {
  constructor({credits, includedFee}) {
    this.credits = Number.isFinite(credits) ? credits : null;
    this.includedFee = Number.isFinite(includedFee) ? includedFee : null;
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new AgentPrice({});
    return new AgentPrice(input);
  }
}

export class Agent {
  constructor({id, createdAt, updatedAt, name, description, status, isNew, isShown, price, tags}) {
    this.id = id ?? null;
    this.createdAt = createdAt ? new Date(createdAt) : null;
    this.updatedAt = updatedAt ? new Date(updatedAt) : null;
    this.name = name ?? null;
    this.description = description ?? null;
    this.status = status ?? null;
    this.isNew = Boolean(isNew);
    this.isShown = Boolean(isShown);
    this.price = price instanceof AgentPrice ? price : AgentPrice.from(price || {});
    this.tags = Array.isArray(tags) ? tags.map(AgentTag.from) : [];
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new Agent({});
    return new Agent(input);
  }
}


