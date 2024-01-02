import { Schema, model, Document } from "mongoose";

interface IUser extends Document {
  userName: string;
  name: string;
  email: string;
  password: string;
  roles: {
    roleType: string;
    roleIndex: string | null;
  };
  tokens: any; // Adjust this to the specific type of your tokens array
}

const userSchema: Schema<IUser> = new Schema({
  userName: { type: String },
  name: { type: String },
  email: { type: String },
  password: { type: String },
  roles: {
    roleType: { type: String, default: "" },
    roleIndex: { type: String, default: null },
  },
  tokens: { type: Array, default: [] },
});

const UserDataModel = model<IUser>("userData", userSchema);

export default UserDataModel;
