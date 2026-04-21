import { useState } from "react";

const SAMPLE_GIGS = [
  { id: 1, client: "Ritz Wedding Hall", date: "2026-04-02", type: "Wedding", fee: 15000, paid: 5000, notes: "3 hour set" },
  { id: 2, client: "The Jazz Lounge", date: "2026-04-05", type: "Club Night", fee: 8000, paid: 8000, notes: "" },
  { id: 3, client: "Priya & Arjun", date: "2026-04-08", type: "Private Party", fee: 12000, paid: 7000, notes: "Balance expected soon" },
  { id: 4, client: "City Music Fest", date: "2026-04-11", type: "Festival", fee: 20000, paid: 0, notes: "Payment after event" },
  { id: 5, client: "Hotel Grandeur", date: "2026-03-20", type: "Corporate", fee: 18000, paid: 18000, notes: "" },
  { id: 6, client: "Sunflower Cafe", date: "2026-03-14", type: "Acoustic Set", fee: 5000, paid: 5000, notes: "" },
  { id: 7, client: "Mehta Family", date: "2026-03-28", type: "Birthday", fee: 10000, paid: 3000, notes: "Remaining ₹7000 pending" },
];

const GIG_TYPES = ["Wedding", "Club Night", "Private Party", "Festival", "Corporate", "Acoustic Set", "Birthday", "Other"];

