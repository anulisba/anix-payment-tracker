import { useState, useEffect, useCallback } from "react";

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

const TYPE_COLORS = {
  "Wedding": { bg: "#1a1f3a", border: "#3b4a8a", text: "#6b8cff" },
  "Club Night": { bg: "#1f1a2e", border: "#5b3a8a", text: "#b06bff" },
  "Private Party": { bg: "#1a2e1f", border: "#2a6b3a", text: "#5bb974" },
  "Festival": { bg: "#2e1f1a", border: "#8a4a2a", text: "#e07b3a" },
  "Corporate": { bg: "#1a2a2e", border: "#2a6b7a", text: "#4bbfd4" },
  "Acoustic Set": { bg: "#2e2a1a", border: "#8a762a", text: "#d4b94b" },
  "Birthday": { bg: "#2e1a1f", border: "#8a2a4a", text: "#e05c7a" },
  "Other": { bg: "#212121", border: "#444", text: "#888" },
};

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
      const res = form._id ? await api.updateGig(form._id, form) : await api.createGig(form);
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

  function openAddWithDate(dateStr) {
    setScreen({ type: "form", gig: { date: dateStr } });
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
        .cal-cell:hover { border-color: #c98a3a !important; }
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
          {tab === "calendar" && <CalendarScreen gigs={gigs} onGigTap={g => setScreen({ type: "detail", gig: g })} onAddGig={openAddWithDate} />}
          {tab === "stats" && <StatsScreen stats={stats} />}
        </>}
      </div>

      {/* Bottom nav — 4 tabs + FAB */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#111", borderTop: "1px solid #252525", display: "flex", alignItems: "center", padding: "0 2px", zIndex: 50, height: 64 }}>
        {[
          { id: "home", label: "Home", icon: <HomeIcon active={tab === "home"} /> },
          { id: "gigs", label: "Gigs", icon: <ListIcon active={tab === "gigs"} /> },
          { id: "calendar", label: "Calendar", icon: <CalIcon active={tab === "calendar"} /> },
          { id: "stats", label: "Stats", icon: <ChartIcon active={tab === "stats"} /> },
        ].map(({ id, label, icon }) => (
          <button key={id} className="tap" onClick={() => setTab(id)}
            style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 0", color: tab === id ? "#c98a3a" : "#555" }}>
            {icon}
            <span style={{ fontSize: 9, fontWeight: tab === id ? 600 : 400 }}>{label}</span>
          </button>
        ))}
        <button className="tap" onClick={() => setScreen({ type: "form", gig: {} })}
          style={{ width: 44, height: 44, borderRadius: 22, background: "#c98a3a", border: "none", color: "#fff", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(201,138,58,.4)", margin: "0 4px", flexShrink: 0 }}>
          +
        </button>
      </div>
    </div>
  );
}

// ─── Calendar Screen ──────────────────────────────────────────
function CalendarScreen({ gigs, onGigTap, onAddGig }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [dayModal, setDayModal] = useState(null); // {day, gigs[]}

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" });

  // Build gigsByDay map
  const gigsByDay = {};
  gigs.forEach(g => {
    const d = new Date(g.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!gigsByDay[day]) gigsByDay[day] = [];
      gigsByDay[day].push(g);
    }
  });

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  // Grid cells
  const cells = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  function handleDayTap(day) {
    const dayGigs = gigsByDay[day] || [];
    if (dayGigs.length === 0) {
      // Empty day → open add form with date prefilled
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      onAddGig(iso);
    } else if (dayGigs.length === 1) {
      onGigTap(dayGigs[0]);
    } else {
      setDayModal({ day, gigs: dayGigs });
    }
  }

  return (
    <div style={{ padding: "24px 12px 0", paddingBottom: 16 }}>

      {/* Day modal for multiple gigs */}
      {dayModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "flex-end" }}
          onClick={() => setDayModal(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#1e1e1e", borderRadius: "20px 20px 0 0", padding: "20px 16px 32px", width: "100%", border: "1px solid #2a2a2a" }}>
            <div style={{ width: 40, height: 4, background: "#333", borderRadius: 2, margin: "0 auto 18px" }} />
            <p style={{ fontSize: 13, color: "#666", marginBottom: 14 }}>
              {new Date(year, month, dayModal.day).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dayModal.gigs.map(g => {
                const tc = TYPE_COLORS[g.type] || TYPE_COLORS["Other"];
                return (
                  <button key={g._id} className="tap"
                    onClick={() => { setDayModal(null); onGigTap(g); }}
                    style={{ background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 14, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#e8e8e6", marginBottom: 3 }}>{g.client}</p>
                      <p style={{ fontSize: 11, color: tc.text }}>{g.type} · {g.confirmed ? "Confirmed" : "Unconfirmed"}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#e8e8e6" }}>{fmt(g.fee)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Month nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, padding: "0 4px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Calendar</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button className="tap" onClick={prevMonth}
            style={{ background: "#212121", border: "1px solid #2a2a2a", color: "#e8e8e6", width: 32, height: 32, borderRadius: 9, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#e8e8e6", minWidth: 124, textAlign: "center" }}>{monthName}</span>
          <button className="tap" onClick={nextMonth}
            style={{ background: "#212121", border: "1px solid #2a2a2a", color: "#e8e8e6", width: 32, height: 32, borderRadius: 9, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: 2,
          marginBottom: 2,
          width: "100%",
        }}
      >
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10, color: "#555", fontWeight: 600, paddingBottom: 6 }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: 2,
          width: "100%",
        }}
      >
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} style={{ minHeight: 68 }} />;

          const dayGigs = gigsByDay[day] || [];
          const hasGigs = dayGigs.length > 0;
          const todayCell = isToday(day);
          // Use first gig's type color if any
          const firstColor = hasGigs ? (TYPE_COLORS[dayGigs[0].type] || TYPE_COLORS["Other"]) : null;

          return (
            <button key={day} className="cal-cell tap"
              onClick={() => handleDayTap(day)}
              style={{
                minHeight: 68,
                width: "100%",
                boxSizing: "border-box",
                overflow: "hidden",

                background: hasGigs ? firstColor.bg : "#181818",
                border: `1px solid ${todayCell ? "#c98a3a" : hasGigs ? firstColor.border : "#222"}`,
                borderRadius: 9,
                padding: "5px 4px 4px",

                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: 2,

                transition: "border-color 0.12s",
              }}>

              {/* Day number */}
              <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: 2, marginBottom: 2 }}>
                <span style={{
                  fontSize: 11, fontWeight: todayCell ? 700 : 500, lineHeight: 1,
                  color: todayCell ? "#c98a3a" : hasGigs ? "#ccc" : "#444",
                  background: todayCell ? "rgba(201,138,58,0.15)" : "transparent",
                  borderRadius: 4, padding: "1px 3px",
                }}>{day}</span>
              </div>

              {/* Gig name tiles — show up to 2 */}
              {dayGigs.slice(0, 2).map((g, i) => {
                const tc = TYPE_COLORS[g.type] || TYPE_COLORS["Other"];
                return (
                  <div key={i} style={{
                    background: tc.bg, border: `1px solid ${tc.border}`,
                    borderRadius: 4, padding: "2px 3px",
                    fontSize: 8, color: tc.text, fontWeight: 600,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    lineHeight: 1.5,
                  }}>
                    {g.client.length > 9 ? g.client.slice(0, 8) + "…" : g.client}
                  </div>
                );
              })}

              {/* +N overflow */}
              {dayGigs.length > 2 && (
                <div style={{ fontSize: 8, color: "#666", textAlign: "center", marginTop: 1 }}>+{dayGigs.length - 2}</div>
              )}

              {/* Empty day hint */}
              {!hasGigs && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 14, color: "#2a2a2a" }}>+</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Color legend */}
      <div style={{ marginTop: 16, padding: "12px", background: "#181818", borderRadius: 12, border: "1px solid #222" }}>
        <p style={{ fontSize: 9, color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Type Colors</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(TYPE_COLORS).filter(([k]) => k !== "Other").map(([type, tc]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: tc.text }} />
              <span style={{ fontSize: 9, color: "#777" }}>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* This month list */}
      {Object.keys(gigsByDay).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 10 }}>
            {monthName} — {Object.values(gigsByDay).flat().length} gig{Object.values(gigsByDay).flat().length !== 1 ? "s" : ""}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(gigsByDay)
              .sort(([a], [b]) => +a - +b)
              .flatMap(([day, gs]) => gs.map(g => {
                const tc = TYPE_COLORS[g.type] || TYPE_COLORS["Other"];
                const status = payStatus(g);
                const payColor = status === "paid" ? "#5bb974" : status === "partial" ? "#e07b3a" : "#e05c5c";
                const payLabel = status === "paid" ? "Paid" : status === "partial" ? "Partial" : "Unpaid";
                return (
                  <button key={g._id} className="tap"
                    onClick={() => onGigTap(g)}
                    style={{ background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                    <div style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: tc.text, lineHeight: 1 }}>{day}</div>
                      <div style={{ fontSize: 9, color: "#666", marginTop: 2, textTransform: "uppercase" }}>
                        {new Date(year, month, +day).toLocaleString("default", { weekday: "short" })}
                      </div>
                    </div>
                    <div style={{ width: 1, height: 32, background: tc.border, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#e8e8e6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.client}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                        <span style={{ fontSize: 10, color: "#666" }}>{g.type}</span>
                        <span style={{ fontSize: 8, color: "#333" }}>●</span>
                        <span style={{ fontSize: 10, color: g.confirmed ? "#5bb974" : "#a78bfa" }}>{g.confirmed ? "Confirmed" : "Unconfirmed"}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#e8e8e6" }}>{fmt(g.fee)}</p>
                      <span style={{ fontSize: 10, color: payColor, fontWeight: 600 }}>{payLabel}</span>
                    </div>
                  </button>
                );
              }))
            }
          </div>
        </div>
      )}

      {Object.keys(gigsByDay).length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 0 16px", color: "#555", fontSize: 13 }}>
          No gigs this month. Tap any date to add one.
        </div>
      )}
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────
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

// ─── Gigs Screen ──────────────────────────────────────────────
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

// ─── Stats Screen ─────────────────────────────────────────────
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

// ─── Gig Card ─────────────────────────────────────────────────
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

// ─── Gig Detail ───────────────────────────────────────────────
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
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "white" }}>{gig.client}</h1>
        <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{gig.type} · {new Date(gig.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
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

// ─── Gig Form ─────────────────────────────────────────────────
function GigForm({ gig, onSave, onBack }) {
  const [form, setForm] = useState({
    client: gig?.client || "",
    date: gig?.date
      ? (typeof gig.date === "string" && gig.date.length === 10 ? gig.date : new Date(gig.date).toISOString().slice(0, 10))
      : new Date().toISOString().slice(0, 10),
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
          <input style={inp} value={form.client} onChange={e => set("client", e.target.value)} placeholder="e.g. Ritz Wedding Hall" />
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

// ─── SVG Nav Icons ────────────────────────────────────────────
function HomeIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#c98a3a" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" /><path d="M9 21V12h6v9" /></svg>;
}
function ListIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#c98a3a" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;
}
function CalIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#c98a3a" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function ChartIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#c98a3a" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
}