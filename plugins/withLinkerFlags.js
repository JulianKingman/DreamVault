const { withXcodeProject } = require('expo/config-plugins');

module.exports = function withLinkerFlags(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();

    for (const key in configurations) {
      const buildSettings = configurations[key].buildSettings;
      if (!buildSettings) continue;

      // Only target app configurations (not pods)
      if (buildSettings.PRODUCT_NAME || buildSettings.INFOPLIST_FILE) {
        buildSettings.OTHER_LDFLAGS = buildSettings.OTHER_LDFLAGS || ['$(inherited)'];
        if (Array.isArray(buildSettings.OTHER_LDFLAGS)) {
          // MMKV needs libz for crc32
          if (!buildSettings.OTHER_LDFLAGS.includes('"-lz"')) {
            buildSettings.OTHER_LDFLAGS.push('"-lz"');
          }
        }
        // Xcode 26: prevent implicit linking with SwiftUICore
        buildSettings.DISABLE_DIAMOND_PROBLEM_DIAGNOSTIC = 'YES';
      }
    }

    return config;
  });
};
