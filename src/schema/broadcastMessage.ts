import { Schema, model, Document } from "mongoose";

// Define the sub-schema for notifications
interface IBroadcast extends Document {
  title: string;
  content: string;
  sender: string;
  sendTime: string;
  type: string;
}

const broadcastSchema: Schema<IBroadcast> = new Schema({
  title: { type: String, default: "" },
  content: { type: String, default: "" },
  sender: { type: String, default: "" },
  sendTime: { type: String, default: "" },
  type: { type: String, default: "" },
});

const BroadcastModel = model<IBroadcast>("broadcast", broadcastSchema);

export default BroadcastModel;
