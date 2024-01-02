import { Schema, model, Document } from "mongoose";

interface IMemberData extends Document {
  Name: string | null;
  House: string | null;
  Grade: string | null;
  MemberID: number | null;
}

const memberSchema: Schema<IMemberData> = new Schema({
  Name: { type: String, default: null },
  House: { type: String, default: null },
  Grade: { type: String, default: null },
  MemberID: { type: Number, default: null },
});

const MemberDataModel = model<IMemberData>("memberData", memberSchema);

export default MemberDataModel;
