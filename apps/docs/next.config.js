const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.js",
  unstable_staticImage: true,
});

module.exports = withNextra({
  async rewrites() {
    return [{ basePath: false, source: "/api", destination: "https://developer.cal.com" }];
  },
});
