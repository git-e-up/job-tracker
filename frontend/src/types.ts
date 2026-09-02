export type ApplicationStatus =
  | "applied"
  | "phone_screen"
  | "interview"
  | "offer"
  | "rejected";

export interface Application {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  dateApplied: string;
  lastUpdated: string;
  url: string;
  notes: string;
}

export const STATUSES: ApplicationStatus[] = [
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
];
