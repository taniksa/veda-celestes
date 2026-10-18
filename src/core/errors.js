export class VedaError extends Error {
  constructor(code, message, { cause, details, retryable = false } = {}) {
    super(message, { cause });
    this.name = "VedaError";
    this.code = code;
    this.details = details;
    this.retryable = retryable;
  }
}

export class ValidationError extends VedaError {
  constructor(message, details) {
    super("VALIDATION_ERROR", message, { details, retryable: false });
    this.name = "ValidationError";
  }
}

export class ProviderUnavailableError extends VedaError {
  constructor(message = "The ephemeris provider is unavailable.", cause) {
    super("EPHEMERIS_UNAVAILABLE", message, { cause, retryable: true });
    this.name = "ProviderUnavailableError";
  }
}

export class ComputationError extends VedaError {
  constructor(message = "The calculation could not be completed.", cause) {
    super("COMPUTATION_ERROR", message, { cause, retryable: false });
    this.name = "ComputationError";
  }
}

export function serializeError(error) {
  if (error instanceof VedaError) {
    return { code: error.code, message: error.message, details: error.details, retryable: error.retryable };
  }
  return { code: "INTERNAL_ERROR", message: "An unexpected internal error occurred.", retryable: false };
}
