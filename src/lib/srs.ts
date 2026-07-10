// Spaced repetition (Leitner-style): every fact ("skill:countryId") sits in a
// box. Right answer → next box, review pushed further out. Wrong → back to
// box 0, due again immediately. Lessons pull due facts first, so memories get
// refreshed exactly when they're about to fade.

export const SRS_INTERVALS = [1, 2, 4, 9, 21, 60]; // days until next review, per box

export interface SrsRec {
  b: number; // box 0..5
  due: string; // dayKey when this fact should be reviewed
}

/** Add n days to a yyyy-mm-dd key (noon anchor avoids DST edge cases). */
export function addDaysKey(key: string, n: number): string {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + n);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function srsNext(prev: SrsRec | undefined, right: boolean, today: string): SrsRec {
  if (!right) return { b: 0, due: today }; // relearn: due right away
  const b = Math.min((prev?.b ?? -1) + 1, SRS_INTERVALS.length - 1);
  return { b, due: addDaysKey(today, SRS_INTERVALS[b]) };
}

/** All fact keys ("skill:countryId") due on or before today. */
export function dueSrsKeys(srs: Record<string, SrsRec>, today: string): string[] {
  return Object.entries(srs)
    .filter(([, r]) => r.due <= today)
    .map(([k]) => k);
}

/** A fact is "known" once it has climbed past the early boxes. */
export const isKnown = (rec?: SrsRec) => (rec?.b ?? -1) >= 2;
