module.exports = {
  makers: [
    {
      name: "@electron-forge/maker-zip",
    },
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "evo-admin",
        description: "evo-admin",
      },
    },
    // {
    //   name: "@electron-forge/maker-deb",
    // },
    // {
    //   name: "@electron-forge/maker-rpm",
    // },
  ],
  // ...
  // makers: [
  //   {
  //     name: '@electron-forge/maker-squirrel',
  //     config: {
  //       certificateFile: './cert.pfx',
  //       certificatePassword: process.env.CERTIFICATE_PASSWORD
  //     }
  //   }
  // ]
  // ...
}
