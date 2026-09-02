import { PDFCheckBox, PDFDocument, PDFTextField, StandardFonts } from "pdf-lib";
import type { Application, ApplicationStatus } from "./types";

// Exact AcroForm field names per row, taken directly from the BN900E template.
// The template's field naming is inconsistent (extra spaces, missing dashes,
// different wording on row 1 and row 5) so each row is spelled out literally
// rather than generated from a pattern.
type RowFieldNames = {
  date: string;
  activity: string;
  jobType: string;
  orgName: string;
  streetAddress: string;
  areaCode: string;
  middle3Phone: string;
  last4Phone: string;
  cityStateZip: string;
  personContacted: string;
  emailCheckbox: string;
  emailAddress: string;
  faxCheckbox: string;
  faxAreaCode: string;
  middle3Fax: string;
  last4Fax: string;
  mailCheckbox: string;
  hiredCheckbox: string;
  notHiredCheckbox: string;
  startDate: string;
  filedAppCheckbox: string;
  otherCheckbox: string;
  otherText: string;
};

const ROW_FIELDS: RowFieldNames[] = [
  {
    date: "Enter Date of Job Search Activity",
    activity: "Enter Work Search Activity",
    jobType: "Enter Job Type",
    orgName: "Enter Name of Organization - 1",
    streetAddress: "Enter Street Address - Organization 1",
    areaCode: "Enter Area Code - Organization 1",
    middle3Phone: "Enter Middle 3 Phone Digits",
    last4Phone: "Enter Last 4 Phone Digits",
    cityStateZip: "Enter City, State, Zip Code - Organization 1",
    personContacted: "Enter Name of Person Contacted - Organization 1",
    emailCheckbox: "Click this checkbox if you contacted organization by email",
    emailAddress: "Enter Email Address - Organization 1",
    faxCheckbox: "Click this checkbox if you contacted organization by fax",
    faxAreaCode: "Enter Fax Area Code - Organization 1",
    middle3Fax: "Enter Middle 3 Digits of Fax Number",
    last4Fax: "Enter Last 4 Digits of Fax Number",
    mailCheckbox: "Click this checkbox if you contacted organization by mail - 1",
    hiredCheckbox: "Click This Checkbox If You Were Hired - 1",
    notHiredCheckbox: "Click This Checkbox If Not Hired - 1",
    startDate: "Enter Start Date if Hired - 1",
    filedAppCheckbox: "Click this Checkbox if You Filed an Application - 1",
    otherCheckbox: "Click this checkbox to tell us about other job result",
    otherText: "Enter Other Job Result - 1",
  },
  {
    date: "Enter Date of Job Search Activity - 2",
    activity: "Enter Work Search Activity - 2",
    jobType: "Enter Job Type  - 2",
    orgName: "Enter Name of Organization  - 2",
    streetAddress: "Enter Street Address - Organization - 2",
    areaCode: "Enter Area Code - Organization 2",
    middle3Phone: "Enter Middle 3 Phone Digits - 2",
    last4Phone: "Enter Last 4 Phone Digits - 2",
    cityStateZip: "Enter City, State, Zip Code - Organization 2",
    personContacted: "Enter Name of Person Contacted - Organization 2",
    emailCheckbox: "Click this checkbox if you contacted organization by email - 2",
    emailAddress: "Enter Email Address - Organization 2",
    faxCheckbox: "Click this checkbox if you contacted organization by fax -2",
    faxAreaCode: "Enter Fax Area Code - Organization 2",
    middle3Fax: "Enter Middle 3 Digits of Fax Number - 2",
    last4Fax: "Enter Last 4 Digits of Fax Number - 2",
    mailCheckbox: "Click this checkbox if you contacted organization by mail - 2",
    hiredCheckbox: "Click This Checkbox If You Were Hired - 2",
    notHiredCheckbox: "Click This Checkbox If Not Hired - 2",
    startDate: "Enter Start Date if Hired - 2",
    filedAppCheckbox: "Click this Checkbox if You Filed an Application - 2",
    otherCheckbox: "Click the Other Checkbox to tell us about a different job result - 2",
    otherText: "Enter Other Job Result - 2",
  },
  {
    date: "Enter Date of Job Search Activity - 3",
    activity: "Enter Work Search Activity - 3",
    jobType: "Enter Job Type - 3",
    orgName: "Enter Name of Organization - 3",
    streetAddress: "Enter Street Address - Organization - 3",
    areaCode: "Enter Area Code - Organization 3",
    middle3Phone: "Enter Middle 3 Phone Digits - 3",
    last4Phone: "Enter Last 4 Phone Digits - 3",
    cityStateZip: "Enter City, State, Zip Code - Organization 3",
    personContacted: "Enter Name of Person Contacted - Organization 3",
    emailCheckbox: "Click this checkbox if you contacted organization by email - 3",
    emailAddress: "Enter Email Address - Organization 3",
    faxCheckbox: "Click this checkbox if you contacted organization by fax -3",
    faxAreaCode: "Enter Fax Area Code - Organization 3",
    middle3Fax: "Enter Middle 3 Digits of Fax Number - 3",
    last4Fax: "Enter Last 4 Digits of Fax Number - 3",
    mailCheckbox: "Click this checkbox if you contacted organization by mail - 3",
    hiredCheckbox: "Click This Checkbox If You Were Hired - 3",
    notHiredCheckbox: "Click This Checkbox If Not Hired - 3",
    startDate: "Enter Start Date if Hired - 3",
    filedAppCheckbox: "Click this Checkbox if You Filed an Application - 3",
    otherCheckbox: "Click the Other Checkbox to tell us about a different job result - 3",
    otherText: "Enter Other Job Result - 3",
  },
  {
    date: "Enter Date of Job Search Activity - 4",
    activity: "Enter Work Search Activity - 4",
    jobType: "Enter Job Type - 4",
    orgName: "Enter Name of Organization  4",
    streetAddress: "Enter Street Address - Organization 4",
    areaCode: "Enter Area Code - Organization 4",
    middle3Phone: "Enter Middle 3 Phone Digits - 4",
    last4Phone: "Enter Last 4 Phone Digits - 4",
    cityStateZip: "Enter City, State, Zip Code - Organization 4",
    personContacted: "Enter Name of Person Contacted - Organization 4",
    emailCheckbox: "Click this checkbox if you contacted organization by email - 4",
    emailAddress: "Enter Email Address - Organization 4",
    faxCheckbox: "Click this checkbox if you contacted organization by fax -4",
    faxAreaCode: "Enter Fax Area Code - Organization 4",
    middle3Fax: "Enter Middle 3 Digits of Fax Number - 4",
    last4Fax: "Enter Last 4 Digits of Fax Number - 4",
    mailCheckbox: "Click this checkbox if you contacted organization by mail  - 4",
    hiredCheckbox: "Click This Checkbox If You Were Hired - 4",
    notHiredCheckbox: "Click This Checkbox If Not Hired - 4",
    startDate: "Enter Start Date if Hired - 4",
    filedAppCheckbox: "Click this Checkbox if You Filed an Application - 4",
    otherCheckbox: "Click the Other Checkbox to tell us about a different job result - 4",
    otherText: "Enter Other Job Result - 4",
  },
  {
    date: "Enter Date of Job Search Activity - 5",
    activity: "Enter Work Search Activity - 5",
    jobType: "Enter Job Type - 5",
    orgName: "Enter Name of Organization - 5",
    streetAddress: "Enter Street Address - Organization 5",
    areaCode: "Enter Area Code - Organization 5",
    middle3Phone: "Enter Middle 3 Phone Digits - 5",
    last4Phone: "Enter Last 4 Phone Digits - 5",
    cityStateZip: "Enter City, State, Zip Code - Organization 5",
    personContacted: "Enter Name of Person Contacted - Organization 5",
    emailCheckbox: "Click this checkbox if you contacted organization by email - 5",
    emailAddress: "Enter Email Address - Organization 5",
    faxCheckbox: "Click this checkbox if you contacted organization by fax -5",
    faxAreaCode: "Enter Fax Area Code - Organization 5",
    middle3Fax: "Enter Middle 3 Digits of Fax Number - 5",
    last4Fax: "Enter Last 4 Digits of Fax Number - 5",
    mailCheckbox: "Click this checkbox if you contacted organization by mail - 5",
    hiredCheckbox: "Click This Checkbox If You Were Hired - 5",
    notHiredCheckbox: "Click This Checkbox If Not Hired - 5",
    startDate: "Enter Start Date if Hired - 5",
    filedAppCheckbox: "Click Checkbox if You Filed an Application - 5",
    otherCheckbox: "Click the Other Checkbox to tell us about a different job result - 5",
    otherText: "Enter Other Job Result - 5",
  },
];

