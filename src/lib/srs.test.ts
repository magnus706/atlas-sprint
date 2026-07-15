import { describe, it, expect } from "vitest";
import { srsNext, dueSrsKeys, isKnown, addDaysKey, SRS_INTERVALS, type SrsRec } from "./srs";

const TODAY = "2026-07-15";

describe("addDaysKey", () => {
  it("advances within a month", () => {
    expect(addDaysKey("2026-07-15", 1)).toBe("2026-07-16");
  });

  it("rolls over month and year ends", () => {
    expect(addDaysKey("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDaysKey("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("handles the longest interval", () => {
    expect(addDaysKey("2026-07-15", 60)).toBe("2026-09-13");
  });

  it("handles leap years", () => {
    expect(addDaysKey("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDaysKey("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("survives a spring-forward DST boundary (noon anchor)", () => {
    // Europe/Oslo springs forward 2026-03-29. A midnight anchor can land on a
    // non-existent local time and slip a day; the noon anchor is why this holds.
    expect(addDaysKey("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDaysKey("2026-03-29", 1)).toBe("2026-03-30");
  });

  it("survives a fall-back DST boundary", () => {
    expect(addDaysKey("2026-10-25", 1)).toBe("2026-10-26");
  });
});

describe("srsNext", () => {
  it("puts a brand-new correct fact in box 0, due tomorrow", () => {
    expect(srsNext(undefined, true, TODAY)).toEqual({ b: 0, due: "2026-07-16" });
  });

  it("promotes one box at a time, pushing review further out", () => {
    let rec = srsNext(undefined, true, TODAY);
    expect(rec.b).toBe(0);
    rec = srsNext(rec, true, TODAY);
    expect(rec).toEqual({ b: 1, due: addDaysKey(TODAY, 2) });
    rec = srsNext(rec, true, TODAY);
    expect(rec).toEqual({ b: 2, due: addDaysKey(TODAY, 4) });
  });

  it("caps at the last box instead of running off the interval table", () => {
    let rec: SrsRec = { b: SRS_INTERVALS.length - 1, due: TODAY };
    rec = srsNext(rec, true, TODAY);
    expect(rec.b).toBe(SRS_INTERVALS.length - 1);
    expect(rec.due).toBe(addDaysKey(TODAY, 60));
  });

  it("sends a wrong answer back to box 0, due immediately", () => {
    const mature: SrsRec = { b: 5, due: "2026-09-13" };
    expect(srsNext(mature, false, TODAY)).toEqual({ b: 0, due: TODAY });
  });

  it("makes a lapsed fact immediately due again (relearn is not deferred)", () => {
    const lapsed = srsNext({ b: 3, due: TODAY }, false, TODAY);
    expect(dueSrsKeys({ "capital:no": lapsed }, TODAY)).toEqual(["capital:no"]);
  });

  it("every box maps to its documented interval", () => {
    let rec = srsNext(undefined, true, TODAY);
    for (let i = 0; i < SRS_INTERVALS.length; i++) {
      expect(rec.due).toBe(addDaysKey(TODAY, SRS_INTERVALS[i]));
      rec = srsNext(rec, true, TODAY);
    }
  });
});

describe("dueSrsKeys", () => {
  const srs: Record<string, SrsRec> = {
    "capital:no": { b: 1, due: "2026-07-14" }, // overdue
    "flag:se": { b: 0, due: "2026-07-15" }, // due exactly today
    "shape:dk": { b: 3, due: "2026-07-16" }, // future
  };

  it("returns overdue and due-today, never future", () => {
    expect(dueSrsKeys(srs, TODAY).sort()).toEqual(["capital:no", "flag:se"]);
  });

  it("is empty when nothing is due", () => {
    expect(dueSrsKeys({ "shape:dk": { b: 3, due: "2026-08-01" } }, TODAY)).toEqual([]);
  });

  it("handles an empty schedule", () => {
    expect(dueSrsKeys({}, TODAY)).toEqual([]);
  });

  it("compares dates chronologically, not lexically-by-accident", () => {
    // yyyy-mm-dd string compare only works because of zero-padding — guard it.
    expect(dueSrsKeys({ "a:b": { b: 0, due: "2026-09-02" } }, "2026-10-01")).toEqual(["a:b"]);
  });
});

describe("isKnown", () => {
  it("treats box 2+ as known", () => {
    expect(isKnown({ b: 2, due: TODAY })).toBe(true);
    expect(isKnown({ b: 5, due: TODAY })).toBe(true);
  });

  it("treats the early boxes as not yet known", () => {
    expect(isKnown({ b: 0, due: TODAY })).toBe(false);
    expect(isKnown({ b: 1, due: TODAY })).toBe(false);
  });

  it("treats an unseen fact as not known", () => {
    expect(isKnown(undefined)).toBe(false);
  });
});
