import type { IsoTime } from "./types";

// All times are local wall-clock strings. We parse them as UTC so the hour
// on the string is the hour we reason about, whatever machine runs this.
const DAY = 24 * 60 * 60 * 1000;

export const toMs = (t: IsoTime): number => Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(t) ? t : `${t}Z`);
export const toIso = (ms: number): IsoTime => new Date(ms).toISOString().slice(0, 16);
export const addDays = (t: IsoTime, days: number): IsoTime => toIso(toMs(t) + days * DAY);
export const days = (n: number): number => n * DAY;
export const hourOf = (ms: number): number => new Date(ms).getUTCHours();

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** Finds a date like "14NOV" or "3 DEC" in a payment description. Picks the next such date after `ts`. */
export function parseEventDate(description: string, ts: IsoTime): IsoTime | undefined {
  const m = description.toUpperCase().match(/\b(\d{1,2})\s?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/);
  if (!m) return undefined;
  const day = Number(m[1]);
  const month = MONTHS.indexOf(m[2]);
  let year = new Date(toMs(ts)).getUTCFullYear();
  if (Date.UTC(year, month, day) < toMs(ts)) year += 1;
  return toIso(Date.UTC(year, month, day));
}
