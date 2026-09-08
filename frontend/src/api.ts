import type { Application } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000/local";
const API_KEY = import.meta.env.VITE_API_KEY;

const authHeaders: Record<string, string> = API_KEY ? { "x-api-key": API_KEY } : {};

export async function listApplications(): Promise<Application[]> {
  const res = await fetch(`${API_BASE}/applications`, { headers: authHeaders });
  if (!res.ok) throw new Error("Failed to load applications");
  return res.json();
}

export async function createApplication(
  input: Pick<Application, "company" | "role" | "url" | "notes">
): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create application");
  return res.json();
}

export async function updateApplication(
  id: string,
  input: Partial<Omit<Application, "id" | "lastUpdated">>
): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update application");
  return res.json();
}

export async function deleteApplication(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/applications/${id}`, { method: "DELETE", headers: authHeaders });
  if (!res.ok) throw new Error("Failed to delete application");
}