function payStatus(g) {
  if (g.paid >= g.fee) return "paid";
  if (g.paid > 0) return "partial";
  return "unpaid";
}
function fmt(n) { return "₹" + Number(n).toLocaleString("en-IN"); }
function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key) {
  const [y, m] = key.split("-");
  return new Date(y, m - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
}
export default function App() {
  const [gigs, setGigs] = useState(SAMPLE_GIGS);
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState(null); // null | {type, gig}
  const [filterMonth, setFilterMonth] = useState("all");

  const months = [...new Set(gigs.map(g => monthKey(g.date)))].sort().reverse();
  const visibleGigs = filterMonth === "all" ? gigs : gigs.filter(g => monthKey(g.date) === filterMonth);
  const sortedGigs = [...visibleGigs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalEarned = gigs.reduce((s, g) => s + g.paid, 0);
  const totalPending = gigs.reduce((s, g) => s + Math.max(0, g.fee - g.paid), 0);
  const monthlyData = months.map(mk => {
    const mg = gigs.filter(g => monthKey(g.date) === mk);
    return { key: mk, label: monthLabel(mk), earned: mg.reduce((s, g) => s + g.paid, 0), pending: mg.reduce((s, g) => s + Math.max(0, g.fee - g.paid), 0), total: mg.reduce((s, g) => s + g.fee, 0), count: mg.length };
  });

  function saveGig(g) {
    if (g.id) setGigs(prev => prev.map(x => x.id === g.id ? g : x));
    else setGigs(prev => [...prev, { ...g, id: Date.now() }]);
    setScreen(null);
  }
  function deleteGig(id) { setGigs(prev => prev.filter(g => g.id !== id)); setScreen(null); }

  return (
    <div style={{ minHeight: "100vh", background: "#1a1a1a", color: "#e8e8e6", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 14 }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select, button, textarea { font-family: inherit; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #c98a3a !important; box-shadow: 0 0 0 3px rgba(201,138,58,0.12); }
        button { -webkit-tap-highlight-color: transparent; cursor: pointer; }
        .tap:active { opacity: 0.65; transform: scale(0.98); }
        .row:active { background: #252525 !important; }
        ::-webkit-scrollbar { display: none; }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .fade-in { animation: slideUp 0.22s ease; }
        .chip-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; }
        .chip-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Overlay screens */}
      {screen?.type === "detail" && (
        <div className="fade-in" style={{ position: "fixed", inset: 0, background: "#1a1a1a", zIndex: 100, overflowY: "auto" }}>
          <GigDetail gig={screen.gig} onBack={() => setScreen(null)} onEdit={g => setScreen({ type: "form", gig: g })} onDelete={deleteGig} />
        </div>
      )}
      {screen?.type === "form" && (
        <div className="fade-in" style={{ position: "fixed", inset: 0, background: "#1a1a1a", zIndex: 100, overflowY: "auto" }}>
          <GigForm gig={screen.gig} onSave={saveGig} onBack={() => setScreen(null)} />
        </div>
      )}

      {/* Main app */}
      <div style={{ paddingBottom: 80 }}>
        {tab === "home" && <HomeScreen totalEarned={totalEarned} totalPending={totalPending} recentGigs={[...gigs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)} onGigTap={g => setScreen({ type: "detail", gig: g })} onViewAll={() => setTab("gigs")} />}
        {tab === "gigs" && <GigsScreen gigs={sortedGigs} months={months} filterMonth={filterMonth} setFilterMonth={setFilterMonth} onGigTap={g => setScreen({ type: "detail", gig: g })} />}
        {tab === "stats" && <StatsScreen monthlyData={monthlyData} totalEarned={totalEarned} totalPending={totalPending} gigCount={gigs.length} />}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#111", borderTop: "1px solid #252525", display: "flex", alignItems: "center", padding: "0 8px", zIndex: 50, height: 64 }}>
        {[
          { id: "home", label: "Home", icon: "⊞" },
          { id: "gigs", label: "Gigs", icon: "≡" },
          { id: "stats", label: "Stats", icon: "↗" },
        ].map(({ id, label, icon }) => (
          <button key={id} className="tap" onClick={() => setTab(id)}
            style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 0", color: tab === id ? "#c98a3a" : "#555" }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === id ? 600 : 400 }}>{label}</span>
          </button>
        ))}
        {/* Add button */}
        <button className="tap" onClick={() => setScreen({ type: "form", gig: {} })}
          style={{ width: 46, height: 46, borderRadius: 23, background: "#c98a3a", border: "none", color: "#fff", fontSize: 24, fontWeight: 300, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(201,138,58,0.4)", margin: "0 8px" }}>
          +
        </button>
      </div>
    </div>
  );
}

function HomeScreen({ totalEarned, totalPending, recentGigs, onGigTap, onViewAll }) {
  return (
    <div style={{ padding: "24px 16px 0" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: "#666" }}>Good evening 👋</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>My Gigs</h1>
      </div>

      {/* Hero card */}
      <div style={{ background: "#212121", borderRadius: 20, padding: 20, marginBottom: 12, border: "1px solid #2a2a2a" }}>
        <p style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Total Received</p>
        <p style={{ fontSize: 34, fontWeight: 700, marginBottom: 18 }}>{fmt(totalEarned)}</p>
        <div style={{ height: 1, background: "#2a2a2a", marginBottom: 18 }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Pending</p>
            <p style={{ fontSize: 18, fontWeight: 600, color: "#e07b3a" }}>{fmt(totalPending)}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>This month</p>
            <p style={{ fontSize: 18, fontWeight: 600 }}>{recentGigs.length} gigs</p>
          </div>
        </div>
      </div>

      {/* Recent */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Recent Gigs</h2>
        <button className="tap" onClick={onViewAll} style={{ background: "none", border: "none", color: "#c98a3a", fontSize: 13 }}>See all</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recentGigs.map(g => <GigCard key={g.id} gig={g} onTap={onGigTap} />)}
      </div>
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
            style={{ flexShrink: 0, padding: "7px 16px", borderRadius: 20, border: "none", fontSize: 13, fontWeight: 500, background: filterMonth === key ? "#c98a3a" : "#212121", color: filterMonth === key ? "#fff" : "#888", border: filterMonth === key ? "none" : "1px solid #2a2a2a" }}>
            {label}
          </button>
        ))}
      </div>
      {gigs.length === 0
        ? <div style={{ textAlign: "center", color: "#555", padding: "60px 0", fontSize: 13 }}>No gigs found</div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{gigs.map(g => <GigCard key={g.id} gig={g} onTap={onGigTap} />)}</div>
      }
    </div>
  );
}

function StatsScreen({ monthlyData, totalEarned, totalPending, gigCount }) {
  const maxEarned = Math.max(...monthlyData.map(m => m.earned), 1);
  return (
    <div style={{ padding: "24px 16px 0" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Stats</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Total Received", val: fmt(totalEarned), color: "#5bb974" },
          { label: "Total Pending", val: fmt(totalPending), color: "#e07b3a" },
          { label: "Total Gigs", val: gigCount, color: "#e8e8e6" },
          { label: "This Month", val: fmt(monthlyData[0]?.earned || 0), color: "#c98a3a" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#212121", borderRadius: 16, padding: "16px 14px", border: "1px solid #2a2a2a" }}>
            <p style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Monthly Breakdown</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {monthlyData.map(m => (
          <div key={m.key} style={{ background: "#212121", borderRadius: 16, padding: 16, border: "1px solid #2a2a2a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{m.label}</p>
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
  const badge = status === "paid"
    ? { label: "Paid", color: "#5bb974", bg: "#1a2e1e" }
    : status === "partial"
      ? { label: `${fmt(gig.fee - gig.paid)} due`, color: "#e07b3a", bg: "#2a1e10" }
      : { label: "Unpaid", color: "#e05c5c", bg: "#2a1010" };

  return (
    <button className="tap row" onClick={() => onTap(gig)}
      style={{ width: "100%", background: "#212121", border: "1px solid #2a2a2a", borderRadius: 16, padding: "14px 16px", textAlign: "left", display: "flex", alignItems: "center", gap: 12, transition: "background 0.1s" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "white" }}>{gig.client}</p>
        <p style={{ fontSize: 12, color: "#555" }}>{new Date(gig.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", color: "white" })} · {gig.type}</p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 5, color: "white" }}>{fmt(gig.fee)}</p>
        <span style={{ fontSize: 11, color: badge.color, background: badge.bg, padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>{badge.label}</span>
      </div>
    </button>
  );
}

function GigDetail({ gig, onBack, onEdit, onDelete }) {
  const status = payStatus(gig);
  const pending = gig.fee - gig.paid;
  const badge = status === "paid"
    ? { label: "Fully Paid", color: "#5bb974", bg: "#1a2e1e" }
    : status === "partial"
      ? { label: `${fmt(pending)} Pending`, color: "#e07b3a", bg: "#2a1e10" }
      : { label: "Unpaid", color: "#e05c5c", bg: "#2a1010" };

  return (
    <div style={{ padding: "20px 16px" }}>
      <button className="tap" onClick={onBack}
        style={{ background: "none", border: "none", color: "#c98a3a", fontSize: 14, display: "flex", alignItems: "center", gap: 6, padding: 0, marginBottom: 24 }}>
        ← Back
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{gig.client}</h1>
          <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{gig.type} · {new Date(gig.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {/* Status pill */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: badge.bg, padding: "9px 16px", borderRadius: 12, marginBottom: 24 }}>
        <div style={{ width: 7, height: 7, borderRadius: 4, background: badge.color }} />
        <span style={{ color: badge.color, fontSize: 13, fontWeight: 600 }}>{badge.label}</span>
      </div>

      {/* Payment breakdown */}
      <div style={{ background: "#212121", borderRadius: 18, overflow: "hidden", marginBottom: 16, border: "1px solid #2a2a2a" }}>
        {[
          { label: "Total Fee", value: fmt(gig.fee), color: "#e8e8e6" },
          { label: "Received", value: fmt(gig.paid), color: "#5bb974" },
          { label: "Balance Due", value: fmt(Math.max(0, pending)), color: pending > 0 ? "#e07b3a" : "#5bb974" },
        ].map((row, i, arr) => (
          <div key={i} style={{ padding: "16px 18px", borderBottom: i < arr.length - 1 ? "1px solid #2a2a2a" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#888" }}>{row.label}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: row.color }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#555", marginBottom: 8 }}>
          <span>Payment progress</span>
          <span>{Math.round((gig.paid / gig.fee) * 100)}%</span>
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
        <button className="tap" onClick={() => onEdit(gig)}
          style={{ flex: 1, background: "#212121", border: "1px solid #2a2a2a", color: "#e8e8e6", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 500 }}>
          Edit Gig
        </button>
        <button className="tap" onClick={() => onDelete(gig.id)}
          style={{ flex: 1, background: "#2a1010", border: "1px solid #3a1515", color: "#e05c5c", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 500 }}>
          Delete
        </button>
      </div>
    </div>
  );
}

function GigForm({ gig, onSave, onBack }) {
  const [form, setForm] = useState({
    client: gig?.client || "", date: gig?.date || new Date().toISOString().slice(0, 10),
    type: gig?.type || "Wedding", fee: gig?.fee || "", paid: gig?.paid || 0,
    notes: gig?.notes || "", id: gig?.id || null,
  });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  const pending = Math.max(0, +form.fee - +form.paid);

  function handleSave() {
    if (!form.client || !form.fee || !form.date) return alert("Fill in Client, Date & Fee.");
    onSave({ ...form, fee: +form.fee, paid: +form.paid });
  }

  const inp = { width: "100%", background: "#212121", border: "1px solid #2a2a2a", color: "#e8e8e6", padding: "13px 14px", borderRadius: 12, fontSize: 15, transition: "border-color 0.15s, box-shadow 0.15s" };
  const lbl = { display: "block", fontSize: 12, color: "#666", marginBottom: 7, fontWeight: 500 };

  return (
    <div style={{ padding: "20px 16px" }}>
      <button className="tap" onClick={onBack}
        style={{ background: "none", border: "none", color: "#c98a3a", fontSize: 14, padding: 0, marginBottom: 24 }}>
        ← Back
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>{form.id ? "Edit Gig" : "New Gig"}</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={lbl}>Client / Event</label>
          <input style={inp} value={form.client} onChange={e => set("client", e.target.value)} placeholder="e.g. Priya & Rajan Wedding" />
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
          <label style={lbl}>Notes</label>
          <input style={inp} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any notes..." />
        </div>

        {/* Payment section */}
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
                <div style={{ height: 4, width: `${Math.min(100, form.fee > 0 ? (+form.paid / +form.fee) * 100 : 0)}%`, background: "#5bb974", borderRadius: 2 }} />
              </div>
            </div>
          )}
        </div>

        <button className="tap" onClick={handleSave}
          style={{ background: "#c98a3a", border: "none", color: "#fff", borderRadius: 16, padding: 17, fontSize: 16, fontWeight: 600, marginTop: 4, marginBottom: 16 }}>
          {form.id ? "Save Changes" : "Add Gig"}
        </button>
      </div>
    </div>
  );
}
