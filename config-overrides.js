module.exports = config => {
  require("react-app-rewire-postcss")(config, {
    plugins: loader => [
      require("postcss-preset-env")({
        autoprefixer: {
          flexbox: "no-2009"
        },
        stage: 0
      })
    ]
  });
  config.externals = {
    moment: "moment"
  };
  config.target = "electron-renderer";

  return config;
};
