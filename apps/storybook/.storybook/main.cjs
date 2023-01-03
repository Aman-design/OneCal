const path = require('path');
const { mergeConfig } = require('vite');
const nodePolyfills = require('rollup-plugin-polyfill-node');

module.exports = {
  stories: ["../intro.stories.mdx", "../../../packages/ui/components/**/*.stories.mdx", "../../../packages/features/**/*.stories.mdx", "../../../packages/ui/components/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-interactions", "@storybook/addon-docs"],
  framework: {
    name: '@storybook/react-vite',
    options: { fastRefresh: true },
  },
  core: {
    builder: "@storybook/builder-vite"
  },
  staticDirs: ["../public"],
  // webpackFinal: async (config, { configType }) => {

  //   config.module.rules.push({
  //     test: /\.css$/,
  //     use: [
  //       "style-loader",
  //       {
  //         loader: "css-loader",
  //         options: {
  //           modules: true, // Enable modules to help you using className
  //         },
  //       },
  //     ],
  //     include: path.resolve(__dirname, "../src"),
  //   });

  //   return config;
  // },
  async viteFinal(config) {
    return mergeConfig(config, {
      define: {
        'process.env.VERCEL_URL': true,
        'process.env.NEXT_PUBLIC_WEBAPP_URL': true,
        'process.env.NEXT_PUBLIC_WEBSITE_URL': true,
        'process.env.NEXTAUTH_URL': true
      },
      plugins: [
        // ...config.plugins,
        nodePolyfills()
      ],
      resolve: {
        alias: {
          fs: require.resolve('rollup-plugin-polyfill-node').modules.fs,
          crypto: require.resolve('rollup-plugin-polyfill-node').modules.crypto,
          path: require.resolve('rollup-plugin-polyfill-node').modules.path,
          // fs: path.resolve(__dirname, '../../../node_modules/rollup-plugin-polyfill-node'),
          // url: path.resolve(__dirname, '../../../node_modules/rollup-plugin-polyfill-node'),
          // os: path.resolve(__dirname, '../../../node_modules/rollup-plugin-polyfill-node'),
          // crypto: path.resolve(__dirname, '../../../node_modules/rollup-plugin-polyfill-node'),
          // http: path.resolve(__dirname, '../../../node_modules/rollup-plugin-polyfill-node/dist/es/modules.js'),
          // http2: path.resolve(__dirname, '../../../node_modules/rollup-plugin-polyfill-node/dist/es/modules.js'),
          // stream: path.resolve(__dirname, '../../../node_modules/rollup-plugin-polyfill-node/dist/es/modules.js'),
          // path: path.resolve(__dirname, '../../../node_modules/rollup-plugin-polyfill-node/dist/es/modules.js'),
          // process: path.resolve(__dirname, '../../../node_modules/rollup-plugin-polyfill-node/dist/es/modules.js'),
        }
      },
      // server: {
      //   fs: {
      //     allow: [
      //       '.storybook',
      //       'styles',
      //       '../../../packages/ui/styles',
      //       './'
      //     ],
      //   }
      // }
    });
  },
  features: {
    storyStoreV7: true,
    previewMdx2: true,
  },
  docs: {
    autodocs: true
  }
};