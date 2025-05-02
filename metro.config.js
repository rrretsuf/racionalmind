const { getDefaultConfig } = require('expo/metro-config');
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { withNativeWind } = require('nativewind/metro');

// Start with the default config from Expo
let config = getDefaultConfig(__dirname);

// Apply Sentry config wrapper
config = getSentryExpoConfig(__dirname, config);

// Apply NativeWind config wrapper
config = withNativeWind(config, { input: './global.css' });

// NOW, forcefully apply our resolver overrides AFTER the wrappers
// Disable unstable_enablePackageExports and set conditionNames to avoid ws/stream issue
// See: https://github.com/supabase/supabase-js/issues/1400 & https://github.com/supabase/supabase-js/issues/1258#issuecomment-2209917047
config.resolver = {
  ...(config.resolver || {}), // Keep existing resolver settings from wrappers
  unstable_enablePackageExports: false, // Ensure this is false
  unstable_conditionNames: ['browser', 'require'], // Ensure browser condition is preferred
};

module.exports = config;
