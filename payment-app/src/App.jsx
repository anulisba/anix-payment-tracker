import { useState, useEffect, useCallback } from "react";

const API = "/api/handler";

const api = {
  getGigs: () => fetch(`${API}?action=gigs`).then(r => r.json()),
  getStats: () => fetch(`${API}?action=stats`).then(r => r.json()),
  createGig: (body) => fetch(`${API}?action=gigs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
  updateGig: (id, body) => fetch(`${API}?action=gig&id=${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteGig: (id) => fetch(`${API}?action=delete&id=${id}`, { method: "POST" }).then(r => r.json()),
  toggleConfirm: (id) => fetch(`${API}?action=confirm&id=${id}`, { method: "POST" }).then(r => r.json()),
  getExpenses: () => fetch(`${API}?action=expenses`).then(r => r.json()),
  createExpense: (body) => fetch(`${API}?action=expenses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
  updateExpense: (id, body) => fetch(`${API}?action=expense&id=${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
  deleteExpense: (id) => fetch(`${API}?action=deleteExpense&id=${id}`, { method: "POST" }).then(r => r.json()),
};

const GIG_TYPES = ["Wedding", "Club Night", "Private Party", "Festival", "Corporate", "Acoustic Set", "Birthday", "Other"];
const EXPENSE_CATEGORIES = ["Travel", "Food", "Entertainment", "Essentials", "EMI", "Savings", "Gear", "Other"];

const EXPENSE_CATEGORY_COLORS = {
  "Travel": { bg: "#1a1f3a", border: "#3b4a8a", text: "#6b8cff", icon: "✈️" },
  "Food": { bg: "#2e1f1a", border: "#8a4a2a", text: "#e07b3a", icon: "🍜" },
  "Entertainment": { bg: "#1f1a2e", border: "#5b3a8a", text: "#b06bff", icon: "🎬" },
  "Essentials": { bg: "#1a2a2e", border: "#2a6b7a", text: "#4bbfd4", icon: "🛒" },
  "EMI": { bg: "#2e1a1f", border: "#8a2a4a", text: "#e05c7a", icon: "🏦" },
  "Savings": { bg: "#1a2e1f", border: "#2a6b3a", text: "#5bb974", icon: "💰" },
  "Gear": { bg: "#2e2a1a", border: "#8a762a", text: "#d4b94b", icon: "🎛️" },
  "Other": { bg: "#212121", border: "#444", text: "#888", icon: "📦" },
};

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

const SLOT_COLORS = {
  "Morning": { color: "#f5c842", bg: "rgba(245,200,66,0.12)", border: "rgba(245,200,66,0.25)" },
  "Evening": { color: "#b06bff", bg: "rgba(176,107,255,0.12)", border: "rgba(176,107,255,0.25)" },
};

function payStatus(g) {
  if (g.paid >= g.fee) return "paid";
  if (g.paid > 0) return "partial";
  return "unpaid";
}
function fmt(n) { return "₹" + Number(n).toLocaleString("en-IN"); }
function monthKey(date) { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function monthLabel(key) { const [y, m] = key.split("-"); return new Date(y, m - 1, 1).toLocaleString("default", { month: "long", year: "numeric" }); }

// ─── Slot Badge ────────────────────────────────────────────────
function SlotBadge({ slot, size = "sm" }) {
  if (!slot) return null;
  const sc = SLOT_COLORS[slot];
  const fs = size === "xs" ? 9 : 11;
  const px = size === "xs" ? "4px 6px" : "3px 8px";
  const icon = slot === "Morning" ? "🌅" : "🌙";
  return (
    <span style={{
      fontSize: fs, fontWeight: 700, color: sc.color,
      background: sc.bg, border: `1px solid ${sc.border}`,
      borderRadius: 5, padding: px, display: "inline-flex", alignItems: "center", gap: 3, lineHeight: 1.4,
    }}>
      {icon} {slot}
    </span>
  );
}

// ─── Toast ─────────────────────────────────────────────────────
function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: type === "error" ? "#2a1010" : "#0f2218", color: type === "error" ? "#e05c5c" : "#5bb974", border: `1px solid ${type === "error" ? "#e05c5c" : "#5bb974"}`, borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
      {message}
    </div>
  );
}

function AppHeader({ title, subtitle }) {
  return (
    <div style={{ padding: "24px 16px 18px", borderBottom: "1px solid #222", background: "#1a1a1a", position: "sticky", top: 0, zIndex: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{title}</h1>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>{subtitle}</p>
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

// ─── Slot Picker Modal ─────────────────────────────────────────
function SlotPickerModal({ dateStr, onSelect, onClose }) {
  const display = new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "flex-end" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#1e1e1e", borderRadius: "20px 20px 0 0", padding: "24px 16px 40px", width: "100%", border: "1px solid #2a2a2a" }}>
        <div style={{ width: 40, height: 4, background: "#333", borderRadius: 2, margin: "0 auto 20px" }} />
        <p style={{ fontSize: 13, color: "#666", marginBottom: 6, textAlign: "center" }}>Add gig on</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#e8e8e6", marginBottom: 24, textAlign: "center" }}>{display}</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="tap" onClick={() => onSelect("Morning")}
            style={{ flex: 1, background: "rgba(245,200,66,0.08)", border: "1px solid rgba(245,200,66,0.25)", borderRadius: 18, padding: "20px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 32 }}>🌅</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#f5c842" }}>Morning</span>
            <span style={{ fontSize: 11, color: "#666" }}>Before 12 PM</span>
          </button>
          <button className="tap" onClick={() => onSelect("Evening")}
            style={{ flex: 1, background: "rgba(176,107,255,0.08)", border: "1px solid rgba(176,107,255,0.25)", borderRadius: 18, padding: "20px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 32 }}>🌙</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#b06bff" }}>Evening</span>
            <span style={{ fontSize: 11, color: "#666" }}>After 12 PM</span>
          </button>
        </div>
        <button className="tap" onClick={onClose}
          style={{ marginTop: 14, width: "100%", background: "none", border: "1px solid #2a2a2a", color: "#555", borderRadius: 14, padding: 14, fontSize: 14 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Day Modal ─────────────────────────────────────────────────
function DayModal({ day, year, month, gigs, onClose, onGigTap, onAddGig }) {
  const dateDisplay = new Date(year, month, day).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long"
  });

  const slots = gigs.map(g => g.slot).filter(Boolean);
  const hasMorning = slots.includes("Morning");
  const hasEvening = slots.includes("Evening");
  const canAddMorning = !hasMorning;
  const canAddEvening = !hasEvening;
  // Show add-slot CTA only when exactly 1 gig exists and it has a slot, leaving the other free
  const showAddSlot = gigs.length === 1 && gigs[0].slot && (canAddMorning || canAddEvening);
  const otherSlot = canAddMorning ? "Morning" : "Evening";
  const otherSlotIcon = otherSlot === "Morning" ? "🌅" : "🌙";
  const otherSlotColor = otherSlot === "Morning" ? "#f5c842" : "#b06bff";
  const otherSlotActiveBg = otherSlot === "Morning" ? "rgba(245,200,66,0.08)" : "rgba(176,107,255,0.08)";
  const otherSlotBorder = otherSlot === "Morning" ? "rgba(245,200,66,0.25)" : "rgba(176,107,255,0.25)";

  function handleAddOtherSlot() {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onClose();
    onAddGig(iso, otherSlot);
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "flex-end" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#1a1a1a", borderRadius: "22px 22px 0 0", padding: "8px 16px 40px", width: "100%", border: "1px solid #2a2a2a", boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}
      >
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: "#333", borderRadius: 2, margin: "12px auto 20px" }} />

        {/* Date header */}
        <p style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, textAlign: "center" }}>
          {dateDisplay}
        </p>
        <p style={{ fontSize: 13, color: "#666", textAlign: "center", marginBottom: 22 }}>
          {gigs.length} gig{gigs.length !== 1 ? "s" : ""} booked
        </p>

        {/* Existing gig(s) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {gigs.map(g => {
            const tc = TYPE_COLORS[g.type] || TYPE_COLORS["Other"];
            const status = payStatus(g);
            const payColor = status === "paid" ? "#5bb974" : status === "partial" ? "#e07b3a" : "#e05c5c";
            const payLabel = status === "paid" ? "Paid" : status === "partial" ? `${fmt(g.fee - g.paid)} due` : "Unpaid";

            return (
              <button
                key={g._id}
                className="tap"
                onClick={() => { onClose(); onGigTap(g); }}
                style={{
                  width: "100%", background: tc.bg, border: `1px solid ${tc.border}`,
                  borderRadius: 16, padding: "14px 16px", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 12
                }}
              >
                {/* Slot icon */}
                {g.slot && (
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: g.slot === "Morning" ? "rgba(245,200,66,0.1)" : "rgba(176,107,255,0.1)",
                    border: `1px solid ${g.slot === "Morning" ? "rgba(245,200,66,0.25)" : "rgba(176,107,255,0.25)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                  }}>
                    {g.slot === "Morning" ? "🌅" : "🌙"}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    {g.slot && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        color: g.slot === "Morning" ? "#f5c842" : "#b06bff",
                        textTransform: "uppercase", letterSpacing: "0.06em"
                      }}>
                        {g.slot}
                      </span>
                    )}
                    <span style={{ fontSize: 9, color: "#333" }}>●</span>
                    <span style={{ fontSize: 10, color: g.confirmed ? "#5bb974" : "#a78bfa" }}>
                      {g.confirmed ? "Confirmed" : "Unconfirmed"}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#e8e8e6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {g.client}
                  </p>
                  <p style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{g.type}</p>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#e8e8e6", marginBottom: 4 }}>{fmt(g.fee)}</p>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: payColor,
                    background: status === "paid" ? "#1a2e1e" : status === "partial" ? "#2a1e10" : "#2a1010",
                    padding: "2px 8px", borderRadius: 6
                  }}>{payLabel}</span>
                </div>

                {/* Chevron */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            );
          })}
        </div>

        {/* Add other slot CTA */}
        {showAddSlot && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 14px" }}>
              <div style={{ flex: 1, height: 1, background: "#222" }} />
              <span style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>Available Slot</span>
              <div style={{ flex: 1, height: 1, background: "#222" }} />
            </div>
            <button
              className="tap"
              onClick={handleAddOtherSlot}
              style={{
                width: "100%", background: otherSlotActiveBg,
                border: `1px solid ${otherSlotBorder}`,
                borderRadius: 16, padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 14, textAlign: "left"
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${otherSlotBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0
              }}>
                {otherSlotIcon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: otherSlotColor }}>
                  Add {otherSlot} Gig
                </p>
                <p style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                  {otherSlot === "Morning" ? "Before 12 PM · slot is free" : "After 12 PM · slot is free"}
                </p>
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: otherSlotActiveBg, border: `1px solid ${otherSlotBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: otherSlotColor, fontSize: 18, fontWeight: 600, flexShrink: 0
              }}>+</div>
            </button>
          </>
        )}

        {/* Close */}
        <button
          className="tap"
          onClick={onClose}
          style={{
            marginTop: 14, width: "100%", background: "none",
            border: "1px solid #252525", color: "#444",
            borderRadius: 14, padding: 14, fontSize: 14
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────
export default function App() {
  const [gigs, setGigs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState(null);
  const [filterMonth, setFilterMonth] = useState("all");
  const [toast, setToast] = useState(null);
  const [slotPicker, setSlotPicker] = useState(null); // dateStr

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const refresh = useCallback(async () => {
    try {
      const [gigsRes, statsRes, expRes] = await Promise.all([api.getGigs(), api.getStats(), api.getExpenses()]);
      if (gigsRes.success) setGigs(gigsRes.data);
      if (statsRes.success) setStats(statsRes.data);
      if (expRes.success) setExpenses(expRes.data);
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

  async function saveExpense(form) {
    try {
      const res = form._id ? await api.updateExpense(form._id, form) : await api.createExpense(form);
      if (!res.success) { showToast(res.message, "error"); return; }
      showToast(form._id ? "Expense updated!" : "Expense added!");
      await refresh();
      setScreen(null);
    } catch { showToast("Failed to save expense", "error"); }
  }

  async function deleteExpense(id) {
    try {
      const res = await api.deleteExpense(id);
      if (!res.success) { showToast(res.message, "error"); return; }
      showToast("Expense deleted");
      await refresh();
      setScreen(null);
    } catch { showToast("Failed to delete", "error"); }
  }

  // ✅ FIX 1: openCalendarAdd now correctly triggers the SlotPickerModal
  function openCalendarAdd(dateStr) {
    setSlotPicker(dateStr);
  }

  // ✅ FIX 2: openCalendarAddWithSlot is now defined — skips slot picker, goes straight to form
  function openCalendarAddWithSlot(dateStr, slot) {
    setScreen({ type: "form", gig: { date: dateStr, slot } });
  }

  function handleSlotSelect(slot) {
    const dateStr = slotPicker;
    setSlotPicker(null);
    setScreen({ type: "form", gig: { date: dateStr, slot } });
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

      {/* Slot picker overlay */}
      {slotPicker && (
        <SlotPickerModal
          dateStr={slotPicker}
          onSelect={handleSlotSelect}
          onClose={() => setSlotPicker(null)}
        />
      )}

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
      {screen?.type === "expenseDetail" && (
        <div className="fade-in" style={{ position: "fixed", inset: 0, background: "#1a1a1a", zIndex: 100, overflowY: "auto" }}>
          <ExpenseDetail expense={screen.expense} onBack={() => setScreen(null)} onEdit={e => setScreen({ type: "expenseForm", expense: e })} onDelete={deleteExpense} />
        </div>
      )}
      {screen?.type === "expenseForm" && (
        <div className="fade-in" style={{ position: "fixed", inset: 0, background: "#1a1a1a", zIndex: 100, overflowY: "auto" }}>
          <ExpenseForm expense={screen.expense} onSave={saveExpense} onBack={() => setScreen(null)} />
        </div>
      )}

      <div style={{ paddingBottom: 80 }}>
        {loading ? <Spinner /> : <>
          {tab === "home" && <HomeScreen stats={stats} recentGigs={[...gigs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)} onGigTap={g => setScreen({ type: "detail", gig: g })} onViewAll={() => setTab("gigs")} />}
          {tab === "gigs" && <GigsScreen gigs={sortedGigs} months={months} filterMonth={filterMonth} setFilterMonth={setFilterMonth} onGigTap={g => setScreen({ type: "detail", gig: g })} />}
          {tab === "calendar" && (
            <CalendarScreen
              gigs={gigs}
              onGigTap={g => setScreen({ type: "detail", gig: g })}
              onAddGig={openCalendarAdd}
              onAddGigWithSlot={openCalendarAddWithSlot}
            />
          )}
          {tab === "stats" && <StatsScreen stats={stats} />}
          {tab === "expense" && <ExpenseScreen expenses={expenses} onExpenseTap={e => setScreen({ type: "expenseDetail", expense: e })} onAdd={() => setScreen({ type: "expenseForm", expense: {} })} />}
        </>}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#111", borderTop: "1px solid #252525", display: "flex", alignItems: "center", padding: "0 2px", zIndex: 50, height: 64 }}>
        {[
          { id: "home", label: "Home", icon: <HomeIcon active={tab === "home"} /> },
          { id: "gigs", label: "Gigs", icon: <ListIcon active={tab === "gigs"} /> },
          { id: "calendar", label: "Calendar", icon: <CalIcon active={tab === "calendar"} /> },
          { id: "expense", label: "Expenses", icon: <WalletIcon active={tab === "expense"} /> },
          { id: "stats", label: "Stats", icon: <ChartIcon active={tab === "stats"} /> },
        ].map(({ id, label, icon }) => (
          <button key={id} className="tap" onClick={() => setTab(id)}
            style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 0", color: tab === id ? "#c98a3a" : "#555" }}>
            {icon}
            <span style={{ fontSize: 9, fontWeight: tab === id ? 600 : 400 }}>{label}</span>
          </button>
        ))}
        <button className="tap"
          onClick={() => {
            if (tab === "expense") {
              setScreen({ type: "expenseForm", expense: {} });
            } else {
              setScreen({ type: "form", gig: {} });
            }
          }}
          style={{ width: 44, height: 44, borderRadius: 22, background: "#c98a3a", border: "none", color: "#fff", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(201,138,58,.4)", margin: "0 4px", flexShrink: 0 }}>
          +
        </button>
      </div>
    </div>
  );
}

// ─── Calendar Screen ───────────────────────────────────────────
function CalendarScreen({ gigs, onGigTap, onAddGig, onAddGigWithSlot }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [dayModal, setDayModal] = useState(null); // { day, gigs }

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" });

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

  const cells = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  function handleDayTap(day) {
    const dayGigs = gigsByDay[day] || [];
    if (dayGigs.length === 0) {
      // No gigs → open slot picker
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      onAddGig(iso);
    } else {
      // 1 or more gigs → always show DayModal
      setDayModal({ day, gigs: dayGigs });
    }
  }

  return (
    <>
      <AppHeader title="Payment Tracker" subtitle="Welcome back Anix 👋" />
      <div style={{ padding: "18px 16px 0" }}>

        {/* Day Modal */}
        {dayModal && (
          <DayModal
            day={dayModal.day}
            year={year}
            month={month}
            gigs={dayModal.gigs}
            onClose={() => setDayModal(null)}
            onGigTap={onGigTap}
            onAddGig={(iso, slot) => {
              setDayModal(null);
              if (slot) {
                onAddGigWithSlot(iso, slot);
              } else {
                onAddGig(iso);
              }
            }}
          />
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

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 2, marginBottom: 2, width: "100%" }}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 10, color: "#555", fontWeight: 600, paddingBottom: 6 }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 2, width: "100%" }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} style={{ minHeight: 68 }} />;
            const dayGigs = gigsByDay[day] || [];
            const hasGigs = dayGigs.length > 0;
            const todayCell = isToday(day);
            const firstColor = hasGigs ? (TYPE_COLORS[dayGigs[0].type] || TYPE_COLORS["Other"]) : null;

            return (
              <button key={day} className="cal-cell tap" onClick={() => handleDayTap(day)}
                style={{ minHeight: 68, width: "100%", boxSizing: "border-box", overflow: "hidden", background: hasGigs ? firstColor.bg : "#181818", border: `1px solid ${todayCell ? "#c98a3a" : hasGigs ? firstColor.border : "#222"}`, borderRadius: 9, padding: "5px 4px 4px", display: "flex", flexDirection: "column", alignItems: "stretch", gap: 2, transition: "border-color 0.12s" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: 2, marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: todayCell ? 700 : 500, lineHeight: 1, color: todayCell ? "#c98a3a" : hasGigs ? "#ccc" : "#444", background: todayCell ? "rgba(201,138,58,0.15)" : "transparent", borderRadius: 4, padding: "1px 3px" }}>{day}</span>
                </div>
                {dayGigs.slice(0, 2).map((g, i) => {
                  const tc = TYPE_COLORS[g.type] || TYPE_COLORS["Other"];
                  const slotIcon = g.slot === "Morning" ? "🌅" : g.slot === "Evening" ? "🌙" : "";
                  return (
                    <div key={i} style={{ background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 4, padding: "2px 3px", fontSize: 8, color: tc.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.5 }}>
                      {slotIcon}{slotIcon ? " " : ""}{g.client.length > 8 ? g.client.slice(0, 7) + "…" : g.client}
                    </div>
                  );
                })}
                {dayGigs.length > 2 && (
                  <div style={{ fontSize: 8, color: "#666", textAlign: "center", marginTop: 1 }}>+{dayGigs.length - 2}</div>
                )}
                {!hasGigs && (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 14, color: "#2a2a2a" }}>+</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
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

        {/* Month list */}
        {Object.keys(gigsByDay).length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 10 }}>
              {monthName} — {Object.values(gigsByDay).flat().length} gig{Object.values(gigsByDay).flat().length !== 1 ? "s" : ""}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(gigsByDay).sort(([a], [b]) => +a - +b).flatMap(([day, gs]) => gs.map(g => {
                const tc = TYPE_COLORS[g.type] || TYPE_COLORS["Other"];
                const status = payStatus(g);
                const payColor = status === "paid" ? "#5bb974" : status === "partial" ? "#e07b3a" : "#e05c5c";
                const payLabel = status === "paid" ? "Paid" : status === "partial" ? "Partial" : "Unpaid";
                return (
                  <button key={g._id} className="tap" onClick={() => onGigTap(g)}
                    style={{ background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                    <div style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: tc.text, lineHeight: 1 }}>{day}</div>
                      <div style={{ fontSize: 9, color: "#666", marginTop: 2, textTransform: "uppercase" }}>
                        {new Date(year, month, +day).toLocaleString("default", { weekday: "short" })}
                      </div>
                    </div>
                    <div style={{ width: 1, height: 32, background: tc.border, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#e8e8e6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.client}</p>
                        {g.slot && <SlotBadge slot={g.slot} size="xs" />}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
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
              }))}
            </div>
          </div>
        )}

        {Object.keys(gigsByDay).length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0 16px", color: "#555", fontSize: 13 }}>
            No gigs this month. Tap any date to add one.
          </div>
        )}
      </div>
    </>
  );
}

// ─── Home Screen ───────────────────────────────────────────────
function HomeScreen({ stats, recentGigs, onGigTap, onViewAll }) {
  if (!stats) return <Spinner />;
  return (
    <div>
      <AppHeader title="Payment Tracker" subtitle="Welcome back Anix 👋" />
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ background: "#212121", borderRadius: 20, padding: 20, marginBottom: 12, border: "1px solid #2a2a2a" }}>
          <p style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Total Received</p>
          <p style={{ fontSize: 34, fontWeight: 700, marginBottom: 18 }}>{fmt(stats.totalEarned)}</p>
          <div style={{ height: 1, background: "#2a2a2a", marginBottom: 18 }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Pending (due)</p>
              <p style={{ fontSize: 18, fontWeight: 600, color: "#e07b3a" }}>{fmt(stats.totalPending)}</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Total Spent</p>
              <p style={{ fontSize: 18, fontWeight: 600, color: "#e05c7a" }}>{fmt(stats.totalExpenses || 0)}</p>
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
    </div>
  );
}

// ─── Gigs Screen ───────────────────────────────────────────────
function GigsScreen({ gigs, months, filterMonth, setFilterMonth, onGigTap }) {
  return (
    <>
      <AppHeader title="Payment Tracker" subtitle="Welcome back Anix 👋" />
      <div style={{ padding: "18px 16px 0" }}>
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
    </>
  );
}

// ─── Stats Screen ──────────────────────────────────────────────
function StatsScreen({ stats }) {
  if (!stats) return <Spinner />;
  const [activeSection, setActiveSection] = useState("income");
  const maxEarned = Math.max(...(stats.monthly || []).map(m => m.earned), 1);
  const maxExpense = Math.max(...(stats.monthlyExpenses || []).map(m => m.total), 1);

  return (
    <>
      <AppHeader title="Payment Tracker" subtitle="Welcome back Anix 👋" />
      <div style={{ padding: "18px 16px 0" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Stats</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Total Received", val: fmt(stats.totalEarned), color: "#5bb974" },
            { label: "Pending (due)", val: fmt(stats.totalPending), color: "#e07b3a" },
            { label: "Total Spent", val: fmt(stats.totalExpenses || 0), color: "#e05c7a" },
            { label: "Net Balance", val: fmt((stats.totalEarned || 0) - (stats.totalExpenses || 0)), color: "#4bbfd4" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#212121", borderRadius: 16, padding: "16px 14px", border: "1px solid #2a2a2a" }}>
              <p style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[{ id: "income", label: "Income" }, { id: "expenses", label: "Expenses" }].map(s => (
            <button key={s.id} className="tap" onClick={() => setActiveSection(s.id)}
              style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: activeSection === s.id ? "none" : "1px solid #2a2a2a", fontSize: 13, fontWeight: 600, background: activeSection === s.id ? "#c98a3a" : "#212121", color: activeSection === s.id ? "#fff" : "#666" }}>
              {s.label}
            </button>
          ))}
        </div>

        {activeSection === "income" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Confirmed", val: stats.confirmedCount, color: "#5bb974" },
                { label: "Unconfirmed", val: stats.unconfirmedCount, color: "#a78bfa" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#212121", borderRadius: 16, padding: "16px 14px", border: "1px solid #2a2a2a" }}>
                  <p style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>{s.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</p>
                </div>
              ))}
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Monthly Income</h2>
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
          </>
        )}

        {activeSection === "expenses" && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Monthly Expenses</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(stats.monthlyExpenses || []).map(m => (
                <div key={m.key} style={{ background: "#212121", borderRadius: 16, padding: 16, border: "1px solid #2a2a2a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500 }}>{monthLabel(m.key)}</p>
                      <p style={{ fontSize: 11, color: "#555", marginTop: 3 }}>{m.count} expense{m.count !== 1 ? "s" : ""}</p>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#e05c7a" }}>{fmt(m.total)}</p>
                  </div>
                  <div style={{ height: 4, background: "#2a2a2a", borderRadius: 2, marginBottom: 12 }}>
                    <div style={{ height: 4, width: `${(m.total / maxExpense) * 100}%`, background: "#e05c7a", borderRadius: 2 }} />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {Object.entries(m.byCategory || {}).sort(([, a], [, b]) => b - a).map(([cat, amt]) => {
                      const cc = EXPENSE_CATEGORY_COLORS[cat] || EXPENSE_CATEGORY_COLORS["Other"];
                      return (
                        <div key={cat} style={{ background: cc.bg, border: `1px solid ${cc.border}`, borderRadius: 8, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 10 }}>{cc.icon}</span>
                          <span style={{ fontSize: 10, color: cc.text, fontWeight: 600 }}>{cat}</span>
                          <span style={{ fontSize: 10, color: "#666" }}>{fmt(amt)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {(!stats.monthlyExpenses || stats.monthlyExpenses.length === 0) && (
                <p style={{ color: "#555", textAlign: "center", padding: "40px 0", fontSize: 13 }}>No expenses recorded yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Expense Screen ────────────────────────────────────────────
function ExpenseScreen({ expenses, onExpenseTap, onAdd }) {
  const months = [...new Set(expenses.map(e => monthKey(e.date)))].sort().reverse();
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterCat, setFilterCat] = useState("all");

  const visible = expenses
    .filter(e => filterMonth === "all" || monthKey(e.date) === filterMonth)
    .filter(e => filterCat === "all" || e.category === filterCat)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalVisible = visible.reduce((s, e) => s + e.amount, 0);

  const catTotals = {};
  visible.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const topCat = Object.entries(catTotals).sort(([, a], [, b]) => b - a)[0];

  return (
    <>
      <AppHeader title="Payment Tracker" subtitle="Welcome back Anix 👋" />
      <div style={{ padding: "18px 16px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Expenses</h1>
          <button className="tap" onClick={onAdd}
            style={{ background: "#c98a3a", border: "none", color: "#fff", borderRadius: 12, padding: "8px 16px", fontSize: 13, fontWeight: 600 }}>
            + Add
          </button>
        </div>

        {visible.length > 0 && (
          <div style={{ background: "#212121", borderRadius: 18, padding: "16px 18px", marginBottom: 16, border: "1px solid #2a2a2a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>{filterMonth === "all" ? "All Time" : monthLabel(filterMonth)}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: "#e05c7a" }}>{fmt(totalVisible)}</p>
                <p style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{visible.length} transaction{visible.length !== 1 ? "s" : ""}</p>
              </div>
              {topCat && (
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>Top category</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 14 }}>{EXPENSE_CATEGORY_COLORS[topCat[0]]?.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: EXPENSE_CATEGORY_COLORS[topCat[0]]?.text }}>{topCat[0]}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{fmt(topCat[1])}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="chip-scroll" style={{ marginBottom: 10 }}>
          {[{ key: "all", label: "All" }, ...months.map(m => ({ key: m, label: monthLabel(m).split(" ")[0] + " '" + monthLabel(m).split(" ")[1].slice(2) }))].map(({ key, label }) => (
            <button key={key} className="tap" onClick={() => setFilterMonth(key)}
              style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 20, border: filterMonth === key ? "none" : "1px solid #2a2a2a", fontSize: 12, fontWeight: 500, background: filterMonth === key ? "#c98a3a" : "#212121", color: filterMonth === key ? "#fff" : "#888" }}>
              {label}
            </button>
          ))}
        </div>

        <div className="chip-scroll" style={{ marginBottom: 16 }}>
          {[{ key: "all", label: "All Categories" }, ...EXPENSE_CATEGORIES.map(c => ({ key: c, label: `${EXPENSE_CATEGORY_COLORS[c]?.icon} ${c}` }))].map(({ key, label }) => (
            <button key={key} className="tap" onClick={() => setFilterCat(key)}
              style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 20, border: filterCat === key ? "none" : "1px solid #2a2a2a", fontSize: 11, fontWeight: 500, background: filterCat === key ? "#333" : "#1a1a1a", color: filterCat === key ? "#e8e8e6" : "#666", outline: filterCat === key ? "1px solid #555" : "none" }}>
              {label}
            </button>
          ))}
        </div>

        {visible.length === 0
          ? <p style={{ color: "#555", textAlign: "center", padding: "60px 0", fontSize: 13 }}>No expenses found. Tap + to add one.</p>
          : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visible.map(e => <ExpenseCard key={e._id} expense={e} onTap={onExpenseTap} />)}
          </div>
        }
      </div>
    </>
  );
}

// ─── Expense Card ──────────────────────────────────────────────
function ExpenseCard({ expense, onTap }) {
  const cc = EXPENSE_CATEGORY_COLORS[expense.category] || EXPENSE_CATEGORY_COLORS["Other"];
  return (
    <button className="tap row" onClick={() => onTap(expense)}
      style={{ width: "100%", background: cc.bg, border: `1px solid ${cc.border}`, borderRadius: 16, padding: "14px 16px", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
        {cc.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#e8e8e6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{expense.description}</p>
        <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
          {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · <span style={{ color: cc.text }}>{expense.category}</span>
        </p>
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#e05c7a", flexShrink: 0 }}>{fmt(expense.amount)}</p>
    </button>
  );
}

// ─── Expense Detail ────────────────────────────────────────────
function ExpenseDetail({ expense, onBack, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const cc = EXPENSE_CATEGORY_COLORS[expense.category] || EXPENSE_CATEGORY_COLORS["Other"];

  async function handleDelete() {
    if (!window.confirm("Delete this expense?")) return;
    setDeleting(true);
    await onDelete(expense._id);
    setDeleting(false);
  }

  return (
    <>
      <AppHeader title="Payment Tracker" subtitle="Welcome back Anix 👋" />
      <div style={{ padding: "18px 16px 0" }}>
        <button className="tap" onClick={onBack} style={{ background: "none", border: "none", color: "#c98a3a", fontSize: 14, padding: 0, marginBottom: 24 }}>← Back</button>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: cc.bg, border: `1px solid ${cc.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
            {cc.icon}
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "white" }}>{expense.description}</h1>
            <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{expense.category} · {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>
        <div style={{ background: "#212121", borderRadius: 18, overflow: "hidden", marginBottom: 20, border: "1px solid #2a2a2a" }}>
          <div style={{ padding: "20px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#888" }}>Amount</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#e05c7a" }}>{fmt(expense.amount)}</span>
          </div>
        </div>
        {expense.notes && (
          <div style={{ background: "#212121", borderRadius: 14, padding: "14px 16px", marginBottom: 20, border: "1px solid #2a2a2a" }}>
            <p style={{ fontSize: 11, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</p>
            <p style={{ fontSize: 14, color: "#aaa" }}>{expense.notes}</p>
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="tap" onClick={() => onEdit(expense)} style={{ flex: 1, background: "#212121", border: "1px solid #2a2a2a", color: "#e8e8e6", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 500 }}>Edit</button>
          <button className="tap" onClick={handleDelete} disabled={deleting} style={{ flex: 1, background: "#2a1010", border: "1px solid #3a1515", color: "#e05c5c", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 500, opacity: deleting ? 0.5 : 1 }}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Expense Form ──────────────────────────────────────────────
function ExpenseForm({ expense, onSave, onBack }) {
  const [form, setForm] = useState({
    description: expense?.description || "",
    date: expense?.date
      ? (typeof expense.date === "string" && expense.date.length === 10 ? expense.date : new Date(expense.date).toISOString().slice(0, 10))
      : new Date().toISOString().slice(0, 10),
    category: expense?.category || "Essentials",
    amount: expense?.amount || "",
    notes: expense?.notes || "",
    _id: expense?._id || null,
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.description || !form.amount || !form.date) return alert("Fill in Description, Date & Amount.");
    setSaving(true);
    await onSave({ ...form, amount: +form.amount });
    setSaving(false);
  }

  const inp = { width: "100%", background: "#212121", border: "1px solid #2a2a2a", color: "#e8e8e6", padding: "13px 14px", borderRadius: 12, fontSize: 15 };
  const lbl = { display: "block", fontSize: 12, color: "#666", marginBottom: 7, fontWeight: 500 };

  return (
    <>
      <AppHeader title="Payment Tracker" subtitle="Welcome back Anix 👋" />
      <div style={{ padding: "18px 16px 0" }}>
        <button className="tap" onClick={onBack} style={{ background: "none", border: "none", color: "#c98a3a", fontSize: 14, padding: 0, marginBottom: 24 }}>← Back</button>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>{form._id ? "Edit Expense" : "New Expense"}</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={lbl}>Description</label>
            <input style={inp} value={form.description} onChange={e => set("description", e.target.value)} placeholder="e.g. Uber to venue" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>Date</label>
              <input style={inp} type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Category</label>
              <select style={inp} value={form.category} onChange={e => set("category", e.target.value)}>
                {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={lbl}>Quick Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {EXPENSE_CATEGORIES.map(c => {
                const cc = EXPENSE_CATEGORY_COLORS[c];
                const active = form.category === c;
                return (
                  <button key={c} className="tap" onClick={() => set("category", c)}
                    style={{ padding: "6px 12px", borderRadius: 20, border: active ? `1px solid ${cc.border}` : "1px solid #2a2a2a", fontSize: 12, fontWeight: active ? 700 : 400, background: active ? cc.bg : "#1a1a1a", color: active ? cc.text : "#555", display: "flex", alignItems: "center", gap: 4 }}>
                    {cc.icon} {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={lbl}>Amount (₹)</label>
            <input style={{ ...inp, background: "#1a1a1a" }} type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="500" />
          </div>
          <div>
            <label style={lbl}>Notes</label>
            <input style={inp} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional notes..." />
          </div>
          <button className="tap" onClick={handleSave} disabled={saving}
            style={{ background: "#c98a3a", border: "none", color: "#fff", borderRadius: 16, padding: 17, fontSize: 16, fontWeight: 600, marginTop: 4, marginBottom: 16, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : form._id ? "Save Changes" : "Add Expense"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Gig Card ──────────────────────────────────────────────────
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
          {gig.slot && <SlotBadge slot={gig.slot} size="xs" />}
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

// ─── Gig Detail ────────────────────────────────────────────────
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
    <>
      <AppHeader title="Payment Tracker" subtitle="Welcome back Anix 👋" />
      <div style={{ padding: "18px 16px 0" }}>
        <button className="tap" onClick={onBack} style={{ background: "none", border: "none", color: "#c98a3a", fontSize: 14, padding: 0, marginBottom: 24 }}>← Back</button>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "white" }}>{gig.client}</h1>
            {gig.slot && <SlotBadge slot={gig.slot} />}
          </div>
          <p style={{ fontSize: 12, color: "#666" }}>{gig.type} · {new Date(gig.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
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
    </>
  );
}

// ─── Gig Form ──────────────────────────────────────────────────
function GigForm({ gig, onSave, onBack }) {
  const [form, setForm] = useState({
    client: gig?.client || "",
    date: gig?.date
      ? (typeof gig.date === "string" && gig.date.length === 10 ? gig.date : new Date(gig.date).toISOString().slice(0, 10))
      : new Date().toISOString().slice(0, 10),
    type: gig?.type || "Wedding",
    slot: gig?.slot || "",
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
    <>
      <AppHeader title="Payment Tracker" subtitle="Welcome back Anix 👋" />
      <div style={{ padding: "18px 16px 0" }}>
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

          {/* Slot picker */}
          <div>
            <label style={lbl}>Time Slot</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { val: "Morning", icon: "🌅", color: "#f5c842", activeBg: "rgba(245,200,66,0.08)", activeBorder: "rgba(245,200,66,0.3)" },
                { val: "Evening", icon: "🌙", color: "#b06bff", activeBg: "rgba(176,107,255,0.08)", activeBorder: "rgba(176,107,255,0.3)" },
                { val: "", icon: "—", color: "#555", activeBg: "#212121", activeBorder: "#444" },
              ].map(opt => (
                <button key={opt.val} className="tap" onClick={() => set("slot", opt.val)}
                  style={{ flex: 1, padding: "10px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: form.slot === opt.val ? opt.activeBg : "#181818", border: `1px solid ${form.slot === opt.val ? opt.activeBorder : "#2a2a2a"}`, color: form.slot === opt.val ? opt.color : "#444", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <span style={{ fontSize: 16 }}>{opt.icon}</span>
                  {opt.val || "None"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Gig Confirmation</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { val: true, label: "✓  Confirmed", color: "#5bb974", activeBg: "#0f2218", activeBorder: "#1e4d30" },
                { val: false, label: "?  Unconfirmed", color: "#a78bfa", activeBg: "#1e1828", activeBorder: "#3b2f6b" },
              ].map(opt => (
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
    </>
  );
}

// ─── Nav Icons ─────────────────────────────────────────────────
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
function WalletIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#c98a3a" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M16 12h2" /><path d="M2 10h20" /></svg>;
}