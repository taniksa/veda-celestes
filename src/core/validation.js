import { ValidationError } from "./errors.js";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
function validCalendarDate(value) {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function finiteNumber(value, field, minimum, maximum) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new ValidationError(`${field} must be a finite number between ${minimum} and ${maximum}.`, { field });
  }
  return value;
}

export function validateCalculationRequest(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError("Calculation request must be an object.");
  }
  const { date, time, timezone, latitude, longitude } = input;
  if (!validCalendarDate(date)) {
    throw new ValidationError("date must use the YYYY-MM-DD calendar format.", { field: "date" });
  }
  if (typeof time !== "string" || !timePattern.test(time)) {
    throw new ValidationError("time must use the 24-hour HH:MM or HH:MM:SS format.", { field: "time" });
  }
  if (typeof timezone !== "string" || !timezone || timezone.trim() !== timezone) {
    throw new ValidationError("timezone must be a valid IANA-style timezone, such as Asia/Kolkata.", { field: "timezone" });
  }
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }); } catch { throw new ValidationError("timezone is not recognised by this runtime.", { field: "timezone" }); }
  if (input.ayanamsha !== undefined && input.ayanamsha !== "lahiri") {
    throw new ValidationError("Only the lahiri ayanamsha identifier is currently supported.", { field: "ayanamsha" });
  }
  return Object.freeze({
    date,
    time,
    timezone,
    latitude: finiteNumber(latitude, "latitude", -90, 90),
    longitude: finiteNumber(longitude, "longitude", -180, 180),
    ayanamsha: input.ayanamsha ?? "lahiri"
  });
}
