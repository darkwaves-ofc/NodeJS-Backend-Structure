import dayjs from "dayjs";

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

class FilterData {
  private client: any;

  constructor(client: any) {
    this.client = client;
  }

  async user(userType: string, findingUserData: UserData) {
    const destrucuredData: any = {};

    switch (userType === "@me") {
      case true: {
        this.populateDestructuredData(destrucuredData, findingUserData);

        if (findingUserData.roles.roleIndex === "1") {
          destrucuredData.editAcessRoles = [
            { roleIndex: 2, roleType: "admin" },
            { roleIndex: 3, roleType: "staff" },
          ];
        } else if (findingUserData.roles.roleIndex === "2") {
          destrucuredData.editAcessRoles = [
            { roleIndex: 3, roleType: "staff" },
          ];
        } else if (findingUserData.roles.roleIndex === "3") {
          destrucuredData.editAcessRoles = [];
        }
        break;
      }
      case false: {
        this.populateDestructuredData(destrucuredData, findingUserData);
        break;
      }
    }
    return destrucuredData;
  }

  private populateDestructuredData(
    destrucuredData: any,
    findingUserData: UserData
  ) {
    destrucuredData.profilePicture = findingUserData.profilePicture || "";
    destrucuredData.bio = findingUserData.bio || "";
    destrucuredData.userName = findingUserData.userName || "";
    destrucuredData.id = String(findingUserData._id) || "";
    destrucuredData.name = findingUserData.name || "";
    destrucuredData.school = findingUserData.school || "";
    destrucuredData.owner = findingUserData.owner || false;
    destrucuredData.createdAt = dayjs(findingUserData.createdAt) || "";
    destrucuredData.role = findingUserData.roles.roleType || "";
  }
}

export default FilterData;
