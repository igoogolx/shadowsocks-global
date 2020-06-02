module.exports = (config) => {
  require("react-app-rewire-postcss")(config, {
    plugins: (loader) => [
      require("postcss-preset-env")({
        autoprefixer: {
          flexbox: "no-2009",
        },
        stage: 0,
      }),
    ],
  });
  config.externals = {
    moment: "moment",
    "geoip-country": "commonjs geoip-country",
    "electron-better-ipc": "commonjs electron-better-ipc",
    "electron-store": "commonjs electron-store",
  };
  config.target = "electron-renderer";
  config.node = {
    ...config.node,
    __dirname: true,
  };
  return config;
};
