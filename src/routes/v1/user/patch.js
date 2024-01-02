"use strict";

class route {
  constructor(client) {
    const express = require("express");
    const router = express.Router();
    const userDataDb = require("../../../schema/userData.js");

    router.patch("/user/:userId", async (req, res, next) => {
      const notFoundError = function (message, code, data) {
        return res.status(code).json({ error: true, message, data });
      };

      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN_VALUE

      const { userId } = req.params;
      const {
        updatedData = {
          userName: undefined,
          name: undefined,
          role: undefined,
          password: undefined,
        },
      } = req.body;

      const tokenUserData = await client
        .findUser(token, req.secret)
        .catch(() => {});

      if (!tokenUserData) {
        return notFoundError("You are not logged into the system", 400);
      }
      const { userName, name, role, password } = updatedData;

      let editingUser;

      switch (userId === "@me" || String(tokenUserData._id) === userId) {
        case true: {
          editingUser = await userDataDb.findOne({ _id: userId });
          break;
        }
        case false: {
          const findingUserData = await userDataDb.findOne({ _id: userId });

          if (findingUserData.roles.roleType < tokenUserData.roles.roleType) {
            return notFoundError("You Don't Have permissions", 400);
          }

          break;
        }
      }

      if (userName) {
        if (await userDataDb.findOne({ userName }).catch(() => {})) {
          return notFoundError(
            `This userName already exits on the database`,
            400,
          );
        } else {
          editingUser.userName = userName;
        }
      }
      if (name) {
        editingUser.name = name;
      }
      if (role) {
        const roleHierarchy = {
          3: "Staff",
          2: "Admin",
          1: "Owner",
        };

        const newRoles = {
          roleType: roleHierarchy[role],
          roleIndex: role,
        };
        editingUser.roles = newRoles;
      }
      if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        editingUser.password = hashedPassword;
      }

      await editingUser.save();

      return res.status(200).json({ message: "ok" });
    });

    // router.patch("/user/:userId/profile", async (req, res, next) => {
    //   const notFoundError = function (message, code, data) {
    //     return res.status(code).json({ error: true, message, data });
    //   };
    //   const { userId } = req.params;
    //   const {
    //     token,
    //     updatedData = {
    //       email: undefined,
    //       userName: undefined,
    //       phoneNumber: undefined,
    //       school: undefined,
    //       name: undefined,
    //       profilePicture: undefined,
    //       bio: undefined,
    //     },
    //   } = req.body;

    //   const tokenUserData = await client
    //     .findUser(token, req.secret)
    //     .catch(() => {});

    //   if (!tokenUserData) {
    //     return notFoundError("You are not logged into the system", 400);
    //   }
    //   const { userSchema } = await client.users
    //     .getFetch(tokenUserData._id)
    //     .catch(() => {});

    //   if (!userSchema) {
    //     return notFoundError("Cannot find the user", 400);
    //   }
    //   const {
    //     email,
    //     userName,
    //     phoneNumber,
    //     school,
    //     name,
    //     profilePicture,
    //     bio,
    //   } = updatedData;

    //   let editingUser;

    //   switch (userId === "@me" || String(tokenUserData._id) === userId) {
    //     case true: {
    //       const findingUserData = userSchema;
    //       editingUser = findingUserData;
    //       break;
    //     }
    //     case false: {
    //       const { userSchema: findingUserData } = await client.users
    //         .getFetch(tokenUserData._id)
    //         .catch(() => {});

    //       if (!findingUserData) {
    //         return notFoundError("Cannot find the user", 400);
    //       }

    //       editingUser = findingUserData;

    //       if (editingUser.owner) {
    //         return notFoundError(
    //           "This user is the owner of this platform",
    //           400
    //         );
    //       }