const HEADER_FIELDS = {
  weekOf: "Enter Week Of",
  endDate: "Enter End Date",
};

type StatusResult = {
  filed?: boolean;
  notHiring?: boolean;
  hired?: boolean;
  /** Checks the "Other" box; a non-empty string also fills the explanatory text. */
  other?: string;
};

const STATUS_RESULT: Record<ApplicationStatus, StatusResult> = {
  applied: { filed: true },
  phone_screen: { filed: true, other: "Phone screen" },
  interview: { filed: true, other: "Interview" },
  offer: { filed: true, other: "Offer received" },
  rejected: { filed: true, notHiring: true },
  // Not a job application (e.g. registering with a job site, workforce center
  // follow-up) — only the "Other" box is checked, no explanatory text, matching
  // how the paper form itself is normally filled for this kind of activity.
  other: { other: "" },
};

export function parseDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

export function fmtDate(isoOrDate: string): string {
  const datePart = isoOrDate.slice(0, 10);
  const [y, m, d] = datePart.split("-").map(Number);
  return `${m}/${d}/${String(y).slice(2)}`;
}

function setText(form: ReturnType<PDFDocument["getForm"]>, name: string, value: string) {
  if (!value) return;
  try {
    (form.getField(name) as PDFTextField).setText(value);
  } catch {
    // field not present on this page copy — ignore
  }
}

