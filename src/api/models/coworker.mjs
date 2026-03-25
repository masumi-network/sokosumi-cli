export class CoworkerPrice {
  constructor({credits, includedFee}) {
    this.credits = Number.isFinite(credits) ? credits : null;
    this.includedFee = Number.isFinite(includedFee) ? includedFee : null;
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new CoworkerPrice({});
    return new CoworkerPrice(input);
  }
}

export class Coworker {
  constructor({id, createdAt, updatedAt, name, description, status, isNew, isShown, price, capabilities, estimatedDuration}) {
    this.id = id ?? null;
    this.createdAt = createdAt ? new Date(createdAt) : null;
    this.updatedAt = updatedAt ? new Date(updatedAt) : null;
    this.name = name ?? null;
    this.description = description ?? null;
    this.status = status ?? null;
    this.isNew = Boolean(isNew);
    this.isShown = Boolean(isShown);
    this.price = price instanceof CoworkerPrice ? price : CoworkerPrice.from(price || {});
    this.capabilities = Array.isArray(capabilities) ? capabilities : [];
    this.estimatedDuration = estimatedDuration ?? null;
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new Coworker({});
    return new Coworker(input);
  }
}
