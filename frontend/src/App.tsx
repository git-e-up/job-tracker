import { useEffect, useState, type FormEvent } from "react";
import "./App.css";
import { createApplication, listApplications, updateApplication, deleteApplication } from "./api";
import { STATUSES, type Application, type ApplicationStatus } from "./types";

function App() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [url, setUrl] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCompany, setEditCompany] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editUrl, setEditUrl] = useState("");

  async function refresh() {
    try {
      setLoading(true);
      setApplications(await listApplications());
      setError(null);
    } catch {
      setError("Couldn't reach the API. Is `npm run dev` running in backend/?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function normalizeUrl(value: string): string {
    if (!value) return value;
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!company || !role) return;
    await createApplication({ company, role, url: normalizeUrl(url), notes: "" });
    setCompany("");
    setRole("");
    setUrl("");
    refresh();
  }

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    await updateApplication(id, { status });
    refresh();
  }

  async function handleDateChange(id: string, dateApplied: string) {
    if (!dateApplied) return;
    await updateApplication(id, { dateApplied });
    refresh();
  }

  async function handleDelete(id: string) {
    await deleteApplication(id);
    refresh();
  }

  function startEdit(app: Application) {
    setEditingId(app.id);
    setEditCompany(app.company);
    setEditRole(app.role);
    setEditUrl(app.url);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    if (!editCompany || !editRole) return;
    await updateApplication(id, {
      company: editCompany,
      role: editRole,
      url: normalizeUrl(editUrl),
    });
    setEditingId(null);
    refresh();
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Job Application Tracker</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} required />
        <input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} required />
        <input placeholder="Posting URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button type="submit">Add</button>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {loading && !error && <p>Loading…</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th>Company</th>
            <th>Role</th>
            <th>Status</th>
            <th>Applied</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) =>
            editingId === app.id ? (
              <tr key={app.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>
                  <input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
                </td>
                <td>
                  <input value={editRole} onChange={(e) => setEditRole(e.target.value)} />
                </td>
                <td colSpan={2}>
                  <input
                    placeholder="Posting URL"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button onClick={() => saveEdit(app.id)}>Save</button>
                  <button onClick={cancelEdit}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={app.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>{app.url ? <a href={app.url} target="_blank" rel="noreferrer">{app.company}</a> : app.company}</td>
                <td>{app.role}</td>
                <td>
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="date"
                    value={app.dateApplied.slice(0, 10)}
                    onChange={(e) => handleDateChange(app.id, e.target.value)}
                  />
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button onClick={() => startEdit(app)}>Edit</button>
                  <button onClick={() => handleDelete(app.id)}>Delete</button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      {!loading && !error && applications.length === 0 && <p>No applications yet — add one above.</p>}
    </main>
  );
}

export default App;
