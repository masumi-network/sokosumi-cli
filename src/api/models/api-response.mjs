export class ApiResponse {
  /** @param {boolean} success @param {any} data @param {string|undefined} timestamp */
  constructor({success, data, timestamp}) {
    this.success = Boolean(success);
    this.data = data;
    this.timestamp = timestamp ?? null;
  }

  /** @param {unknown} input */
  static from(input) {
    if (!input || typeof input !== 'object') {
      return new ApiResponse({success: false, data: null, timestamp: null});
    }
    const {success, data, timestamp} = input;
    return new ApiResponse({success, data, timestamp});
  }
}


