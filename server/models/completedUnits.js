import mongoose from "mongoose";

const completedUnitsSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    status: {
      type: Number,
      required: true,
      enum: [0, 1],
      default: 1,
    },
  },
  { timestamps: true }
);

completedUnitsSchema.index(
  {
    studentId: 1,
    courseId: 1,
    unitId: 1,
  },
  { unique: true }
);

completedUnitsSchema.index({ studentId: 1, courseId: 1 });
completedUnitsSchema.index({ studentId: 1, courseId: 1, status: 1 });
completedUnitsSchema.index({ unitId: 1 });

const CompletedUnits = mongoose.model("CompletedUnits", completedUnitsSchema);
export default CompletedUnits;
