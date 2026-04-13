import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export const Company =
  mongoose.models.Company || mongoose.model("Company", companySchema);
