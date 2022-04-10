module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(js|ts|jsx|tsx)$": "ts-jest",
  },
  setupFiles: ["<rootDir>/__test__/setup-tests.ts"],
  testTimeout: 120000,
};
