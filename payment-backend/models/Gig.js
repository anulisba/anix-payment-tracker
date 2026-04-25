const mongoose = require("mongoose");

const gigSchema = new mongoose.Schema(
  {
    client: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Gig date is required"],
    },
    type: {
      type: String,
      enum: ["Wedding", "Club Night", "Private Party", "Festival", "Corporate", "Acoustic Set", "Birthday", "Other"],
      default: "Other",
    },
    fee: {
      type: Number,
      required: [true, "Fee is required"],
      min: [0, "Fee cannot be negative"],
    },
    paid: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

// Virtual: pending amount
gigSchema.virtual("pending").get(function () {
  return Math.max(0, this.fee - this.paid);
});

// Virtual: payment status
gigSchema.virtual("paymentStatus").get(function () {
  if (this.paid >= this.fee) return "paid";
  if (this.paid > 0) return "partial";
  return "unpaid";
});

gigSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Gig", gigSchema);
