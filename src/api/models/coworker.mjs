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
  constructor({
    id,
    createdAt,
    updatedAt,
    archivedAt,
    priority,
    slug,
    name,
    caption,
    company,
    companyLogo,
    url,
    baseURL,
    email,
    description,
    image,
    metadata,
    status,
    isNew,
    isShown,
    isWhitelisted,
    price,
    capabilities,
    estimatedDuration
  }) {
    this.id = id ?? null;
    this.createdAt = createdAt ? new Date(createdAt) : null;
    this.updatedAt = updatedAt ? new Date(updatedAt) : null;
    this.archivedAt = archivedAt ? new Date(archivedAt) : null;
    this.priority = Number.isInteger(priority) ? priority : 0;
    this.slug = slug ?? null;
    this.name = name ?? null;
    this.caption = caption ?? null;
    this.company = company ?? null;
    this.companyLogo = companyLogo ?? null;
    this.url = url ?? null;
    this.baseURL = baseURL ?? null;
    this.email = email ?? null;
    this.description = description ?? null;
    this.image = image ?? null;
    this.metadata = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : null;
    this.status = status ?? null;
    this.isNew = Boolean(isNew);
    this.isShown = Boolean(isShown);
    this.isWhitelisted = Boolean(isWhitelisted);
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

export class CoworkerApiKey {
  constructor({id, token, name, expiresAt} = {}) {
    this.id = id ?? null;
    this.token = token ?? null;
    this.name = name ?? null;
    this.expiresAt = expiresAt ? new Date(expiresAt) : null;
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new CoworkerApiKey({});
    return new CoworkerApiKey(input);
  }
}
