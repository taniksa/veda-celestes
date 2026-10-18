import { ComputationError } from "./errors.js";
import { validateCalculationRequest } from "./validation.js";
import { assertEphemerisProvider, unavailableEphemerisProvider } from "../providers/ephemeris-provider.js";

export function createVedaEngine({ provider = unavailableEphemerisProvider, clock = () => new Date() } = {}) {
  const ephemeris = assertEphemerisProvider(provider);
  if (typeof clock !== "function") throw new TypeError("clock must be a function.");

  return Object.freeze({
    version: "0.1.0",
    async calculate(input) {
      const request = validateCalculationRequest(input);
      try {
        const calculation = await ephemeris.calculate(request);
        if (!calculation || typeof calculation !== "object" || Array.isArray(calculation)) {
          throw new ComputationError("The ephemeris provider returned an invalid calculation payload.");
        }
        return Object.freeze({
          schemaVersion: "1",
          calculatedAt: clock().toISOString(),
          request,
          provider: Object.freeze({ id: ephemeris.id, version: ephemeris.version }),
          calculation: Object.freeze(calculation)
        });
      } catch (error) {
        if (error?.code) throw error;
        throw new ComputationError("The ephemeris calculation failed.", error);
      }
    }
  });
}
