import { Schema, model, Document } from "mongoose";

interface IEventTypeOptions extends Document {
  option: string;
}

const eventTypeOptionsSchema: Schema<IEventTypeOptions> = new Schema({
  option: { type: String },
});

interface IEventTypes extends Document {
  name: string;
  options: IEventTypeOptions[];
}

const eventTypesSchema: Schema<IEventTypes> = new Schema({
  name: { type: String },
  options: [eventTypeOptionsSchema],
});

const EventTypesModel = model<IEventTypes>("eventTypes", eventTypesSchema);

export default EventTypesModel;