function setChecked(form: ReturnType<PDFDocument["getForm"]>, name: string) {
  try {
    (form.getField(name) as PDFCheckBox).check();
  } catch {
    // field not present on this page copy — ignore
  }
}

function fillRow(form: ReturnType<PDFDocument["getForm"]>, row: RowFieldNames, app: Application) {
  setText(form, row.date, fmtDate(app.dateApplied));
  setText(form, row.activity, app.activity);
  setText(form, row.jobType, app.role);
  setText(form, row.orgName, app.company);
  setText(form, row.streetAddress, app.employerAddress);
  setText(form, row.cityStateZip, app.employerCityStateZip);
  setText(form, row.personContacted, app.personContacted);

  const phoneDigits = parseDigits(app.employerPhone);
  if (phoneDigits.length === 10) {
    setText(form, row.areaCode, phoneDigits.slice(0, 3));
    setText(form, row.middle3Phone, phoneDigits.slice(3, 6));
    setText(form, row.last4Phone, phoneDigits.slice(6, 10));
  }

  if (app.contactMethod === "email") {
    setChecked(form, row.emailCheckbox);
    setText(form, row.emailAddress, app.contactValue);
  } else if (app.contactMethod === "mail") {
    setChecked(form, row.mailCheckbox);
  } else if (app.contactMethod === "fax") {
    setChecked(form, row.faxCheckbox);
    const faxDigits = parseDigits(app.contactValue);
    if (faxDigits.length === 10) {
      setText(form, row.faxAreaCode, faxDigits.slice(0, 3));
      setText(form, row.middle3Fax, faxDigits.slice(3, 6));
      setText(form, row.last4Fax, faxDigits.slice(6, 10));
    }
  }

  const result = STATUS_RESULT[app.status] ?? { filed: true };
  if (result.filed) setChecked(form, row.filedAppCheckbox);
  if (result.notHiring) setChecked(form, row.notHiredCheckbox);
  if (result.hired) setChecked(form, row.hiredCheckbox);
  if (result.other !== undefined) {
    setChecked(form, row.otherCheckbox);
    if (result.other) setText(form, row.otherText, result.other);
  }
}

async function fillOnePage(templateBytes: ArrayBuffer, weekStart: Date, weekEnding: Date, chunk: Application[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  setText(form, HEADER_FIELDS.weekOf, fmtDate(weekStart.toISOString()));
  setText(form, HEADER_FIELDS.endDate, fmtDate(weekEnding.toISOString()));

  ROW_FIELDS.forEach((row, i) => {
    const app = chunk[i];
    if (app) fillRow(form, row, app);
  });

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  form.updateFieldAppearances(font);

  return pdfDoc.save();
}

/**
 * Fills the TWC BN900E form from a week's applications. Claimant name and SSN
 * are intentionally left blank — the output PDF stays a real fillable form,
 * so those two fields can be typed in afterward in any PDF reader.
 *
 * More than 5 applications in a week doesn't fit on one page (the paper form
 * itself says "make as many copies as you need"), so this returns one filled
 * PDF per page rather than attempting to merge them into a single multi-page
 * interactive form.
 */
export async function fillTwcPdfPages(weekEnding: Date, applications: Application[]): Promise<Uint8Array[]> {
  const templateBytes = await fetch("/bn900e-blank.pdf").then((r) => r.arrayBuffer());
  const weekStart = new Date(weekEnding);
  weekStart.setDate(weekStart.getDate() - 6);

  const chunks: Application[][] = [];
  for (let i = 0; i < applications.length; i += 5) {
    chunks.push(applications.slice(i, i + 5));
  }
  if (chunks.length === 0) chunks.push([]);

  return Promise.all(chunks.map((chunk) => fillOnePage(templateBytes, weekStart, weekEnding, chunk)));
}
