import { Schema, model, Document } from "mongoose";

interface IPlaces extends Document {
  place: number;
  minimumMarks: number;
  inputMarks: number;
  inputID: string;
  house: string;
  name: string;
}

const placesSchema: Schema<IPlaces> = new Schema({
  place: { type: Number },
  minimumMarks: { type: Number },
  inputMarks: { type: Number },
  inputID: { type: String },
  house: { type: String },
  name: { type: String },
});

interface IEvent extends Document {
  name: string;
  description: string;
  types: any; // Define the specific type for 'types' array
  places: IPlaces[];
  state: string;
  inputType: "MemberID" | "HouseName";
}

const eventSchema: Schema<IEvent> = new Schema({
  name: { type: String },
  description: { type: String },
  types: { type: Array },
  places: [placesSchema],
  state: { type: String, default: "notSubmitted" },
  inputType: { type: String, enum: ["MemberID", "HouseName"] },
});

const EventDataModel = model<IEvent>("eventData", eventSchema);

export default EventDataModel;
