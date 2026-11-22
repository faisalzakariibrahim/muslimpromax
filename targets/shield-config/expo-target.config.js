/** Shield Configuration extension — the branded "it's time to pray" screen. */
module.exports = {
  type: "shield-configuration",
  name: "SalahShieldConfig",
  entitlements: {
    "com.apple.security.application-groups": [
      "group.com.flicktek.muslimpromax",
    ],
    "com.apple.developer.family-controls": true,
  },
  frameworks: ["ManagedSettings", "ManagedSettingsUI", "FamilyControls"],
};
