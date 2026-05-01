import { useState, useEffect, useCallback } from "react";

// ─── Single endpoint, all ops via ?action= ────────────────────
const API = "/api/handler";

const api = {
  getGigs: () => fetch(`${API}?action=gigs`).then(r => r.json()),
  getStats: () => fetch(`${API}?action=stats`).then(r => r.json()),
  createGig: (body) => fetch(`${API}?action=gigs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
  updateGig: (id, body) => fetch(`${API}?action=gig&id=${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteGig: (id) => fetch(`${API}?action=delete&id=${id}`, { method: "POST" }).then(r => r.json()),
  toggleConfirm: (id) => fetch(`${API}?action=confirm&id=${id}`, { method: "POST" }).then(r => r.json()),
};

const GIG_TYPES = ["Wedding", "Club Night", "Private Party", "Festival", "Corporate", "Acoustic Set", "Birthday", "Other"];

function payStatus(g) {
  if (g.paid >= g.fee) return "paid";
  if (g.paid > 0) return "partial";
  return "unpaid";
}
function fmt(n) { return "₹" + Number(n).toLocaleString("en-IN"); }
function monthKey(date) { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function monthLabel(key) { const [y, m] = key.split("-"); return new Date(y, m - 1, 1).toLocaleString("default", { month: "long", year: "numeric" }); }

function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: type === "error" ? "#2a1010" : "#0f2218", color: type === "error" ? "#e05c5c" : "#5bb974", border: `1px solid ${type === "error" ? "#e05c5c" : "#5bb974"}`, borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
      {message}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 0" }}>
      <div style={{ width: 28, height: 28, border: "3px solid #2a2a2a", borderTop: "3px solid #c98a3a", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  );
}

export default function App() {
  const [gigs, setGigs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState(null);
  const [filterMonth, setFilterMonth] = useState("all");
  const [toast, setToast] = useState(null);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const refresh = useCallback(async () => {
    try {
      const [gigsRes, statsRes] = await Promise.all([api.getGigs(), api.getStats()]);
      if (gigsRes.success) setGigs(gigsRes.data);
      if (statsRes.success) setStats(statsRes.data);
    } catch {
      showToast("Could not connect to server", "error");
    }
  }, []);

  useEffect(() => {
    (async () => { setLoading(true); await refresh(); setLoading(false); })();
  }, [refresh]);

  const months = [...new Set(gigs.map(g => monthKey(g.date)))].sort().reverse();
  const visibleGigs = filterMonth === "all" ? gigs : gigs.filter(g => monthKey(g.date) === filterMonth);
  const sortedGigs = [...visibleGigs].sort((a, b) => new Date(b.date) - new Date(a.date));

  async function saveGig(form) {
    try {
      const res = form._id
        ? await api.updateGig(form._id, form)
        : await api.createGig(form);
      if (!res.success) { showToast(res.message, "error"); return; }
      showToast(form._id ? "Gig updated!" : "Gig added!");
      await refresh();
      setScreen(null);
    } catch { showToast("Failed to save gig", "error"); }
  }

  async function deleteGig(id) {
    try {
      const res = await api.deleteGig(id);
      if (!res.success) { showToast(res.message, "error"); return; }
      showToast("Gig deleted");
      await refresh();
      setScreen(null);
    } catch { showToast("Failed to delete", "error"); }
  }

  async function toggleConfirm(id) {
    try {
      const res = await api.toggleConfirm(id);
      if (!res.success) { showToast(res.message, "error"); return; }
      showToast(res.data.confirmed ? "Marked confirmed!" : "Marked unconfirmed");
      await refresh();
      setScreen(prev => prev?.gig?._id === id ? { ...prev, gig: res.data } : prev);
    } catch { showToast("Failed to update", "error"); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#1a1a1a", color: "#e8e8e6", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", fontSize: 14 }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        input,select,button,textarea{font-family:inherit;}
        input:focus,select:focus,textarea:focus{outline:none;border-color:#c98a3a!important;box-shadow:0 0 0 3px rgba(201,138,58,.12);}
        button{-webkit-tap-highlight-color:transparent;cursor:pointer;}
        .tap:active{opacity:.65;transform:scale(.98);}
        .row:active{background:#252525!important;}
        ::-webkit-scrollbar{display:none;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes slideUp{from{transform:translateY(24px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        .fade-in{animation:slideUp .22s ease;}
        .chip-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;}
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} />}

      {screen?.type === "detail" && (
        <div className="fade-in" style={{ position: "fixed", inset: 0, background: "#1a1a1a", zIndex: 100, overflowY: "auto" }}>
          <GigDetail gig={screen.gig} onBack={() => setScreen(null)} onEdit={g => setScreen({ type: "form", gig: g })} onDelete={deleteGig} onToggleConfirm={toggleConfirm} />
        </div>
      )}
      {screen?.type === "form" && (
        <div className="fade-in" style={{ position: "fixed", inset: 0, background: "#1a1a1a", zIndex: 100, overflowY: "auto" }}>
          <GigForm gig={screen.gig} onSave={saveGig} onBack={() => setScreen(null)} />
        </div>
      )}

      <div style={{ paddingBottom: 80 }}>
        {loading ? <Spinner /> : <>
          {tab === "home" && <HomeScreen stats={stats} recentGigs={[...gigs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)} onGigTap={g => setScreen({ type: "detail", gig: g })} onViewAll={() => setTab("gigs")} />}
          {tab === "gigs" && <GigsScreen gigs={sortedGigs} months={months} filterMonth={filterMonth} setFilterMonth={setFilterMonth} onGigTap={g => setScreen({ type: "detail", gig: g })} />}
          {tab === "stats" && <StatsScreen stats={stats} />}
        </>}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#111", borderTop: "1px solid #252525", display: "flex", alignItems: "center", padding: "0 8px", zIndex: 50, height: 64 }}>
        {[{ id: "home", label: "Home", icon: "⊞" }, { id: "gigs", label: "Gigs", icon: "≡" }, { id: "stats", label: "Stats", icon: "↗" }].map(({ id, label, icon }) => (
          <button key={id} className="tap" onClick={() => setTab(id)} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 0", color: tab === id ? "#c98a3a" : "#555" }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === id ? 600 : 400 }}>{label}</span>
          </button>
        ))}
        <button className="tap" onClick={() => setScreen({ type: "form", gig: {} })}
          style={{ width: 46, height: 46, borderRadius: 23, background: "#c98a3a", border: "none", color: "#fff", fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(201,138,58,.4)", margin: "0 8px" }}>
          +
        </button>
      </div>
    </div>
  );
}

function HomeScreen({ stats, recentGigs, onGigTap, onViewAll }) {
  if (!stats) return <Spinner />;
  return (
    <div style={{ padding: "24px 16px 0" }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: "#666" }}>Welcome back Anix 👋</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>My Gigs</h1>
      </div>
      <div style={{ background: "#212121", borderRadius: 20, padding: 20, marginBottom: 12, border: "1px solid #2a2a2a" }}>
        <p style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Total Received</p>
        <p style={{ fontSize: 34, fontWeight: 700, marginBottom: 18 }}>{fmt(stats.totalEarned)}</p>
        <div style={{ height: 1, background: "#2a2a2a", marginBottom: 18 }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Pending</p>
            <p style={{ fontSize: 18, fontWeight: 600, color: "#e07b3a" }}>{fmt(stats.totalPending)}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Unconfirmed</p>
            <p style={{ fontSize: 18, fontWeight: 600, color: stats.unconfirmedCount > 0 ? "#a78bfa" : "#5bb974" }}>{stats.unconfirmedCount} gig{stats.unconfirmedCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>
      {stats.unconfirmedCount > 0 && (
        <div style={{ background: "#1e1828", border: "1px solid #3b2f6b", borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <p style={{ fontSize: 13, color: "#c4b5fd" }}><strong>{stats.unconfirmedCount}</strong> gig{stats.unconfirmedCount !== 1 ? "s" : ""} waiting for confirmation</p>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Recent Gigs</h2>
        <button className="tap" onClick={onViewAll} style={{ background: "none", border: "none", color: "#c98a3a", fontSize: 13 }}>See all</button>
      </div>
      {recentGigs.length === 0
        ? <p style={{ color: "#555", textAlign: "center", padding: "40px 0", fontSize: 13 }}>No gigs yet. Tap + to add one!</p>
        : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{recentGigs.map(g => <GigCard key={g._id} gig={g} onTap={onGigTap} />)}</div>
      }
    </div>
  );
}

function GigsScreen({ gigs, months, filterMonth, setFilterMonth, onGigTap }) {
  return (
    <div style={{ padding: "24px 16px 0" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>All Gigs</h1>
      <div className="chip-scroll" style={{ marginBottom: 16 }}>
        {[{ key: "all", label: "All" }, ...months.map(m => ({ key: m, label: monthLabel(m).split(" ")[0] + " " + monthLabel(m).split(" ")[1] }))].map(({ key, label }) => (
          <button key={key} className="tap" onClick={() => setFilterMonth(key)}
            style={{ flexShrink: 0, padding: "7px 16px", borderRadius: 20, border: filterMonth === key ? "none" : "1px solid #2a2a2a", fontSize: 13, fontWeight: 500, background: filterMonth === key ? "#c98a3a" : "#212121", color: filterMonth === key ? "#fff" : "#888" }}>
            {label}
          </button>
        ))}
      </div>
      {gigs.length === 0
        ? <p style={{ color: "#555", textAlign: "center", padding: "60px 0", fontSize: 13 }}>No gigs found</p>
        : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{gigs.map(g => <GigCard key={g._id} gig={g} onTap={onGigTap} />)}</div>
      }
    </div>
  );
}

function StatsScreen({ stats }) {
  if (!stats) return <Spinner />;
  const maxEarned = Math.max(...(stats.monthly || []).map(m => m.earned), 1);
  return (
    <div style={{ padding: "24px 16px 0" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Stats</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[{ label: "Total Received", val: fmt(stats.totalEarned), color: "#5bb974" }, { label: "Total Pending", val: fmt(stats.totalPending), color: "#e07b3a" }, { label: "Confirmed", val: stats.confirmedCount, color: "#5bb974" }, { label: "Unconfirmed", val: stats.unconfirmedCount, color: "#a78bfa" }].map((s, i) => (
          <div key={i} style={{ background: "#212121", borderRadius: 16, padding: "16px 14px", border: "1px solid #2a2a2a" }}>
            <p style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</p>
          </div>
        ))}
      </div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Monthly Breakdown</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(stats.monthly || []).map(m => (
          <div key={m.key} style={{ background: "#212121", borderRadius: 16, padding: 16, border: "1px solid #2a2a2a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{monthLabel(m.key)}</p>
                <p style={{ fontSize: 11, color: "#555", marginTop: 3 }}>{m.count} gig{m.count !== 1 ? "s" : ""}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#5bb974" }}>{fmt(m.earned)}</p>
                {m.pending > 0 && <p style={{ fontSize: 11, color: "#e07b3a", marginTop: 3 }}>{fmt(m.pending)} pending</p>}
              </div>
            </div>
            <div style={{ height: 4, background: "#2a2a2a", borderRadius: 2 }}>
              <div style={{ height: 4, width: `${(m.earned / maxEarned) * 100}%`, background: "#5bb974", borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GigCard({ gig, onTap }) {
  const status = payStatus(gig);
  const badge = status === "paid" ? { label: "Paid", color: "#5bb974", bg: "#1a2e1e" }
    : status === "partial" ? { label: `${fmt(gig.fee - gig.paid)} due`, color: "#e07b3a", bg: "#2a1e10" }
      : { label: "Unpaid", color: "#e05c5c", bg: "#2a1010" };
  return (
    <button className="tap row" onClick={() => onTap(gig)}
      style={{ width: "100%", background: "#212121", border: "1px solid #2a2a2a", borderRadius: 16, padding: "14px 16px", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <p style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "white" }}>{gig.client}</p>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: gig.confirmed ? "#5bb974" : "#a78bfa", flexShrink: 0 }} />
        </div>
        <p style={{ fontSize: 12, color: "#555" }}>{new Date(gig.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {gig.type}</p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 5 }}>{fmt(gig.fee)}</p>
        <span style={{ fontSize: 11, color: badge.color, background: badge.bg, padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>{badge.label}</span>
      </div>
    </button>
  );
}

function GigDetail({ gig, onBack, onEdit, onDelete, onToggleConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const status = payStatus(gig);
  const pending = gig.fee - gig.paid;
  const payBadge = status === "paid" ? { label: "Fully Paid", color: "#5bb974", bg: "#1a2e1e" }
    : status === "partial" ? { label: `${fmt(pending)} Pending`, color: "#e07b3a", bg: "#2a1e10" }
      : { label: "Unpaid", color: "#e05c5c", bg: "#2a1010" };

  async function handleDelete() {
    if (!window.confirm("Delete this gig?")) return;
    setDeleting(true);
    await onDelete(gig._id);
    setDeleting(false);
  }

  return (
    <div style={{ padding: "20px 16px" }}>
      <button className="tap" onClick={onBack} style={{ background: "none", border: "none", color: "#c98a3a", fontSize: 14, padding: 0, marginBottom: 24 }}>← Back</button>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "white" }}>{gig.client}</h1>
          <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{gig.type} · {new Date(gig.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: gig.confirmed ? "#0f2218" : "#1e1828", border: `1px solid ${gig.confirmed ? "#1e4d30" : "#3b2f6b"}`, borderRadius: 14, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Gig Status</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: 4, background: gig.confirmed ? "#5bb974" : "#a78bfa" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: gig.confirmed ? "#5bb974" : "#a78bfa" }}>{gig.confirmed ? "Confirmed" : "Unconfirmed"}</span>
          </div>
        </div>
        <div style={{ flex: 1, background: payBadge.bg, border: "1px solid #2a2a2a", borderRadius: 14, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Payment</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: 4, background: payBadge.color }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: payBadge.color }}>{payBadge.label}</span>
          </div>
        </div>
      </div>

      <button className="tap" onClick={() => onToggleConfirm(gig._id)}
        style={{ width: "100%", borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 600, marginBottom: 16, border: "none", background: gig.confirmed ? "#1e1828" : "#0f2218", color: gig.confirmed ? "#a78bfa" : "#5bb974" }}>
        {gig.confirmed ? "✕  Mark as Unconfirmed" : "✓  Mark as Confirmed"}
      </button>

      <div style={{ background: "#212121", borderRadius: 18, overflow: "hidden", marginBottom: 16, border: "1px solid #2a2a2a" }}>
        {[{ label: "Total Fee", value: fmt(gig.fee), color: "#e8e8e6" }, { label: "Received", value: fmt(gig.paid), color: "#5bb974" }, { label: "Balance Due", value: fmt(Math.max(0, pending)), color: pending > 0 ? "#e07b3a" : "#5bb974" }].map((row, i, arr) => (
          <div key={i} style={{ padding: "16px 18px", borderBottom: i < arr.length - 1 ? "1px solid #2a2a2a" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#888" }}>{row.label}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: row.color }}>{row.value}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#555", marginBottom: 8 }}>
          <span>Payment progress</span><span>{Math.round((gig.paid / gig.fee) * 100)}%</span>
        </div>
        <div style={{ height: 6, background: "#2a2a2a", borderRadius: 3 }}>
          <div style={{ height: 6, width: `${Math.min(100, (gig.paid / gig.fee) * 100)}%`, background: "#5bb974", borderRadius: 3 }} />
        </div>
      </div>

      {gig.notes && (
        <div style={{ background: "#212121", borderRadius: 14, padding: "14px 16px", marginBottom: 20, border: "1px solid #2a2a2a" }}>
          <p style={{ fontSize: 11, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</p>
          <p style={{ fontSize: 14, color: "#aaa" }}>{gig.notes}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="tap" onClick={() => onEdit(gig)} style={{ flex: 1, background: "#212121", border: "1px solid #2a2a2a", color: "#e8e8e6", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 500 }}>Edit Gig</button>
        <button className="tap" onClick={handleDelete} disabled={deleting} style={{ flex: 1, background: "#2a1010", border: "1px solid #3a1515", color: "#e05c5c", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 500, opacity: deleting ? 0.5 : 1 }}>
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}

function GigForm({ gig, onSave, onBack }) {
  const [form, setForm] = useState({
    client: gig?.client || "",
    date: gig?.date ? new Date(gig.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    type: gig?.type || "Wedding",
    fee: gig?.fee || "",
    paid: gig?.paid || 0,
    notes: gig?.notes || "",
    confirmed: gig?.confirmed ?? false,
    _id: gig?._id || null,
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  const pending = Math.max(0, +form.fee - +form.paid);

  async function handleSave() {
    if (!form.client || !form.fee || !form.date) return alert("Fill in Client, Date & Fee.");
    setSaving(true);
    await onSave({ ...form, fee: +form.fee, paid: +form.paid });
    setSaving(false);
  }

  const inp = { width: "100%", background: "#212121", border: "1px solid #2a2a2a", color: "#e8e8e6", padding: "13px 14px", borderRadius: 12, fontSize: 15 };
  const lbl = { display: "block", fontSize: 12, color: "#666", marginBottom: 7, fontWeight: 500 };

  return (
    <div style={{ padding: "20px 16px" }}>
      <button className="tap" onClick={onBack} style={{ background: "none", border: "none", color: "#c98a3a", fontSize: 14, padding: 0, marginBottom: 24 }}>← Back</button>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>{form._id ? "Edit Gig" : "New Gig"}</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={lbl}>Client / Event</label>
          <input style={inp} value={form.client} onChange={e => set("client", e.target.value)} placeholder="Event Type" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Date</label>
            <input style={inp} type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Type</label>
            <select style={inp} value={form.type} onChange={e => set("type", e.target.value)}>
              {GIG_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={lbl}>Gig Confirmation</label>
          <div style={{ display: "flex", gap: 10 }}>
            {[{ val: true, label: "✓  Confirmed", color: "#5bb974", activeBg: "#0f2218", activeBorder: "#1e4d30" }, { val: false, label: "?  Unconfirmed", color: "#a78bfa", activeBg: "#1e1828", activeBorder: "#3b2f6b" }].map(opt => (
              <button key={String(opt.val)} className="tap" onClick={() => set("confirmed", opt.val)}
                style={{ flex: 1, padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 600, background: form.confirmed === opt.val ? opt.activeBg : "#212121", border: `1px solid ${form.confirmed === opt.val ? opt.activeBorder : "#2a2a2a"}`, color: form.confirmed === opt.val ? opt.color : "#555" }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={lbl}>Notes</label>
          <input style={inp} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any notes..." />
        </div>

        <div style={{ background: "#212121", borderRadius: 18, padding: 16, border: "1px solid #2a2a2a" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Payment</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={lbl}>Total Fee (₹)</label>
              <input style={{ ...inp, background: "#1a1a1a" }} type="number" value={form.fee} onChange={e => set("fee", e.target.value)} placeholder="15000" />
            </div>
            <div>
              <label style={lbl}>Amount Received (₹)</label>
              <input style={{ ...inp, background: "#1a1a1a" }} type="number" value={form.paid} onChange={e => set("paid", e.target.value)} placeholder="0" />
            </div>
          </div>
          {form.fee > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #2a2a2a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "#666" }}>Balance Due</span>
                <span style={{ fontWeight: 700, color: pending > 0 ? "#e07b3a" : "#5bb974" }}>{fmt(pending)}</span>
              </div>
              <div style={{ height: 4, background: "#2a2a2a", borderRadius: 2, marginTop: 10 }}>
                <div style={{ height: 4, width: `${Math.min(100, +form.fee > 0 ? (+form.paid / +form.fee) * 100 : 0)}%`, background: "#5bb974", borderRadius: 2 }} />
              </div>
            </div>
          )}
        </div>

        <button className="tap" onClick={handleSave} disabled={saving}
          style={{ background: "#c98a3a", border: "none", color: "#fff", borderRadius: 16, padding: 17, fontSize: 16, fontWeight: 600, marginTop: 4, marginBottom: 16, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : form._id ? "Save Changes" : "Add Gig"}
        </button>
      </div>
    </div>
  );
}