import { readFileSync } from "node:fs";
import path from "node:path";
import { PDFCheckBox, PDFDocument, PDFTextField } from "pdf-lib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fillTwcPdfPages, fmtDate, parseDigits } from "./twcPdf";
import type { Application } from "./types";

function app(overrides: Partial<Application>): Application {
  return {
    id: "1",
    company: "Acme",
    role: "Engineer",
    status: "applied",
    dateApplied: "2026-09-01T00:00:00.000Z",
    lastUpdated: "2026-09-01T00:00:00.000Z",
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

// fillTwcPdfPages fetches the blank template from "/bn900e-blank.pdf" (a
// browser-relative URL served from public/); stand that up with the real
// file so these tests exercise the actual template, not a fake one.
beforeEach(() => {
  const bytes = readFileSync(path.join(__dirname, "../public/bn900e-blank.pdf"));
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(bytes))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseDigits", () => {
  it("strips non-digit characters", () => {
    expect(parseDigits("(512) 522-1384")).toBe("5125221384");
  });

  it("handles empty input", () => {
    expect(parseDigits("")).toBe("");
  });
});

describe("fmtDate", () => {
  it("formats an ISO timestamp as M/D/YY", () => {
    expect(fmtDate("2026-09-01T00:00:00.000Z")).toBe("9/1/26");
  });

  it("formats a plain date string the same way", () => {
    expect(fmtDate("2026-09-01")).toBe("9/1/26");
  });
});

describe("fillTwcPdfPages", () => {
  it("fills company/role/date and checks Application filed for status 'applied'", async () => {
    const [bytes] = await fillTwcPdfPages(new Date("2026-09-05T00:00:00"), [
      app({ company: "Zeiss", role: "Frontend Engineer", dateApplied: "2026-09-01T00:00:00.000Z", status: "applied" }),
    ]);

    const doc = await PDFDocument.load(bytes);
    const form = doc.getForm();
    expect((form.getField("Enter Name of Organization - 1") as PDFTextField).getText()).toBe("Zeiss");
    expect((form.getField("Enter Job Type") as PDFTextField).getText()).toBe("Frontend Engineer");
    expect((form.getField("Enter Date of Job Search Activity") as PDFTextField).getText()).toBe("9/1/26");
    expect((form.getField("Click this Checkbox if You Filed an Application - 1") as PDFCheckBox).isChecked()).toBe(true);
    expect((form.getField("Click This Checkbox If Not Hired - 1") as PDFCheckBox).isChecked()).toBe(false);
  });

  it("checks Not hiring in addition to Application filed for status 'rejected'", async () => {
    const [bytes] = await fillTwcPdfPages(new Date("2026-09-05T00:00:00"), [app({ status: "rejected" })]);
    const form = (await PDFDocument.load(bytes)).getForm();
    expect((form.getField("Click this Checkbox if You Filed an Application - 1") as PDFCheckBox).isChecked()).toBe(true);
    expect((form.getField("Click This Checkbox If Not Hired - 1") as PDFCheckBox).isChecked()).toBe(true);
  });

  it("checks only Other (not Application filed) for status 'other'", async () => {
    const [bytes] = await fillTwcPdfPages(new Date("2026-09-05T00:00:00"), [app({ status: "other" })]);
    const form = (await PDFDocument.load(bytes)).getForm();
    expect((form.getField("Click this checkbox to tell us about other job result") as PDFCheckBox).isChecked()).toBe(true);
    expect((form.getField("Click this Checkbox if You Filed an Application - 1") as PDFCheckBox).isChecked()).toBe(false);
  });

  it("leaves claimant name and SSN blank so they can be filled in after export", async () => {
    const [bytes] = await fillTwcPdfPages(new Date("2026-09-05T00:00:00"), [app({})]);
    const form = (await PDFDocument.load(bytes)).getForm();
    expect((form.getField("Enter Claimant Name") as PDFTextField).getText()).toBeFalsy();
    expect((form.getField("Enter Social Security Number First 3 Digits") as PDFTextField).getText()).toBeFalsy();
  });

  it("splits more than 5 applications across multiple pages, each with independent data", async () => {
    const apps = Array.from({ length: 7 }, (_, i) =>
      app({ company: `Company ${i + 1}`, dateApplied: `2026-09-0${(i % 5) + 1}T00:00:00.000Z` })
    );
    const pages = await fillTwcPdfPages(new Date("2026-09-05T00:00:00"), apps);
    expect(pages).toHaveLength(2);

    const form1 = (await PDFDocument.load(pages[0])).getForm();
    const form2 = (await PDFDocument.load(pages[1])).getForm();
    expect((form1.getField("Enter Name of Organization - 1") as PDFTextField).getText()).toBe("Company 1");
    expect((form2.getField("Enter Name of Organization - 1") as PDFTextField).getText()).toBe("Company 6");
    // second page's 3rd+ rows should be genuinely blank, not leaking page 1's data
    expect((form2.getField("Enter Job Type - 3") as PDFTextField).getText()).toBeFalsy();
  });

  it("returns one (empty) page when there are no applications", async () => {
    const pages = await fillTwcPdfPages(new Date("2026-09-05T00:00:00"), []);
    expect(pages).toHaveLength(1);
  });
});
