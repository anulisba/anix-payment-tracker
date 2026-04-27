import dbConnect from "../../lib/dbConnect.js";
import Gig from "../../models/Gig.js";

export default async function handler(req, res) {
    await dbConnect();
    const { id } = req.query;

    // ── GET /api/gigs/:id ──────────────────────────────────────
    if (req.method === "GET") {
        try {
            const gig = await Gig.findById(id);
            if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
            return res.status(200).json({ success: true, data: gig });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── PUT /api/gigs/:id ──────────────────────────────────────
    if (req.method === "PUT") {
        try {
            const gig = await Gig.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
            if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
            return res.status(200).json({ success: true, data: gig });
        } catch (err) {
            if (err.name === "ValidationError") {
                const messages = Object.values(err.errors).map((e) => e.message);
                return res.status(400).json({ success: false, message: messages.join(", ") });
            }
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── PATCH /api/gigs/:id (toggle confirm) ───────────────────
    if (req.method === "PATCH") {
        try {
            const gig = await Gig.findById(id);
            if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
            gig.confirmed = !gig.confirmed;
            await gig.save();
            return res.status(200).json({ success: true, data: gig });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── DELETE /api/gigs/:id ───────────────────────────────────
    if (req.method === "DELETE") {
        try {
            const gig = await Gig.findByIdAndDelete(id);
            if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
            return res.status(200).json({ success: true, message: "Gig deleted" });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    res.setHeader("Allow", ["GET", "PUT", "PATCH", "DELETE"]);
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
}