export type ApplicationStatus =
  | "applied"
  | "phone_screen"
  | "interview"
  | "offer"
  | "rejected"
  | "other";

export type ContactMethod = "none" | "email" | "mail" | "fax";

export interface Application {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  dateApplied: string;
  lastUpdated: string;
  url: string;
  notes: string;
  activity: string;
  employerAddress: string;
  employerCityStateZip: string;
  employerPhone: string;
  contactMethod: ContactMethod;
  contactValue: string;
  personContacted: string;
}

export const STATUSES: ApplicationStatus[] = [
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
  "other",
];

export const CONTACT_METHODS: ContactMethod[] = ["none", "email", "mail", "fax"];
