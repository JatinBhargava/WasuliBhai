# Deploying WasuliBhai

Builds run in the cloud with **EAS** (Expo Application Services), so you don't need Xcode or Android Studio.

## 0. Before every release

```bash
npm run typecheck && npm run lint && npm test
npx expo-doctor
```

Bump `"version"` in `app.json` (e.g. `1.0.0` → `1.1.0`) for each store release. Build numbers
(`versionCode` / `buildNumber`) are stored on EAS and increase automatically (`eas.json` → `autoIncrement`).

## 1. Accounts

| Account | Cost | Needed for |
|---|---|---|
| [Expo](https://expo.dev/signup) | Free tier | EAS Build / Submit / Update |
| [Google Play Console](https://play.google.com/console/signup) | US$25 one-time | Android |
| [Apple Developer Program](https://developer.apple.com/programs/) | US$99 / year | iOS |

## 2. Confirm the app identifiers

`app.json` sets `ios.bundleIdentifier` and `android.package` to **`com.wasulibhai.app`**.
Change them now if you want something else. **After the first store upload they can never be changed.**

## 3. Link the project to EAS (once)

```bash
npm install --global eas-cli
eas login
eas init          # creates the EAS project and adds its projectId to app.json
```

## 4. Builds for testing

```bash
# Development build: like Expo Go, but with your native modules, so Android reminders work.
eas build --profile development --platform android
npx expo start    # then open the installed dev build instead of Expo Go

# Preview: an installable APK you can send to friends to test.
eas build --profile preview --platform android
```

## 5. Android → Google Play

1. In Play Console: **Create app** (name WasuliBhai, category Finance, free).
2. Build: `eas build --profile production --platform android` (produces an `.aab`).
3. Upload: `eas submit --platform android --latest`. This needs a Google service-account key; follow
   <https://expo.fyi/creating-google-service-account>. If the API upload fails for the very first release,
   upload that `.aab` by hand in Play Console once; after that, `eas submit` works.
   `eas.json` sends builds to the **internal** track as a **draft**.
4. Fill in the store listing:
   - Short and full description, 512×512 icon (`assets/icon.png`, resized), 1024×500 feature graphic, phone screenshots
   - **Privacy policy URL**: host `PRIVACY.md` publicly (e.g. GitHub Pages) after adding your contact email
   - **Data safety**: no data collected or shared
   - Content rating questionnaire, target audience (18+ is simplest for a finance app), ads: none
5. **New personal developer accounts** must run a **closed test with at least 12 testers for 14 days**
   before Google allows a production release. Start this early.

## 6. iOS → App Store

1. Build: `eas build --profile production --platform ios`. EAS asks for your Apple login and
   creates the certificates and provisioning profiles for you.
2. Upload: `eas submit --platform ios --latest`. The build appears in **TestFlight** after about 10–15 minutes;
   test it on your iPhone.
3. In App Store Connect, complete:
   - Screenshots for the 6.9" iPhone size (iPad is turned off: `supportsTablet: false`)
   - Description, keywords, support URL, **privacy policy URL**
   - App Privacy: **Data Not Collected**
   - Export compliance is already answered (`usesNonExemptEncryption: false`)
4. Submit for review. Review usually takes 1–3 days.

Shortcut once both stores are set up: `eas build --profile production --platform all --auto-submit`.

## 7. Over-the-air updates (optional, recommended)

Ship JavaScript-only fixes without a store review:

```bash
npx expo install expo-updates
eas update:configure
# add "channel": "production" to build.production in eas.json (and "preview" to build.preview), then rebuild once
eas update --channel production --message "Fix renewal date on month end"
```

Anything that changes native code (new native library, permissions, app.json plugins) still needs a new store build.

## Known limitations

- **No cloud sync.** Data lives on the device; phone backups (iCloud / Google) may include it, and
  Settings → Export gives a JSON copy. There is no "import backup" yet.
- **No crash reporting.** Consider [Sentry](https://docs.expo.dev/guides/using-sentry/) before a wide launch.
- **Light mode only**, iPhone and Android phones only (no iPad layout).