    //       if (!userSchema.owner) {
    //         const editingUserHeighestFlag = await new permissionCalculator()
    //           .getHighestFlag(editingUser)
    //           .catch(() => {});
    //         const userSchemaHeighestFlag = await new permissionCalculator()
    //           .getHighestFlag(userSchema)
    //           .catch(() => {});
    //         if (
    //           editingUserHeighestFlag.flag.position <=
    //           userSchemaHeighestFlag.flag.position
    //         ) {
    //           return notFoundError(
    //             "Editing user has a higher flag than you or equal to you",
    //             400
    //           );
    //         }
    //       }
    //       if (
    //         !(await new permissionCalculator()
    //           .hasPermission(userSchema, "MANAGE_USERS")
    //           .catch(() => {}))
    //       ) {
    //         return notFoundError(
    //           "You dont have permissions to execute this command",
    //           400
    //         );
    //       }
    //       break;
    //     }
    //   }

    //   if (email) {
    //     if (await userDataDb.findOne({ email }).catch(() => {})) {
    //       return notFoundError(`This email already exits on the database`, 400);
    //     } else {
    //       editingUser.email = email;
    //     }
    //   }
    //   if (userName) {
    //     if (await userDataDb.findOne({ userName }).catch(() => {})) {
    //       return notFoundError(
    //         `This userName already exits on the database`,
    //         400
    //       );
    //     } else {
    //       editingUser.userName = userName;
    //     }
    //   }
    //   if (phoneNumber) {
    //     editingUser.phoneNumber = phoneNumber;
    //   }

    //   if (name) {
    //     editingUser.name = name;
    //   }
    //   if (bio) {
    //     editingUser.bio = bio;
    //   }
    //   if (school) {
    //     editingUser.school = school;
    //   }

    //   await editingUser.save();

    //   client.emitGlobalEvents("userUpdate", {
    //     id: editingUser._id,
    //   });

    //   return res.status(200).json({ message: "ok" });
    // });

    // router.patch("/user/:userId/password", async (req, res, next) => {
    //   const notFoundError = function (message, code, data) {
    //     return res.status(code).json({ error: true, message, data });
    //   };
    //   const { userId } = req.params;
    //   const {
    //     token,
    //     updatedData = {
    //       oldPassword: undefined,
    //       newPassword: undefined,
    //       confirmPassword: undefined,
    //     },
    //   } = req.body;

    //   const tokenUserData = await client
    //     .findUser(token, req.secret)
    //     .catch(() => {});

    //   if (!tokenUserData) {
    //     return notFoundError("You are not logged into the system", 400);
    //   }
    //   const { userSchema } = await client.users
    //     .getFetch(tokenUserData._id)
    //     .catch(() => {});

    //   if (!userSchema) {
    //     return notFoundError("Cannot find the user", 400);
    //   }
    //   const { oldPassword, newPassword, confirmPassword } = updatedData;

    //   let editingUser;

    //   switch (userId === "@me" || String(tokenUserData._id) === userId) {
    //     case true: {
    //       const findingUserData = userSchema;
    //       editingUser = findingUserData;
    //       break;
    //     }
    //     case false: {
    //       const { userSchema: findingUserData } = await client.users
    //         .getFetch(tokenUserData._id)
    //         .catch(() => {});

    //       if (!findingUserData) {
    //         return notFoundError("Cannot find the user", 400);
    //       }

    //       editingUser = findingUserData;

    //       if (editingUser.owner) {
    //         return notFoundError(
    //           "This user is the owner of this platform",
    //           400
    //         );
    //       }

    //       if (!userSchema.owner) {
    //         const editingUserHeighestFlag = await new permissionCalculator()
    //           .getHighestFlag(editingUser)
    //           .catch(() => {});
    //         const userSchemaHeighestFlag = await new permissionCalculator()
    //           .getHighestFlag(userSchema)
    //           .catch(() => {});
    //         if (
    //           editingUserHeighestFlag.flag.position <=
    //           userSchemaHeighestFlag.flag.position
    //         ) {
    //           return notFoundError(
    //             "Editing user has a higher flag than you or equal to you",
    //             400
    //           );
    //         }
    //       }

