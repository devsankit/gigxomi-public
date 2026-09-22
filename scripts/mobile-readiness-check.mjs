import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".expo") continue;
      walk(filePath, acc);
    } else {
      acc.push(filePath);
    }
  }
  return acc;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function routePattern(file) {
  const rel = path
    .relative(path.join(root, "src", "app", "api"), file)
    .replace(/\\/g, "/")
    .replace(/\/route\.(ts|tsx|js|jsx)$/, "");
  return `/${rel
    .split("/")
    .map((part) => (part.startsWith("[") && part.endsWith("]") ? "[param]" : part))
    .join("/")}`;
}

function matchRoute(endpoint, route) {
  const endpointParts = endpoint.split("?")[0].split("/").filter(Boolean);
  const routeParts = route.split("/").filter(Boolean);
  if (endpointParts.length !== routeParts.length) return false;
  return routeParts.every((part, index) => part === "[param]" || part === endpointParts[index]);
}

function assert(condition, message, details = "") {
  if (!condition) {
    throw new Error(`${message}${details ? `\n${details}` : ""}`);
  }
}

function collectLiteralMobileApiEndpoints() {
  const mobileRoot = path.join(root, "mobile-app");
  const files = walk(mobileRoot).filter((file) => /\.(ts|tsx)$/.test(file));
  const endpoints = new Set();
  const requestPattern = /apiRequest(?:<[^>]+>)?\(\s*(['"`])([^'"`$]+)\1/g;

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    let match;
    while ((match = requestPattern.exec(text))) {
      endpoints.add(match[2].split("?")[0]);
    }
  }

  return [...endpoints].sort();
}

function checkMobileApiCoverage() {
  const apiRoot = path.join(root, "src", "app", "api");
  const routes = walk(apiRoot)
    .filter((file) => /route\.(ts|tsx|js|jsx)$/.test(file))
    .map(routePattern)
    .sort();
  const endpoints = collectLiteralMobileApiEndpoints();
  const missing = endpoints.filter((endpoint) => !routes.some((route) => matchRoute(endpoint, route)));

  assert(!missing.length, "Mobile app has literal API calls without matching backend routes.", missing.join("\n"));
}

function checkExpoProductionConfig() {
  const appJson = readJson(path.join(root, "mobile-app", "app.json"));
  const easJson = readJson(path.join(root, "mobile-app", "eas.json"));
  const expo = appJson.expo ?? {};
  const android = expo.android ?? {};
  const ios = expo.ios ?? {};

  assert(expo.scheme === "gigxomi", "Expo deep-link scheme must stay configured as gigxomi.");
  assert(android.package === "com.gigxomi.app", "Android package must match the Play Store package.");
  assert(ios.bundleIdentifier === "com.gigxomi.app", "iOS bundle identifier must match production config.");
  assert(android.googleServicesFile === "./google-services.json", "Android Firebase google-services.json must be configured.");
  assert(fs.existsSync(path.join(root, "mobile-app", "google-services.json")), "google-services.json is missing from mobile-app.");
  assert((android.permissions ?? []).includes("POST_NOTIFICATIONS"), "Android POST_NOTIFICATIONS permission is missing.");
  assert((android.permissions ?? []).includes("RECORD_AUDIO"), "Android RECORD_AUDIO permission is missing for voice notes.");
  const plugins = JSON.stringify(expo.plugins ?? []);
  assert(plugins.includes("expo-notifications") || plugins.includes("@react-native-firebase/messaging"), "A native push-notification plugin is missing.");
  assert(easJson.build?.production?.android?.buildType === "app-bundle", "Production Android EAS build must create an app bundle.");
  assert(Boolean(easJson.build?.production?.env?.EXPO_PUBLIC_API_URL), "Production EAS API URL is missing.");
}

function checkMobileGuardrails() {
  const packageJson = readJson(path.join(root, "mobile-app", "package.json"));
  const dependencies = packageJson.dependencies ?? {};
  for (const dependency of ["expo-constants", "expo-device", "expo-linking", "react-native-webview"]) {
    assert(Boolean(dependencies[dependency]), `${dependency} is required for production mobile offline/push behavior.`);
  }
  assert(Boolean(dependencies["expo-notifications"] || dependencies["@react-native-firebase/messaging"]), "A production push runtime is required.");

  assert(packageJson.scripts?.typecheck === "tsc --noEmit", "Mobile package must expose the CI typecheck script.");

  const push = fs.readFileSync(path.join(root, "src", "lib", "mobile-chat-push.ts"), "utf8");
  const legacyAppPath = path.join(root, "mobile-app", "App.tsx");
  if (fs.existsSync(legacyAppPath)) {
    const app = fs.readFileSync(legacyAppPath, "utf8");
    assert(app.includes("react-native-webview"), "Legacy mobile app must render the production web app in WebView.");
    assert(app.includes("ALLOWED_HOSTS"), "Legacy mobile app must enforce the WebView allowed-host guard.");
  } else {
    const layout = fs.readFileSync(path.join(root, "mobile-app", "app", "_layout.tsx"), "utf8");
    const provider = fs.readFileSync(path.join(root, "mobile-app", "src", "components", "PushNotificationProvider.tsx"), "utf8");
    const nativePush = fs.readFileSync(path.join(root, "mobile-app", "src", "lib", "pushNotifications.ts"), "utf8");
    const backgroundPush = fs.readFileSync(path.join(root, "mobile-app", "src", "lib", "pushBackgroundHandlers.ts"), "utf8");
    assert(layout.includes("PushNotificationProvider"), "Expo Router root must mount the push notification provider.");
    assert(nativePush.includes("messaging().getToken()"), "Native app must register its Firebase device token.");
    assert(provider.includes("onNotificationOpenedApp"), "Native app must handle notification deep links.");
    assert(backgroundPush.includes("setBackgroundMessageHandler"), "Native app must register its background push handler.");
  }
  assert(push.includes("New message - reply or open Gigxomi to view."), "Push notification body must use safe preview text.");
  assert(!push.includes("body: input.messageBody"), "Push notifications must not expose full chat message bodies.");
}

checkMobileApiCoverage();
checkExpoProductionConfig();
checkMobileGuardrails();
console.log("Mobile production readiness checks passed.");
