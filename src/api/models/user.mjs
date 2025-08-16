export class User {
  constructor({id, createdAt, updatedAt, name, email, termsAccepted, marketingOptIn, stripeCustomerId}) {
    this.id = id ?? null;
    this.createdAt = createdAt ? new Date(createdAt) : null;
    this.updatedAt = updatedAt ? new Date(updatedAt) : null;
    this.name = name ?? null;
    this.email = email ?? null;
    this.termsAccepted = Boolean(termsAccepted);
    this.marketingOptIn = Boolean(marketingOptIn);
    this.stripeCustomerId = stripeCustomerId ?? null;
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') {
      return new User({});
    }
    return new User(input);
  }
}


