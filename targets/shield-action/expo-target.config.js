/** Shield Action extension — handles taps on the shield's two buttons. */
module.exports = {
  type: "shield-action",
  name: "SalahShieldAction",
  entitlements: {
    "com.apple.security.application-groups": [
      "group.com.flicktek.muslimpromax",
    ],
    "com.apple.developer.family-controls": true,
  },
  frameworks: ["ManagedSettings", "FamilyControls"],
};
