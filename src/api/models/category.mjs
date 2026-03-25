export class Category {
  constructor({id, name, description, slug, agentCount}) {
    this.id = id ?? null;
    this.name = name ?? null;
    this.description = description ?? null;
    this.slug = slug ?? null;
    this.agentCount = Number.isFinite(agentCount) ? agentCount : 0;
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new Category({});
    return new Category(input);
  }
}