    //       if (
    //         !(await new permissionCalculator()
    //           .hasPermission(userSchema, "MANAGE_USERS")
    //           .catch(() => {}))
    //       ) {
    //         return notFoundError(
    //           "You dont have permissions to execute this command",
    //           400
    //         );
    //       }
    //       oldPassword = editingUser.password;
    //       confirmPassword = newPassword;
    //       break;
    //     }
    //   }

    //   if (!oldPassword) {
    //     return notFoundError(`oldPassword is required`, 400);
    //   } else if (editingUser.password !== oldPassword) {
    //     return notFoundError(
    //       `oldPassword does not match to your current password`,
    //       400
    //     );
    //   }

    //   if (!newPassword) {
    //     return notFoundError(`newPassword is required`, 400);
    //   }

    //   if (!confirmPassword) {
    //     return notFoundError(`confirmPassword is required`, 400);
    //   } else if (confirmPassword !== newPassword) {
    //     return notFoundError(
    //       `confirmPassword does not match to your newPassword`,
    //       400
    //     );
    //   }
    //   editingUser.password = newPassword;
    //   await editingUser.save();

    //   client.emitGlobalEvents("userUpdate", {
    //     id: editingUser._id,
    //     internal: true,
    //   });

    //   return res.status(200).json({ message: "ok" });
    // });

    // router.patch("/user/:userId/status", async (req, res, next) => {
    //   const notFoundError = function (message, code, data) {
    //     return res.status(code).json({ error: true, message, data });
    //   };
    //   const { userId } = req.params;
    //   const { token, updatedData = {} } = req.body;

    //   const tokenUserData = await client
    //     .findUser(token, req.secret)
    //     .catch(() => {});

    //   if (!tokenUserData) {
    //     return notFoundError("You are not logged into the system", 400);
    //   }
    //   const { userSchema } = await client.users
    //     .getFetch(tokenUserData._id)
    //     .catch(() => {});

    //   if (!userSchema) {
    //     return notFoundError("Cannot find the user", 400);
    //   }
    //   const { status, statusMessage } = updatedData;

    //   let editingUser;

    //   switch (userId === "@me" || String(tokenUserData._id) === userId) {
    //     case true: {
    //       const findingUserData = userSchema;
    //       editingUser = findingUserData;
    //       break;
    //     }
    //     case false: {
    //       const { userSchema: findingUserData } = await client.users
    //         .getFetch(tokenUserData._id)
    //         .catch(() => {});

    //       if (!findingUserData) {
    //         return notFoundError("Cannot find the user", 400);
    //       }

    //       editingUser = findingUserData;

    //       if (editingUser.owner) {
    //         return notFoundError(
    //           "This user is the owner of this platform",
    //           400
    //         );
    //       }

    //       if (!userSchema.owner) {
    //         const editingUserHeighestFlag = await new permissionCalculator()
    //           .getHighestFlag(editingUser)
    //           .catch(() => {});
    //         const userSchemaHeighestFlag = await new permissionCalculator()
    //           .getHighestFlag(userSchema)
    //           .catch(() => {});
    //         if (
    //           editingUserHeighestFlag.flag.position <=
    //           userSchemaHeighestFlag.flag.position
    //         ) {
    //           return notFoundError(
    //             "Editing user has a higher flag than you or equal to you",
    //             400
    //           );
    //         }
    //       }

    //       if (
    //         !(await new permissionCalculator()
    //           .hasPermission(userSchema, "MANAGE_USERS")
    //           .catch(() => {}))
    //       ) {
    //         return notFoundError(
    //           "You dont have permissions to execute this command",
    //           400
    //         );
    //       }

    //       break;
    //     }
    //   }
    //   if (!(status === 0 || status === 1 || status === 2)) {
    //     return notFoundError("Status Must be 0 or 1 or 2", 400);
    //   }
    //   editingUser.statusMessage = statusMessage;
    //   editingUser.status = status;
    //   await editingUser.save();

    //   client.emitGlobalEvents("userUpdate", {
    //     id: editingUser._id,
    //     internal: true,
    //   });

