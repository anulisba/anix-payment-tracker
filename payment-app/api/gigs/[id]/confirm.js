import dbConnect from "../../../../lib/dbConnect.js";
import Gig from "../../../../models/Gig.js";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
  }

  try {
    const gig = await Gig.findById(req.query.id);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    gig.confirmed = !gig.confirmed;
    await gig.save();
    return res.status(200).json({ success: true, data: gig });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
