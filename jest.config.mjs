export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      tsconfig: "./tsconfig.json",
      useESM: true,
    },
  },
  modulePaths: ["<rootDir>"],
  testEnvironment: "miniflare",
  testEnvironmentOptions: {
    // Miniflare doesn't yet support the `main` field in `wrangler.toml` so we
    // need to explicitly tell it where our built worker is. We also need to
    // explicitly mark it as an ES module.
    scriptPath: "./out/index.mjs",
    globals: {
      window: true,
    },
    modules: true,
  },
};
