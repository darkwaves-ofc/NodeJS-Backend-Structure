import { Schema, model, Document } from "mongoose";

interface ISubMenu extends Document {
  url: string;
  icon: string;
  path: string;
  title: string;
}

const subMenuSchema: Schema<ISubMenu> = new Schema({
  url: String,
  icon: String,
  path: String,
  title: String,
});

interface INavigationLink extends Document {
  title: string;
  icon: string;
  path: string;
  url: string;
  subMenu: ISubMenu[]; // Embedding the sub-menu schema here
}

const navigationLinkSchema: Schema<INavigationLink> = new Schema({
  title: String,
  icon: String,
  path: String,
  url: String,
  subMenu: [subMenuSchema],
});

interface IDashboardData extends Document {
  type: string;
  navigationLinks: INavigationLink[];
}

const dashboardDataSchema: Schema<IDashboardData> = new Schema({
  type: { type: String, default: "" },
  navigationLinks: [navigationLinkSchema],
});

const DashboardDataModel = model<IDashboardData>(
  "DashboardData",
  dashboardDataSchema
);

export default DashboardDataModel;
