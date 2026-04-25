const express = require("express");
const router = express.Router();
const Gig = require("../models/Gig");

// ─── GET all gigs ─────────────────────────────────────────────
// Query params: ?month=2026-04  (optional filter)
router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.month) {
      const [year, month] = req.query.month.split("-").map(Number);
      filter.date = {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1),
      };
    }

    const gigs = await Gig.find(filter).sort({ date: -1 });
    res.json({ success: true, count: gigs.length, data: gigs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET summary stats ─────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const gigs = await Gig.find();

    const totalEarned = gigs.reduce((s, g) => s + g.paid, 0);
    const totalPending = gigs.reduce((s, g) => s + Math.max(0, g.fee - g.paid), 0);
    const totalGigs = gigs.length;
    const confirmedCount = gigs.filter((g) => g.confirmed).length;
    const unconfirmedCount = gigs.filter((g) => !g.confirmed).length;

    // Group by month
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

    res.json({
      success: true,
      data: { totalEarned, totalPending, totalGigs, confirmedCount, unconfirmedCount, monthly },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET single gig ────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    res.json({ success: true, data: gig });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST create gig ───────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const gig = await Gig.create(req.body);
    res.status(201).json({ success: true, data: gig });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT update gig ────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const gig = await Gig.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    res.json({ success: true, data: gig });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH toggle confirmation ─────────────────────────────────
router.patch("/:id/confirm", async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    gig.confirmed = !gig.confirmed;
    await gig.save();
    res.json({ success: true, data: gig });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE gig ────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const gig = await Gig.findByIdAndDelete(req.params.id);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    res.json({ success: true, message: "Gig deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
