import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.savvybot.app",
  appName: "SavvyBot",
  webDir: "web/out",
  bundledWebRuntime: false,
  // Android configuration
  android: {
    path: "android",
    allowMixedContent: false,
    // Enable cleartext traffic for development (disable in production)
    androidScheme: "https",
    // Customize the Android app
    package: "com.savvybot.app",
    versionCode: 1,
    versionName: "1.0.0",
    // Enable push notifications
    pushNotifications: true,
    // Enable background processing
    backgroundProcessing: true,
  },
  // iOS configuration (not used but required)
  ios: {
    path: "ios",
    scheme: "savvybot",
    bundleIdentifier: "com.savvybot.app",
  },
  // Server configuration
  server: {
    androidScheme: "https",
    hostname: "localhost",
    port: 3000,
    // Allow navigation to external URLs
    allowNavigation: [
      "*.savvybot.com",
      "localhost:*",
      "127.0.0.1:*",
    ],
  },
  // Plugins configuration
  plugins: {
    // Push notifications
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    // Storage
    Preferences: {},
    // Network
    Network: {},
    // App update
    AppUpdate: {
      autoUpdate: true,
    },
  },
};

export default config;
