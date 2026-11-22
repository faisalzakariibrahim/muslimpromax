/** Unit tests for the pure logic (prayer math, Noor score, streaks).
 *  Native/RN code is tested on-device, not here. */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  // `isolatedModules` lives in tsconfig.json. Only `adhan` and the pure logic
  // are in the unit-test graph; expo-* / react-native are intentionally out.
};
