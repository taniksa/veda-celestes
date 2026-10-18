import assert from "node:assert/strict";
import test from "node:test";
import { ProviderUnavailableError, ValidationError, createVedaEngine, validateCalculationRequest } from "../src/index.js";

const validRequest = Object.freeze({ date: "2026-10-18", time: "09:30", timezone: "Asia/Kolkata", latitude: 12.9716, longitude: 77.5946 });

test("rejects impossible dates and accepts valid leap days", () => {
  for (const date of ["2026-02-29", "2026-04-31", "2026-13-01"]) {
    assert.throws(() => validateCalculationRequest({ ...validRequest, date }), ValidationError);
  }
  assert.equal(validateCalculationRequest({ ...validRequest, date: "2024-02-29" }).date, "2024-02-29");
});

test("accepts UTC and rejects unsupported calculation conventions", () => {
  assert.equal(validateCalculationRequest({ ...validRequest, timezone: "UTC" }).timezone, "UTC");
  assert.throws(() => validateCalculationRequest({ ...validRequest, ayanamsha: "unknown" }), ValidationError);
});

test("rejects invalid calculation inputs before calling a provider", async () => {
  const engine = createVedaEngine({ provider: { id: "test", version: "1", calculate: async () => ({}) } });
  await assert.rejects(() => engine.calculate({ ...validRequest, latitude: 91 }), ValidationError);
});

test("does not fabricate an ephemeris result when no provider is configured", async () => {
  const engine = createVedaEngine();
  await assert.rejects(() => engine.calculate(validRequest), ProviderUnavailableError);
});

test("returns provider provenance with a valid deterministic result", async () => {
  const engine = createVedaEngine({
    provider: { id: "fixture-ephemeris", version: "1.0.0", calculate: async () => ({ julianDay: 2461320.5, planets: {} }) },
    clock: () => new Date("2026-10-18T00:00:00.000Z")
  });
  const result = await engine.calculate(validRequest);
  assert.equal(result.provider.id, "fixture-ephemeris");
  assert.equal(result.calculation.julianDay, 2461320.5);
});
