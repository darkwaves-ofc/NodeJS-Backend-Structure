"use strict";

import { EventEmitter } from "events";
import { readdir } from "fs";
import dashboardDataDb from "../schema/dashboard";
import userData from "../schema/userData";
import { AppTypes } from "../structures/App";

// interface Schema {
//   _id: {
//       $oid: string;
//   };
//   type: string;
//   navigationLinks: ({
//       title: string;
//       icon: string;
//       path: string;
//       url: string;
//       _id: {
//           $oid: string;
//       };
//       subMenu: never[];
//   } | {
//       title: string;
//       icon: string;
//       path: string;
//       url: string;
//       _id: {
//         $oid: string;
//       };
//       subMenu?: undefined;
//   })[];
//   __v: number;
// }

export = class DatabaseInitializer {
  private client: AppTypes;

  constructor(client: AppTypes) {
    if (!client) throw new Error(`client is required`);
    this.client = client;
  }

  private convertIdsRecursive(obj: any): any {
    if (obj instanceof Array) {
      return obj.map((item) => this.convertIdsRecursive(item));
    } else if (obj instanceof Object) {
      const newObj = { ...obj };
      for (const key in newObj) {
        if (newObj.hasOwnProperty(key)) {
          if (key === "_id" && newObj[key].$oid) {
            newObj[key] = newObj[key].$oid;
          } else {
            newObj[key] = this.convertIdsRecursive(newObj[key]);
          }
        }
      }
      return newObj;
    }
    return obj;
  }

  public async loadDashboardDatas() {
    const schemas = [
      {
        _id: {
          $oid: "655c26d1527821278fc1cd82",
        },
        type: "admin",
        navigationLinks: [
          {
            title: "Home",
            icon: "fa-house",
            path: "/home",
            url: "/Home",
            _id: {
              $oid: "655c26d1527821278fc1cd83",
            },
            subMenu: [],
          },
          {
            title: "Events",
            icon: "fa-calendar",
            path: "/events/*",
            url: "/Events",
            subMenu: [
              {
                url: "/Events/Manager",
                icon: "fa-bars-progress",
                title: "Event Manager",
                _id: {
                  $oid: "655c26d1527821278fc1cd85",
                },
              },
            ],
            _id: {
              $oid: "655c26d1527821278fc1cd84",
            },
          },
          {
            title: "Users",
            icon: "fa-users",
            path: "/user/*",
            url: "/User",
            subMenu: [
              {
                url: "/User/Edit",
                icon: "fa-user-pen",
                title: "User Edit",
                _id: {
                  $oid: "655c4b3fd711067102915a3e",
                },
              },
              {
                url: "/User/Add",
                icon: "fa-user-plus",
                title: "User Add",
              },
            ],
            _id: {
              $oid: "655c4b3fd711067102915a3d",
            },
          },
          {
            title: "Members",
            icon: "fa-people-line",
            path: "/members/*",
            url: "/Members",
            subMenu: [
              {
                url: "/Members/Add",
                icon: "fa-person-circle-plus",
                title: "Add Members",
              },
              {
                url: "/Members/Edit",
                icon: "fa-people-pulling",
                title: "Edit Members",
              },
            ],
          },
          {
            title: "Broadcast",
            icon: "fa-bullhorn",
            path: "/broadcast/*",
            url: "/Broadcast",
            _id: {
              $oid: "655c26d1527821278fc1cd87",
            },
            subMenu: [],
          },
          {
            title: "Settings",
            icon: "fa-gear",
            path: "/settings/*",
            url: "/Settings",
            _id: {
              $oid: "655c26d1527821278fc1cd88",
            },
            subMenu: [],
          },
        ],
        __v: 0,
      },
      {
        _id: {
          $oid: "655c27b0fc5c652837dde1fc",
        },
        type: "staff",
        navigationLinks: [
          {
            title: "Home",
            icon: "fa-house",
            path: "/home",
            url: "/Home",
            _id: {
              $oid: "655c27b0fc5c652837dde1fd",
            },
            subMenu: [],
          },
          {
            title: "Submit",
            icon: "fa-clipboard-list",
            path: "/submit/*",
            url: "/Submit",
            _id: {
              $oid: "655c27b0fc5c652837dde201",
            },
          },
        ],
        __v: 0,
      },
      {
        _id: {
          $oid: "655c4b3fd711067102915a37",
        },
        type: "owner",
        navigationLinks: [
          {
            title: "Home",
            icon: "fa-house",
            path: "/home",
            url: "/Home",
            _id: {
              $oid: "655c4b3fd711067102915a38",
            },
            subMenu: [],
          },
          {
            title: "Approves",
            icon: "fa-list-check",
            path: "/approve/*",
            url: "/Approve",
          },
          {
            title: "Events",
            icon: "fa-calendar",
            path: "/events/*",
            url: "/Events",
            subMenu: [
              {
                url: "/Events/Manager",
                icon: "fa-bars-progress",
                title: "Event Manager",
                _id: {
                  $oid: "655c4b3fd711067102915a3a",
                },
              },
            ],
            _id: {
              $oid: "655c4b3fd711067102915a39",
            },
          },
          {
            title: "Broadcast",
            icon: "fa-bullhorn",
            path: "/broadcast/*",
            url: "/Broadcast",
            _id: {
              $oid: "655c4b3fd711067102915a3c",
            },
            subMenu: [],
          },
          {
            title: "Members",
            icon: "fa-people-line",
            path: "/members/*",
            url: "/Members",
            subMenu: [
              {
                url: "/Members/Add",
                icon: "fa-person-circle-plus",
                title: "Add Members",
              },
              {
                url: "/Members/Edit",
                icon: "fa-people-pulling",
                title: "Edit Members",
              },
            ],
          },
          {
            title: "Users",
            icon: "fa-users",
            path: "/user/*",
            url: "/User",
            subMenu: [
              {
                url: "/User/Edit",
                icon: "fa-user-pen",
                title: "User Edit",
                _id: {
                  $oid: "655c4b3fd711067102915a3e",
                },
              },
              {
                url: "/User/Add",
                icon: "fa-user-plus",
                title: "User Add",
              },
            ],
            _id: {
              $oid: "655c4b3fd711067102915a3d",
            },
          },
          {
            title: "Settings",
            icon: "fa-gear",
            path: "/settings/*",
            url: "/Settings",
            _id: {
              $oid: "655c4b3fd711067102915a44",
            },
            subMenu: [],
          },
        ],
        __v: 0,
      },
    ];

    for (const schema of schemas) {
      const id = schema._id.$oid;
      let schemaDb = await dashboardDataDb.findOne({ _id: id }).catch(() => {});
      if (schemaDb) continue;
      schemaDb = await new dashboardDataDb(
        this.convertIdsRecursive(schema)
      ).save();
    }
  }

  public async loadAdminMembers() {
    const schemas = [
      {
        _id: "6551912eadeb5039127c163e",
        notifications: {
          unread: [],
          all: [],
        },
        roles: {
          roleType: "owner",
          roleIndex: "1",
        },
        owner: false,
        eventData: [],
        friends: [],
        status: 1,
        statusMessage: "",
        flags: [],
        createdAt: "1699844400526",
        deleted: false,
        tokens: [],
        email: "darkwavesofc4@gmail.com",
        userName: "darkwaves",
        password:
          "$2b$10$EhggKEGsa6hG6S6KYiSkr.Hf.YfISk568oMxuSTsKDFVn6EkoXccG",
        phoneNumber: "071725466",
        school: "mrcm",
        name: "Dark Waves",
        __v: 8,
      },
      {
        _id: "655197a2c45fdaaaca434122",
        notifications: {
          unread: [],
          all: [],
        },
        roles: {
          roleType: "owner",
          roleIndex: "1",
        },
        owner: false,
        eventData: [],
        friends: [],
        status: 1,
        statusMessage: "",
        flags: [],
        createdAt: "1699846051627",
        deleted: false,
        tokens: [],
        email: "darkwavesofc2@gmail.com",
        userName: "darkwaves1",
        password:
          "$2b$10$Fszw4Ogvg4EMKgCJtOBgB.y/jgagXPVFm/H21ziGpI11mYCntnZqi",
        phoneNumber: "071725466",
        school: "mrcm",
        name: "Dark Waves",
        __v: 6,
      },
      {
        _id: "655197c6c45fdaaaca43412e",
        notifications: {
          unread: [],
          all: [],
        },
        roles: {
          roleType: "staff",
          roleIndex: "3",
        },
        owner: false,
        eventData: [],
        friends: [],
        status: 1,
        statusMessage: "",
        flags: [],
        createdAt: "1699846087062",
        deleted: false,
        tokens: [],
        email: "darkwavesofc3@gmail.com",
        userName: "darkwaves2",
        password:
          "$2b$10$GsaBJezgygV8asMb4.3TveMv4dj3y9da.aC2oUufLyQtXA3ztGaOi",
        phoneNumber: "071725466",
        school: "mrcm",
        name: "Dark Waves",
        __v: 2,
      },
      {
        _id: "6551981b7296875721663e74",
        notifications: {
          unread: [],
          all: [],
        },
        roles: {
          roleType: "admin",
          roleIndex: "2",
        },
        owner: false,
        eventData: [],
        friends: [],
        status: 1,
        statusMessage: "",
        flags: [],
        createdAt: "1699846172030",
        deleted: false,
        tokens: [],
        email: "darkwavesofc5@gmail.com",
        userName: "darkwaves3",
        password:
          "$2b$10$q5l9MLltuqDk51MOa.BQBO0N5WjooNkPhehXfppPKX7/ZVU8YkUw.",
        phoneNumber: "071725466",
        school: "mrcm",
        name: "Dark Waves",
        __v: 3,
      },
    ];

    for (const schema of schemas) {
      const id = schema._id;
      let schemaDb = await userData.findOne({ _id: id }).catch(() => {});
      if (schemaDb) continue;
      schemaDb = await new userData(this.convertIdsRecursive(schema)).save();
    }
  }

  public async start() {
    // await this.loadDashboardDatas();
    // await this.loadAdminMembers();
    this.client.logger.log("[ DB ] Database initialized:");
  }
};
