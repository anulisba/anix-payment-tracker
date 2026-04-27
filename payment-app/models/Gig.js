import mongoose from "mongoose";

const gigSchema = new mongoose.Schema(
  {
    client: { type: String, required: [true, "Client name is required"], trim: true },
    date: { type: Date, required: [true, "Gig date is required"] },
    type: {
      type: String,
      enum: ["Wedding", "Club Night", "Private Party", "Festival", "Corporate", "Acoustic Set", "Birthday", "Other"],
      default: "Other",
    },
    fee: { type: Number, required: [true, "Fee is required"], min: 0 },
    paid: { type: Number, default: 0, min: 0 },
    confirmed: { type: Boolean, default: false },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

gigSchema.virtual("pending").get(function () {
  return Math.max(0, this.fee - this.paid);
});
gigSchema.virtual("paymentStatus").get(function () {
  if (this.paid >= this.fee) return "paid";
  if (this.paid > 0) return "partial";
  return "unpaid";
});
gigSchema.set("toJSON", { virtuals: true });

// Prevent model recompilation on hot reload in serverless
export default mongoose.models.Gig || mongoose.model("Gig", gigSchema);
