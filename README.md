# WasuliBhai

A mobile subscription tracker built with Expo (SDK 57), React Native and TypeScript.
All data stays on your phone: no account, no server, no tracking.

## Download

### Android

**[⬇ Download WasuliBhai.apk](https://github.com/JatinBhargava/WasuliBhai/releases/latest/download/WasuliBhai.apk)** (latest version, ~96 MB)

1. Open the link on your Android phone and download the APK.
2. Tap the downloaded file. If asked, allow **Install unknown apps** for your browser.
3. If Play Protect warns that the app is unknown, tap **Install anyway**. It warns about any app installed outside the Play Store.

To update, install the newer APK over the old one; your subscriptions are kept.
All versions: [Releases](https://github.com/JatinBhargava/WasuliBhai/releases).

### iPhone

Not available yet. iPhones can't install apps from a file; an App Store or TestFlight release is planned.

## Features

- Add, edit, pause and delete subscriptions (weekly / monthly / quarterly / yearly)
- Quick-add presets for common services (Netflix, Spotify, YouTube Premium…)
- Find subscriptions: open the App Store / Google Play subscriptions page, or paste a bank SMS
  (UPI AutoPay, e-mandate, card debit) or receipt email to pre-fill the add form for review
- Dashboard with monthly and yearly totals, renewals due this week, filter by category, sort by due date / price / name
- Next renewal is computed from the first billing date (handles month-end and leap years)
- Local renewal reminders at 9:00 AM, same day or 1, 3 or 7 days before
- Insights: per-day/month/year spend, charges due in the next 30 days, spend by category, most expensive subscriptions
- Settings: display currency, reminders toggle, JSON export, delete all

## Develop

```bash
npm install
cp .env.example .env  # optional: the app needs no variables today
npx expo start        # scan the QR code with Expo Go, or press i / a for a simulator
```

In Expo Go on Android, renewal reminders are disabled (Expo Go no longer supports notifications there).
Use the APK or a development build to test them.

### Checks

```bash
npm run typecheck
npm run lint
npm test
```

### Secrets

The app has no API keys or other secrets. Put any future ones in `.env`, which git ignores; only
`.env.example` is committed. Anything named `EXPO_PUBLIC_*` is bundled into the app and visible to
anyone who downloads it, so never put secrets there. The Android signing key is stored by Expo (EAS), not in this repo.

## Build and release

Android APK (shareable file):

```bash
eas build --profile preview --platform android
```

Then attach the APK to a new GitHub Release as `WasuliBhai.apk` so the download link above
picks it up. Store releases (Google Play, App Store) are covered in [DEPLOYMENT.md](DEPLOYMENT.md).

## Structure

```
src/
  app/          Expo Router screens (index, add, import, subscription/[id], insights, settings)
  components/   UI pieces (SubscriptionForm, SubscriptionCard, Chip, …)
  context/      SubscriptionsContext: state, persistence, reminder sync
  lib/          dates (renewal math), money, parseMessage (SMS/email parser), storage, reminders
  constants/    theme, option lists, known services catalogue
  types/        Subscription and Settings types
```

## Privacy and license

- [Privacy policy](PRIVACY.md)
- [MIT License](LICENSE) © 2026 Jatin Bhargava
