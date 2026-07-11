---
name: deploy-expo
description: Build and deploy the Zesty mobile app (mobile-clients/recipe-manager-mobile-react-native) with EAS — preflight checks, version/build-number bump across app.json and the native Info.plist, eas build for the right profile, and App Store submission. Use when the user asks to deploy, release, ship, or build the mobile/Expo/iOS app, or to bump its version.
---

# Deploy Zesty Mobile with EAS

All commands run in `mobile-clients/recipe-manager-mobile-react-native/` (repo-relative). This is a **bare-ish workflow**: `ios/` is committed, so the native `Info.plist` — not just `app.json` — determines the shipped version.

## 1. Parse the request

Determine the profile from the user's ask (ask via AskUserQuestion only if genuinely ambiguous):

| Ask                                   | Profile                 | Version bump?            |
| ------------------------------------- | ----------------------- | ------------------------ |
| "dev build for my phone"              | `development`           | no                       |
| "simulator build"                     | `development-simulator` | no                       |
| "beta / preview / internal build"     | `preview`               | build number only        |
| "release / deploy / ship / App Store" | `production`            | yes (version + build)    |

For production, default to a **patch** bump of the marketing version unless the user says minor/major or names an explicit version.

## 2. Preflight

```bash
cd mobile-clients/recipe-manager-mobile-react-native
git status --porcelain .        # warn (don't block) on uncommitted changes; never deploy with failing checks
npm run typecheck
npm run lint
npm test -- --watchAll=false
eas whoami                      # must be logged in; if not, ask the user to run: eas login
```

Known pre-existing failures to ignore: `components/__tests__/ThemedText-test.tsx` module-resolution error, lint errors in `log-in.tsx`, `+not-found.tsx`, `loaders*.tsx`, `read-more.tsx`. Anything else new is a blocker.

## 3. Bump version + build number (production; build number only for preview)

Version lives in **five places that must stay in sync**. Current values: read `expo.version` and `expo.ios.buildNumber` from `app.json`.

**Production**: bump ONLY the marketing version — the `production` profile has `autoIncrement: true`, so `eas build` bumps `ios.buildNumber` itself at upload time and syncs `ios/Zesty/Info.plist`'s `CFBundleVersion` locally (bumping it yourself produces a double increment). After the build starts, sync `app.json` → `expo.ios.infoPlist.CFBundleVersion` to the value EAS chose (it does not touch that nested key) and commit everything together.

**Preview**: no autoIncrement — bump the build number manually in all the places below.

Compute `NEW_VERSION` (semver bump of `expo.version`) and, for preview only, `NEW_BUILD` (current `ios.buildNumber` + 1), then update:

1. `app.json` → `expo.version` = NEW_VERSION
2. `app.json` → `expo.ios.buildNumber` = "NEW_BUILD"
3. `app.json` → `expo.ios.infoPlist.CFBundleShortVersionString` = NEW_VERSION
   (note: `expo.ios.infoPlist.CFBundleVersion` has been stale at "1" historically — set it to "NEW_BUILD" too so it stops drifting)
4. `ios/Zesty/Info.plist` → `CFBundleShortVersionString` = NEW_VERSION
5. `ios/Zesty/Info.plist` → `CFBundleVersion` = NEW_BUILD

Use Edit for `app.json` and PlistBuddy for the plist:

```bash
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $NEW_VERSION" ios/Zesty/Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_BUILD" ios/Zesty/Info.plist
```

Verify all five with:

```bash
grep -n '"version"\|"buildNumber"\|CFBundle' app.json | head
/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" -c "Print :CFBundleVersion" ios/Zesty/Info.plist
```

Because the bump is explicit here, do NOT rely on the production profile's `autoIncrement` to diverge things — it may bump on the EAS worker only; the committed files above are the source of truth.

Commit the bump (only the version files) before building:

```bash
git add app.json ios/Zesty/Info.plist
git commit -m "Bump Zesty mobile to v$NEW_VERSION ($NEW_BUILD)"
```

## 4. Build

```bash
# development (physical device dev client)
eas build --profile development --platform ios

# simulator dev client
eas build --profile development-simulator --platform ios

# internal beta
eas build --profile preview --platform ios

# App Store
eas build --profile production --platform ios
```

EAS builds are remote and take ~10–25 min. Run in the background and poll with `eas build:list --limit 1 --non-interactive` (statuses: new/in-queue/in-progress → finished/errored). On error, fetch logs via the build page URL printed by the CLI.

Cloud builds do **not** include `.env` (gitignored) — `EXPO_PUBLIC_GOOGLE_*` values must exist as EAS env vars (`eas env:list --environment production`). If missing, stop and tell the user which `eas env:create` commands to run.

## 5. Submit (production only)

```bash
eas submit --platform ios --latest
```

Or combine: `eas build --profile production --platform ios --auto-submit`. The build lands in TestFlight; promotion to the App Store happens manually in App Store Connect — remind the user.

## 6. Report

Tell the user: profile built, new version/build number, build status + URL, and (for production) that it's in TestFlight pending processing. If the version bump was committed, mention the commit — do not push unless asked.
