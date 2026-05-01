import dbConnect from "../lib/dbConnect.js";
import Gig from "../models/Gig.js";

export default async function handler(req, res) {
  // Allow all origins (CORS)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  await dbConnect();

  const { action, id } = req.query;
  // action = "gigs" | "stats" | "gig" | "confirm" | "delete"

  try {

    // ── GET /api/handler?action=stats ─────────────────────────
    if (action === "stats" && req.method === "GET") {
      const gigs = await Gig.find();
      const totalEarned = gigs.reduce((s, g) => s + g.paid, 0);
      const totalPending = gigs.reduce((s, g) => s + Math.max(0, g.fee - g.paid), 0);
      const confirmedCount = gigs.filter((g) => g.confirmed).length;
      const unconfirmedCount = gigs.filter((g) => !g.confirmed).length;

      const monthMap = {};
      gigs.forEach((g) => {
        const d = new Date(g.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap[key]) monthMap[key] = { earned: 0, pending: 0, total: 0, count: 0 };
        monthMap[key].earned += g.paid;
        monthMap[key].pending += Math.max(0, g.fee - g.paid);
        monthMap[key].total += g.fee;
        monthMap[key].count += 1;
      });
      const monthly = Object.entries(monthMap)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([key, val]) => ({ key, ...val }));

      return res.status(200).json({ success: true, data: { totalEarned, totalPending, totalGigs: gigs.length, confirmedCount, unconfirmedCount, monthly } });
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
