export class JobFile {
  constructor({id, name, fileUrl, sourceUrl, size, mimeType, status, createdAt, updatedAt}) {
    this.id = id ?? null;
    this.name = name ?? null;
    // Use fileUrl if available, fallback to sourceUrl
    this.url = fileUrl || sourceUrl || null;
    this.size = Number.isFinite(size) ? size : null;
    this.mimeType = mimeType ?? null;
    this.status = status ?? null;
    this.createdAt = createdAt ? new Date(createdAt) : null;
    this.updatedAt = updatedAt ? new Date(updatedAt) : null;
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new JobFile({});
    return new JobFile(input);
  }
}

export class JobLink {
  constructor({id, title, url, description, createdAt}) {
    this.id = id ?? null;
    this.title = title ?? null;
    this.url = url ?? null;
    this.description = description ?? null;
    this.createdAt = createdAt ? new Date(createdAt) : null;
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') return new JobLink({});
    return new JobLink(input);
  }
}
