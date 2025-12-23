import { Schema, model, models } from "mongoose";

const MeetingSchema = new Schema({
 meetingId: { type: String, required: true },
  title: { type: String, default: "Cuộc họp tức thì" },
  createdBy: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now },
  startsAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
});

const Meeting = models.Meeting || model("Meeting", MeetingSchema);

export default Meeting;