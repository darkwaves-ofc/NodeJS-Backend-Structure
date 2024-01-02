import { Schema, model, Document } from "mongoose";

interface IEventParticipant extends Document {
  eventId: StringConstructor;
  participants: any;
}

const eventParticipantsSchema: Schema<IEventParticipant> = new Schema({
  eventId: { type: String },
  participants: {
    type: Array,
    default: [
      { userAdmissionId: null, userName: null, marks: null, place: null },
    ],
  },
});

interface IHouseMember extends Document {
  MemberID: number;
}

const houseMembersSchema: Schema<IHouseMember> = new Schema({
  MemberID: { type: Number },
});

interface IHouseData extends Document {
  Name: string;
  members: IHouseMember[];
  eventData: IEventParticipant[];
  houseScore: number;
  description: string;
}

const housesSchema: Schema<IHouseData> = new Schema({
  Name: { type: String, required: true },
  members: [houseMembersSchema],
  eventData: [eventParticipantsSchema],
  houseScore: { type: Number, default: 0 },
  description: { type: String },
});

const HouseDataModel = model<IHouseData>("houseData", housesSchema);

export default HouseDataModel;
