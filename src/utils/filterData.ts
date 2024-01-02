import dayjs from "dayjs";
import { AppTypes } from "../structures/App";

interface UserData {
  profilePicture: string;
  bio: string;
  userName: string;
  _id: string;
  name: string;
  school: string;
  email: string;
  phoneNumber: string;
  owner: boolean;
  createdAt: string;
  roles: {
    roleType: string;
    roleIndex: string;
  };
}

interface DestrucuredData {
  profilePicture: string;
  bio: string;
  userName: string;
  id: string;
  name: string;
  school: string;
  owner: boolean;
  createdAt: dayjs.Dayjs; // Update to correct type Dayjs
  role: string;
  editAccessRoles?: {
    roleIndex: number;
    roleType: string;
  }[];
}

class FilterData {
  private client: AppTypes;

  constructor(client: AppTypes) {
    this.client = client;
  }

  user(userType: string, findingUserData: UserData): DestrucuredData {
    const destrucuredData: DestrucuredData = {
      profilePicture: findingUserData.profilePicture || "",
      bio: findingUserData.bio || "",
      userName: findingUserData.userName || "",
      id: String(findingUserData._id) || "",
      name: findingUserData.name || "",
      school: findingUserData.school || "",
      owner: findingUserData.owner || false,
      createdAt: dayjs(findingUserData.createdAt), // Initialize with dayjs
      role: findingUserData.roles.roleType || "",
    };

    if (userType === "@me") {
      if (findingUserData.roles.roleIndex === "1") {
        destrucuredData.editAccessRoles = [
          { roleIndex: 2, roleType: "admin" },
          { roleIndex: 3, roleType: "staff" },
        ];
      } else if (findingUserData.roles.roleIndex === "2") {
        destrucuredData.editAccessRoles = [{ roleIndex: 3, roleType: "staff" }];
      } else if (findingUserData.roles.roleIndex === "3") {
        destrucuredData.editAccessRoles = [];
      }
    }

    return destrucuredData;
  }
}

export default FilterData;
