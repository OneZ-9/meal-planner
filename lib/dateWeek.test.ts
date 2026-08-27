import { describe, expect, it } from "vitest";

import {
  formatWeekRangeLabel,
  fromDateKey,
  getWeekDates,
  getWeekStart,
  isValidDateKey,
  shiftWeek,
  toDateKey,
} from "./dateWeek";

describe("getWeekStart", () => {
  it("returns the Monday of the given week (US-5/US-9: Mon-Sun weeks)", () => {
    // Wednesday, Oct 25, 2023
    const wednesday = new Date(2023, 9, 25);
    expect(toDateKey(getWeekStart(wednesday))).toBe("2023-10-23");
  });

  it("returns the same date when given a Monday", () => {
    const monday = new Date(2023, 9, 23);
    expect(toDateKey(getWeekStart(monday))).toBe("2023-10-23");
  });

  it("rolls a Sunday back to the start of its own week, not the next one", () => {
    const sunday = new Date(2023, 9, 29);
    expect(toDateKey(getWeekStart(sunday))).toBe("2023-10-23");
  });
});

describe("getWeekDates", () => {
  it("returns all 7 days of the week starting from the given Monday", () => {
    const weekStart = new Date(2023, 9, 23);
    const dates = getWeekDates(weekStart).map(toDateKey);
    expect(dates).toEqual([
      "2023-10-23",
      "2023-10-24",
      "2023-10-25",
      "2023-10-26",
      "2023-10-27",
      "2023-10-28",
      "2023-10-29",
    ]);
  });
});

describe("shiftWeek", () => {
  it("moves forward a week without drifting the day-of-week (US-9)", () => {
    const weekStart = new Date(2023, 9, 23);
    expect(toDateKey(shiftWeek(weekStart, 1))).toBe("2023-10-30");
  });

  it("moves backward a week", () => {
    const weekStart = new Date(2023, 9, 23);
    expect(toDateKey(shiftWeek(weekStart, -1))).toBe("2023-10-16");
  });
});

describe("toDateKey / fromDateKey", () => {
  it("round-trips a date through its key without shifting days", () => {
    const original = new Date(2023, 9, 23);
    expect(toDateKey(fromDateKey(toDateKey(original)))).toBe(toDateKey(original));
  });
});

describe("isValidDateKey", () => {
  it("accepts a real calendar date", () => {
    expect(isValidDateKey("2023-10-23")).toBe(true);
  });

  it("rejects malformed strings", () => {
    expect(isValidDateKey("2023/10/23")).toBe(false);
    expect(isValidDateKey("not-a-date")).toBe(false);
  });

  it("rejects a date that doesn't exist, like Feb 30", () => {
    expect(isValidDateKey("2023-02-30")).toBe(false);
  });
});

describe("formatWeekRangeLabel", () => {
  it("formats a week spanning two months", () => {
    const weekStart = new Date(2023, 9, 23);
    expect(formatWeekRangeLabel(weekStart)).toBe("Oct 23 - Oct 29, 2023");
  });
});
