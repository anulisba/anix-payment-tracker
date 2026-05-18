import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
    {
        description: { type: String, required: [true, "Description is required"], trim: true },
        date: { type: Date, required: [true, "Date is required"] },
        category: {
            type: String,
            enum: ["Travel", "Food", "Entertainment", "Essentials", "EMI", "Savings", "Gear", "Other"],
            default: "Other",
        },
        amount: { type: Number, required: [true, "Amount is required"], min: 0 },
        notes: { type: String, trim: true, default: "" },
    },
    { timestamps: true }
);

expenseSchema.set("toJSON", { virtuals: true });
export default mongoose.models.Expense || mongoose.model("Expense", expenseSchema);