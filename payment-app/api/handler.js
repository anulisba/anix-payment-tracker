import dbConnect from "../lib/dbConnect.js";
import Gig from "../models/Gig.js";
import Expense from "../models/Expense.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  await dbConnect();

  const { action, id } = req.query;

  try {

    // ── GET /api/handler?action=stats ─────────────────────────
    if (action === "stats" && req.method === "GET") {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const gigs = await Gig.find();

      const totalEarned = gigs.reduce((s, g) => s + g.paid, 0);

      // Pending = only gigs whose date is on or before today
      const totalPending = gigs
        .filter((g) => new Date(g.date) <= today)
        .reduce((s, g) => s + Math.max(0, g.fee - g.paid), 0);

      const confirmedCount = gigs.filter((g) => g.confirmed).length;
      const unconfirmedCount = gigs.filter((g) => !g.confirmed).length;

      const monthMap = {};
      gigs.forEach((g) => {
        const d = new Date(g.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap[key]) monthMap[key] = { earned: 0, pending: 0, total: 0, count: 0 };
        monthMap[key].earned += g.paid;
        // Per-month pending also respects the today cutoff
        if (new Date(g.date) <= today) {
          monthMap[key].pending += Math.max(0, g.fee - g.paid);
        }
        monthMap[key].total += g.fee;
        monthMap[key].count += 1;
      });

      const monthly = Object.entries(monthMap)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([key, val]) => ({ key, ...val }));

      // Expense stats
      const expenses = await Expense.find();
      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

      const expMonthMap = {};
      expenses.forEach((e) => {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!expMonthMap[key]) expMonthMap[key] = { total: 0, count: 0, byCategory: {} };
        expMonthMap[key].total += e.amount;
        expMonthMap[key].count += 1;
        expMonthMap[key].byCategory[e.category] = (expMonthMap[key].byCategory[e.category] || 0) + e.amount;
      });

      const monthlyExpenses = Object.entries(expMonthMap)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([key, val]) => ({ key, ...val }));

      return res.status(200).json({
        success: true,
        data: {
          totalEarned, totalPending, totalGigs: gigs.length,
          confirmedCount, unconfirmedCount, monthly,
          totalExpenses, monthlyExpenses,
        },
      });
    }

    // ── GET /api/handler?action=gigs ──────────────────────────
    if (action === "gigs" && req.method === "GET") {
      const gigs = await Gig.find().sort({ date: -1 });
      return res.status(200).json({ success: true, count: gigs.length, data: gigs });
    }

    // ── POST /api/handler?action=gigs ─────────────────────────
    if (action === "gigs" && req.method === "POST") {
      const gig = await Gig.create(req.body);
      return res.status(201).json({ success: true, data: gig });
    }

    // ── PUT /api/handler?action=gig&id=xxx ────────────────────
    if (action === "gig" && req.method === "PUT") {
      if (!id) return res.status(400).json({ success: false, message: "ID required" });
      const gig = await Gig.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
      if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
      return res.status(200).json({ success: true, data: gig });
    }

    // ── POST /api/handler?action=confirm&id=xxx ───────────────
    if (action === "confirm" && req.method === "POST") {
      if (!id) return res.status(400).json({ success: false, message: "ID required" });
      const gig = await Gig.findById(id);
      if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
      gig.confirmed = !gig.confirmed;
      await gig.save();
      return res.status(200).json({ success: true, data: gig });
    }

    // ── POST /api/handler?action=delete&id=xxx ────────────────
    if (action === "delete" && req.method === "POST") {
      if (!id) return res.status(400).json({ success: false, message: "ID required" });
      const gig = await Gig.findByIdAndDelete(id);
      if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
      return res.status(200).json({ success: true, message: "Gig deleted" });
    }

    // ── GET /api/handler?action=expenses ──────────────────────
    if (action === "expenses" && req.method === "GET") {
      const expenses = await Expense.find().sort({ date: -1 });
      return res.status(200).json({ success: true, count: expenses.length, data: expenses });
    }

    // ── POST /api/handler?action=expenses ─────────────────────
    if (action === "expenses" && req.method === "POST") {
      const expense = await Expense.create(req.body);
      return res.status(201).json({ success: true, data: expense });
    }

    // ── PUT /api/handler?action=expense&id=xxx ────────────────
    if (action === "expense" && req.method === "PUT") {
      if (!id) return res.status(400).json({ success: false, message: "ID required" });
      const expense = await Expense.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
      if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
      return res.status(200).json({ success: true, data: expense });
    }

    // ── POST /api/handler?action=deleteExpense&id=xxx ─────────
    if (action === "deleteExpense" && req.method === "POST") {
      if (!id) return res.status(400).json({ success: false, message: "ID required" });
      const expense = await Expense.findByIdAndDelete(id);
      if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
      return res.status(200).json({ success: true, message: "Expense deleted" });
    }

    return res.status(400).json({ success: false, message: "Invalid action" });

  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}