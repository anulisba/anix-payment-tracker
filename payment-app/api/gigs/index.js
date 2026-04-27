import dbConnect from "../../lib/dbConnect.js";
import Gig from "../../models/Gig.js";

export default async function handler(req, res) {
  await dbConnect();

  // ── GET /api/gigs ──────────────────────────────────────────
  if (req.method === "GET") {
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
      return res.status(200).json({ success: true, count: gigs.length, data: gigs });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── POST /api/gigs ─────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const gig = await Gig.create(req.body);
      return res.status(201).json({ success: true, data: gig });
    } catch (err) {
      if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ success: false, message: messages.join(", ") });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
}
