import type { Application } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000/local";

export async function listApplications(): Promise<Application[]> {
  const res = await fetch(`${API_BASE}/applications`);
  if (!res.ok) throw new Error("Failed to load applications");
  return res.json();
}

export async function createApplication(
  input: Pick<Application, "company" | "role" | "url" | "notes">
): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create application");
  return res.json();
}

export async function updateApplication(
  id: string,
  input: Partial<Pick<Application, "status" | "notes" | "company" | "role" | "url" | "dateApplied">>
): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update application");
  return res.json();
}

export async function deleteApplication(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/applications/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete application");
}
