import dbConnect from "../../lib/dbConnect.js";
import Gig from "../../models/Gig.js";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
  }

  try {
    const gigs = await Gig.find();

    const totalEarned = gigs.reduce((s, g) => s + g.paid, 0);
    const totalPending = gigs.reduce((s, g) => s + Math.max(0, g.fee - g.paid), 0);
    const totalGigs = gigs.length;
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

    return res.status(200).json({
      success: true,
      data: { totalEarned, totalPending, totalGigs, confirmedCount, unconfirmedCount, monthly },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
