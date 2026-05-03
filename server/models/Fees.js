import mongoose from "mongoose";

const feesSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["paid", "pending"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Fees = mongoose.models.Fees || mongoose.model("Fees", feesSchema);

export default Fees;
