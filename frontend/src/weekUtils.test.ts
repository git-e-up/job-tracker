import { describe, expect, it } from "vitest";
import { applicationsInWeek, isSaturday, mostRecentSaturday, twcPdfBaseName } from "./weekUtils";
import type { Application } from "./types";

function app(overrides: Partial<Application>): Application {
  return {
    id: "1",
    company: "Acme",
    role: "Engineer",
    status: "applied",
    dateApplied: "2026-09-02T00:00:00.000Z",
    lastUpdated: "2026-09-02T00:00:00.000Z",
    url: "",
    notes: "",
    activity: "Applied online",
    employerAddress: "",
    employerCityStateZip: "",
    employerPhone: "",
    contactMethod: "none",
    contactValue: "",
    personContacted: "",
    ...overrides,
  };
}

describe("mostRecentSaturday", () => {
  it("always returns a Saturday", () => {
    expect(isSaturday(mostRecentSaturday())).toBe(true);
  });
});

describe("isSaturday", () => {
  it("accepts a known Saturday", () => {
    expect(isSaturday("2026-09-05")).toBe(true);
  });

  it("rejects a non-Saturday", () => {
    expect(isSaturday("2026-09-02")).toBe(false);
  });
});

describe("applicationsInWeek", () => {
  const apps = [
    app({ id: "sun", dateApplied: "2026-08-30T00:00:00.000Z" }), // week start
    app({ id: "wed", dateApplied: "2026-09-02T00:00:00.000Z" }),
    app({ id: "sat", dateApplied: "2026-09-05T00:00:00.000Z" }), // week end
    app({ id: "before", dateApplied: "2026-08-29T00:00:00.000Z" }), // just outside
    app({ id: "after", dateApplied: "2026-09-06T00:00:00.000Z" }), // just outside
  ];

  it("includes only dates within the Sun-Sat week, inclusive of both ends", () => {
    const result = applicationsInWeek(apps, "2026-09-05");
    expect(result.map((a) => a.id)).toEqual(["sun", "wed", "sat"]);
  });

  it("sorts results oldest first", () => {
    const shuffled = [apps[2], apps[0], apps[1]];
    const result = applicationsInWeek(shuffled, "2026-09-05");
    expect(result.map((a) => a.id)).toEqual(["sun", "wed", "sat"]);
  });

  it("returns an empty array when nothing falls in the week", () => {
    expect(applicationsInWeek(apps, "2026-01-03")).toEqual([]);
  });
});

describe("twcPdfBaseName", () => {
  it("matches the project's existing TWC filename convention", () => {
    expect(twcPdfBaseName("2026-09-05")).toBe("work-search-log-twc-ending-9.5.26");
  });
});
