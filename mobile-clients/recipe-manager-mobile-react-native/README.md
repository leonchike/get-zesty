# Zesty Mobile (iOS)

The Expo/React Native client for [Get Zesty](https://www.getzesty.food) — recipes, groceries, and home tasks.

- **Stack**: Expo SDK 55 · React Native 0.83 · expo-router · NativeWind 4 · React Query 5 · Zustand 5
- **Workflow**: custom **dev client** (native `ios/` project is committed — this app uses native modules and does **not** run in Expo Go)
- **EAS project**: `@leonchike/recipe-manager-mobile` (`projectId 5ebaeaf4-59a8-4c6d-bf82-5d1e60cf6e38`)
- **Bundle ID**: `com.leonchike.recipe-manager-mobile`

---

## Local development

```bash
npm install
npm run ios          # builds ios/Zesty.xcworkspace and launches the simulator
```

The backend URL comes from `.env` in **dev builds only** (production builds always use `https://www.getzesty.food`):

```bash
# .env
EXPO_PUBLIC_BACKEND_URL="http://<your-mac-LAN-ip>:3000"   # ipconfig getifaddr en0
```

Run the backend from `../../recipe-management-app` with `npm run dev` (or `npx next dev -H 0.0.0.0` for physical devices). After changing `.env`, restart Metro with a cache clear: `npx expo start --dev-client -c`.

Quality gates: `npm run typecheck`, `npm run lint`, `npm test`.

---

## Deploying with EAS

### One-time setup

```bash
npm install -g eas-cli        # eas.json requires >= 13.4.2
eas login                     # Expo account with access to the leonchike org
eas whoami                    # sanity check
```

iOS builds also need your Apple Developer account the first time — EAS will prompt to sign in and will create/manage certificates and provisioning profiles for you.

**Environment variables**: `.env` is gitignored, so it is **not** uploaded with cloud builds. Any `EXPO_PUBLIC_*` value the app needs at build time must exist as an EAS environment variable:

```bash
eas env:create --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "<id>" --environment production
eas env:create --name EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID --value "<id>" --environment production
# repeat for preview/development environments as needed
eas env:list --environment production
```

(`EXPO_PUBLIC_BACKEND_URL` is only read in dev builds; production builds hardcode the prod URL in `lib/backend-api.ts`.)

### Build profiles (`eas.json`)

| Profile                 | What it produces                                    | Use for                                  |
| ----------------------- | --------------------------------------------------- | ---------------------------------------- |
| `development`           | Dev client `.ipa`, internal distribution            | Debugging on a physical iPhone           |
| `development-simulator` | Dev client build for the iOS **simulator**          | Sharing a simulator build, CI            |
| `preview`               | Release build, internal (ad-hoc) distribution       | Beta testing without the App Store       |
| `production`            | Store build, auto-increments the iOS build number   | App Store / TestFlight releases          |

### Development build (physical device, no cable)

```bash
eas build --profile development --platform ios
```

- First run: register your device when prompted (`eas device:create` sends a link that installs a provisioning profile).
- Install the build from the QR/link EAS prints, then start the dev server: `npx expo start --dev-client`.
- Phone and Mac must be on the same Wi-Fi; set `EXPO_PUBLIC_BACKEND_URL` in `.env` to your Mac's LAN IP to hit a local backend.

### Simulator build

```bash
eas build --profile development-simulator --platform ios
```

Download the `.tar.gz`, then drag the `.app` onto a booted simulator (or `xcrun simctl install booted Zesty.app`).

### Preview (beta) build

```bash
eas build --profile preview --platform ios
```

Release-mode binary distributed internally — installable on registered devices via the EAS link, no App Store review. Talks to production (`https://www.getzesty.food`).

### Production release (App Store)

1. **Bump the app version** in `app.json` (`expo.version`, currently `1.2.0`). Versioning is local (`appVersionSource: "local"`), and the `production` profile auto-increments `ios.buildNumber` for you — you only manage the marketing version.
2. **Build**:
   ```bash
   eas build --profile production --platform ios
   ```
3. **Submit to App Store Connect** (uses the `submit.production` profile):
   ```bash
   eas submit --platform ios --latest
   ```
   First run will walk you through App Store Connect credentials (an App Store Connect API key is the smoothest option — EAS can generate one).
4. The build lands in **TestFlight** automatically; promote it to the App Store from App Store Connect after processing.

Shortcut for build + submit in one go:

```bash
eas build --profile production --platform ios --auto-submit
```

### Monitoring builds

```bash
eas build:list --limit 5      # recent builds + status
eas build:view                # details/logs for the latest build
```

Builds are also visible at https://expo.dev/accounts/leonchike/projects/recipe-manager-mobile/builds.

---

## Gotchas

- **Native changes**: `ios/` is committed. If you add a native module or change `app.json` native config, re-run `npx expo prebuild` (or edit the Xcode project) and commit the result — EAS builds from what's in the repo.
- **CI**: `.github/workflows/ci.yml` runs typecheck, lint, tests, and `expo prebuild --no-install` on PRs to `main`/`develop`.
- **No OTA updates**: `expo-updates` is not configured — every JS change ships via a new build/submit.
- **Expo Go won't work**: native modules (Google Sign-In, shake detection) require the dev client.
