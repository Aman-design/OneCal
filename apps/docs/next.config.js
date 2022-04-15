const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.js",
  unstable_staticImage: true,
});
module.exports = withNextra({
  async rewrites() {
    return [
      // This redirects requests recieved at / the root to the /api/ folder.
      {
        source: "/api",
        destination: "https://developer.cal.com/",
        // permanent: false,
      },
      // {
      //   source: "/api/:rest*",
      //   destination: "https://developer.cal.com/:rest*",
      // },
      // This redirects requests to api/v*/ to /api/ passing version as a query parameter.
      // {
      //   source: "/api/v:version/:rest*",
      //   destination: "/api/:rest*?version=:version",
      // },
    ];
  },
});
