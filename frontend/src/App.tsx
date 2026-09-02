import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import "./App.css";
import { createApplication, listApplications, updateApplication, deleteApplication } from "./api";
import { CONTACT_METHODS, STATUSES, type Application, type ApplicationStatus, type ContactMethod } from "./types";
import { fillTwcPdfPages } from "./twcPdf";
import { applicationsInWeek, isSaturday, mostRecentSaturday, twcPdfBaseName } from "./weekUtils";

function downloadBlob(bytes: Uint8Array, filename: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type EditForm = {
  company: string;
  role: string;
  url: string;
  activity: string;
  employerAddress: string;
  employerCityStateZip: string;
  employerPhone: string;
  contactMethod: ContactMethod;
  contactValue: string;
  personContacted: string;
};

const EMPTY_EDIT_FORM: EditForm = {
  company: "",
  role: "",
  url: "",
  activity: "",
  employerAddress: "",
  employerCityStateZip: "",
  employerPhone: "",
  contactMethod: "none",
  contactValue: "",
  personContacted: "",
};

const labelStyle: CSSProperties = { display: "flex", flexDirection: "column", fontSize: "0.8rem", gap: "0.2rem" };

function App() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [url, setUrl] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT_FORM);

  const [weekEnding, setWeekEnding] = useState(mostRecentSaturday());
  const [twcError, setTwcError] = useState<string | null>(null);
  const [twcBusy, setTwcBusy] = useState(false);

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

  async function handleExportTwcPdf() {
    setTwcError(null);
    if (!isSaturday(weekEnding)) {
      setTwcError("Week ending date must be a Saturday.");
      return;
    }

    const weekApps = applicationsInWeek(applications, weekEnding);
    if (weekApps.length === 0) {
      setTwcError("No applications found in that week.");
      return;
    }

    setTwcBusy(true);
    try {
      const ending = new Date(`${weekEnding}T00:00:00`);
      const pages = await fillTwcPdfPages(ending, weekApps);
      const base = twcPdfBaseName(weekEnding);
      pages.forEach((bytes, i) => {
        const suffix = pages.length > 1 ? `-page${i + 1}` : "";
        downloadBlob(bytes, `${base}${suffix}.pdf`);
      });
    } catch {
      setTwcError("Failed to generate PDF.");
    } finally {
      setTwcBusy(false);
    }
  }

  function startEdit(app: Application) {
    setEditingId(app.id);
    setEditForm({
      company: app.company,
      role: app.role,
      url: app.url,
      activity: app.activity || "Applied online",
      employerAddress: app.employerAddress,
      employerCityStateZip: app.employerCityStateZip,
      employerPhone: app.employerPhone,
      contactMethod: app.contactMethod || "none",
      contactValue: app.contactValue,
      personContacted: app.personContacted,
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function updateEditField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveEdit(id: string) {
    if (!editForm.company || !editForm.role) return;
    await updateApplication(id, { ...editForm, url: normalizeUrl(editForm.url) });
    setEditingId(null);
    refresh();
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Job Application Tracker</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} required />
        <input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} required />
        <input placeholder="Posting URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button type="submit">Add</button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <label style={labelStyle}>
          Week ending (Saturday)
          <input type="date" value={weekEnding} onChange={(e) => setWeekEnding(e.target.value)} />
        </label>
        <button onClick={handleExportTwcPdf} disabled={twcBusy} style={{ alignSelf: "flex-end" }}>
          {twcBusy ? "Generating…" : "Download TWC PDF"}
        </button>
        {twcError && <span style={{ color: "crimson" }}>{twcError}</span>}
      </div>

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
          {[...applications]
            .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied))
            .map((app) =>
            editingId === app.id ? (
              <tr key={app.id} style={{ borderBottom: "1px solid #eee" }}>
                <td colSpan={5} style={{ padding: "0.75rem 0.25rem", background: "#fafafa" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
                    <label style={labelStyle}>
                      Company
                      <input value={editForm.company} onChange={(e) => updateEditField("company", e.target.value)} />
                    </label>
                    <label style={labelStyle}>
                      Role
                      <input value={editForm.role} onChange={(e) => updateEditField("role", e.target.value)} />
                    </label>
                    <label style={labelStyle}>
                      Posting URL
                      <input value={editForm.url} onChange={(e) => updateEditField("url", e.target.value)} />
                    </label>

                    <label style={labelStyle}>
                      Work search activity
                      <input
                        placeholder="e.g. Applied online, Interviewed"
                        value={editForm.activity}
                        onChange={(e) => updateEditField("activity", e.target.value)}
                      />
                    </label>
                    <label style={labelStyle}>
                      Employer address
                      <input
                        placeholder="Street or website"
                        value={editForm.employerAddress}
                        onChange={(e) => updateEditField("employerAddress", e.target.value)}
                      />
                    </label>
                    <label style={labelStyle}>
                      Employer city, state, zip
                      <input
                        placeholder="Austin, TX 78741"
                        value={editForm.employerCityStateZip}
                        onChange={(e) => updateEditField("employerCityStateZip", e.target.value)}
                      />
                    </label>

                    <label style={labelStyle}>
                      Employer phone
                      <input
                        placeholder="512-555-1234"
                        value={editForm.employerPhone}
                        onChange={(e) => updateEditField("employerPhone", e.target.value)}
                      />
                    </label>
                    <label style={labelStyle}>
                      Contact method
                      <select
                        value={editForm.contactMethod}
                        onChange={(e) => updateEditField("contactMethod", e.target.value as ContactMethod)}
                      >
                        {CONTACT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={labelStyle}>
                      Contact value (email/fax)
                      <input
                        value={editForm.contactValue}
                        onChange={(e) => updateEditField("contactValue", e.target.value)}
                      />
                    </label>

                    <label style={labelStyle}>
                      Person contacted
                      <input
                        value={editForm.personContacted}
                        onChange={(e) => updateEditField("personContacted", e.target.value)}
                      />
                    </label>
                  </div>
                  <div style={{ marginTop: "0.6rem" }}>
                    <button onClick={() => saveEdit(app.id)}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </div>
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
