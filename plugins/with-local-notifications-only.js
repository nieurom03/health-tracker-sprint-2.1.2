const {
  withEntitlementsPlist,
  withInfoPlist,
} = require("expo/config-plugins");

/**
 * Health Tracker schedules notifications entirely on device. Expo applies the
 * notifications plugin automatically, including the APNs entitlement, even
 * though remote notifications are not used. Remove remote-only configuration
 * so local development builds can be signed by a Personal Team.
 */
module.exports = function withLocalNotificationsOnly(config) {
  config = withEntitlementsPlist(config, (configWithEntitlements) => {
    delete configWithEntitlements.modResults["aps-environment"];
    return configWithEntitlements;
  });

  return withInfoPlist(config, (configWithInfoPlist) => {
    const backgroundModes = configWithInfoPlist.modResults.UIBackgroundModes;
    if (!Array.isArray(backgroundModes)) {
      return configWithInfoPlist;
    }

    const localOnlyModes = backgroundModes.filter(
      (mode) => mode !== "remote-notification",
    );
    if (localOnlyModes.length === 0) {
      delete configWithInfoPlist.modResults.UIBackgroundModes;
    } else {
      configWithInfoPlist.modResults.UIBackgroundModes = localOnlyModes;
    }
    return configWithInfoPlist;
  });
};