    //   client.emitGlobalEvents("userPrecenceUpdate", {
    //     id: editingUser._id,
    //     status,
    //     statusMessage,
    //   });

    //   return res.status(200).json({ message: "ok" });
    // });

    // router.patch("/user/:userId/flags", async (req, res, next) => {
    //   const notFoundError = function (message, code, data) {
    //     return res.status(code).json({ error: true, message, data });
    //   };
    //   const { userId } = req.params;
    //   const {
    //     token,
    //     updatedData = {
    //       flags: undefined,
    //     },
    //   } = req.body;

    //   const tokenUserData = await client
    //     .findUser(token, req.secret)
    //     .catch(() => {});

    //   if (!tokenUserData) {
    //     return notFoundError("You are not logged into the system", 400);
    //   }
    //   const { userSchema } = await client.users
    //     .getFetch(tokenUserData._id)
    //     .catch(() => {});

    //   if (!userSchema) {
    //     return notFoundError("Cannot find the user", 400);
    //   }
    //   const { flags } = updatedData;

    //   let editingUser;

    //   if (
    //     !(await new permissionCalculator()
    //       .hasPermission(userSchema, "MANAGE_USERS")
    //       .catch(() => {}))
    //   ) {
    //     return notFoundError(
    //       "You dont have permissions to execute this command",
    //       400
    //     );
    //   }

    //   switch (userId === "@me" || String(tokenUserData._id) === userId) {
    //     case true: {
    //       const findingUserData = userSchema;
    //       editingUser = findingUserData;

    //       break;
    //     }
    //     case false: {
    //       const { userSchema: findingUserData } = await client.users
    //         .getFetch(tokenUserData._id)
    //         .catch(() => {});

    //       if (!findingUserData) {
    //         return notFoundError("Cannot find the user", 400);
    //       }

    //       editingUser = findingUserData;

    //       if (editingUser.owner) {
    //         return notFoundError(
    //           "This user is the owner of this platform",
    //           400
    //         );
    //       }

    //       if (!userSchema.owner) {
    //         const editingUserHeighestFlag = await new permissionCalculator()
    //           .getHighestFlag(editingUser)
    //           .catch(() => {});
    //         const userSchemaHeighestFlag = await new permissionCalculator()
    //           .getHighestFlag(userSchema)
    //           .catch(() => {});
    //         if (
    //           editingUserHeighestFlag.flag.position <=
    //           userSchemaHeighestFlag.flag.position
    //         ) {
    //           return notFoundError(
    //             "Editing user has a higher flag than you or equal to you",
    //             400
    //           );
    //         }
    //       }
    //       break;
    //     }
    //   }

    //   const addedFlags = [];
    //   const removedFlags = [];

    //   for (const x of flags) {
    //     if (x.type === "add") {
    //       const flag = await new permissionCalculator().getFlag(x.id);
    //       if (!userSchema.owner) {
    //         const { flag: heighestFlag } =
    //           await new permissionCalculator().getHighestFlag(userSchema);
    //         if (flag.position <= heighestFlag) continue;
    //       }
    //       addedFlags.push(flag._id);
    //     }
    //     if (x.type === "remove") {
    //       const flag = await new permissionCalculator().getFlag(x.id);
    //       if (!userSchema.owner) {
    //         const { flag: heighestFlag } =
    //           await new permissionCalculator().getHighestFlag(userSchema);
    //         if (flag.position <= heighestFlag) continue;
    //       }
    //       removedFlags.push(flag._id);
    //     }
    //   }
    //   editingUser.flags = editingUser.flags.map(
    //     (val) => !removedFlags.includes(val) && val
    //   );
    //   editingUser.flags = [...editingUser.flags, ...addedFlags];

    //   await editingUser.save();

    //   client.emitGlobalEvents("userUpdate", {
    //     id: editingUser._id,
    //   });

    //   return res.status(200).json({ message: "ok", addedFlags, removedFlags });
    // });

    return router;
  }
}
module.exports = { route: route, name: "user-patch" };
