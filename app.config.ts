import packageJson from './package.json';

const IS_DEV = process.env.APP_VARIANT === 'development';
const projectId = 'bdd1d0df-2036-4c29-b421-d9661c1d749c'

module.exports = {
  expo: {
    name: "Hydra",
    slug: "hydra",
    version: packageJson.version,
    newArchEnabled: true,
    runtimeVersion: {
      policy: 'appVersion',
    },
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "hydra",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV ? 'com.zacharylm.hydra-dev' : "com.zacharylm.hydra"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#000000"
      }
    },
    web: {
      bundler: "metro",
      favicon: "./assets/images/favicon.png"
    },
    extra: {
      eas: {
        projectId,
      }
    },
    owner: "malenurse",
    plugins: [
      "expo-router",
      [
        'expo-media-library', {
          savePhotosPermission: 'Allow $(PRODUCT_NAME) to save photos and videos to your library.',
        }
      ]
    ],
    updates: {
      url: `https://u.expo.dev/${projectId}`
    }
  }
}
