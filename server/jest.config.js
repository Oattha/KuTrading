export default {
  testEnvironment: "node",
  verbose: true,
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/setupTest.js"],
};
