/** DeviceActivityMonitor extension — applies/removes the shield on schedule. */
module.exports = {
  type: "device-activity-monitor",
  name: "SalahMonitor",
  entitlements: {
    "com.apple.security.application-groups": [
      "group.com.flicktek.muslimpromax",
    ],
    "com.apple.developer.family-controls": true,
  },
  frameworks: ["DeviceActivity", "ManagedSettings", "FamilyControls"],
};
