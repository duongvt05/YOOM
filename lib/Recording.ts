import mongoose from "mongoose";

const recordingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  roomId: { type: String, required: true },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  userId: { type: String },
  duration: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Recording || mongoose.model("Recording", recordingSchema);