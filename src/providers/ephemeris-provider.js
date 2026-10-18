import { ProviderUnavailableError, ValidationError } from "../core/errors.js";

export function assertEphemerisProvider(provider) {
  if (!provider || typeof provider !== "object" || typeof provider.calculate !== "function" || typeof provider.id !== "string" || typeof provider.version !== "string") {
    throw new ValidationError("An ephemeris provider must expose id, version and calculate(request).");
  }
  return provider;
}

export const unavailableEphemerisProvider = Object.freeze({
  id: "unconfigured",
  version: "0",
  async calculate() {
    throw new ProviderUnavailableError("No verified ephemeris provider has been configured.");
  }
});
