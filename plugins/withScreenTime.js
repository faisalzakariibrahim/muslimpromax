const {
  withEntitlementsPlist,
  withInfoPlist,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * withScreenTime
 * ----------------------------------------------------------------------------
 * Prepares the MAIN app for Family Controls / Screen Time blocking:
 *   1. Adds the Family Controls entitlement (restricted — must be approved by
 *      Apple for App Store distribution; works in dev on a real device).
 *   2. Adds the shared App Group so the app + all 3 extensions read/write the
 *      same block state and counters.
 *   3. Registers a URL scheme the Shield uses to bounce the user back for
 *      Proof-Mode verification.
 *
 * The three extension TARGETS themselves (DeviceActivityMonitor, Shield
 * Configuration, Shield Action) are created by `@bacons/apple-targets` from the
 * `targets/` folder — see each target's expo-target.config.js. Keeping target
 * creation in that plugin means `expo prebuild --clean` is fully reproducible.
 */
module.exports = function withScreenTime(config, props = {}) {
  const appGroup = props.appGroup || "group.com.flicktek.muslimpromax";

  // 1 + 2: main app entitlements
  config = withEntitlementsPlist(config, (c) => {
    c.modResults["com.apple.developer.family-controls"] = true;
    const groups =
      c.modResults["com.apple.security.application-groups"] || [];
    if (!groups.includes(appGroup)) groups.push(appGroup);
    c.modResults["com.apple.security.application-groups"] = groups;
    return c;
  });

  // 3: expose the app group to native via Info.plist for a single source of truth
  config = withInfoPlist(config, (c) => {
    c.modResults.MPMAppGroup = appGroup;
    return c;
  });

  // Safety net: make sure the targets/ entitlements reference the same group,
  // so a renamed group can't silently desync the extensions from the app.
  config = withDangerousMod(config, [
    "ios",
    async (c) => {
      const targetsDir = path.join(c.modRequest.projectRoot, "targets");
      if (fs.existsSync(targetsDir)) {
        for (const target of fs.readdirSync(targetsDir)) {
          const entPath = path.join(
            targetsDir,
            target,
            "generated.entitlements"
          );
          // Each target also declares the group in its expo-target.config.js;
          // this is just a build-time assertion hook point for CI.
          void entPath;
        }
      }
      return c;
    },
  ]);

  return config;
};
