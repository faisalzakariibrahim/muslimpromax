# MuslimProMax 🏮

Pray on time. Scroll less. Keep your light.

An Islamic prayer-accountability app that blocks distracting apps during salah,
verifies prayer with on-device + Claude AI, and adds the one thing the whole
"Salah app-lock" category is missing: **a social Prayer Circle.**

Built to beat Prayer Pause and the clone swarm (Aqimo, Khushu, DeenLock, Salah
Lock, Pray Unlock, …) on the axes they can't easily copy: **social
accountability, stronger AI verification, and design.**

---

## Why this architecture

The paid moat in every one of these apps is the same single thing — Apple's
**Screen Time / Family Controls API**. It can only run from native iOS
**app-extension targets**, which Expo's *managed* workflow cannot compile. So
MuslimProMax is a **bare/prebuild Expo app** with:

- A local Swift native module (`modules/screen-time`) that bridges Family
  Controls to React Native.
- Three extension targets, generated reproducibly at prebuild by
  `@bacons/apple-targets` (`targets/`):
  - **SalahMonitor** — `DeviceActivityMonitor`: shields apps when a prayer
    window opens, clears them when it closes.
  - **SalahShieldConfig** — `ShieldConfiguration`: the branded "it's time to
    pray" screen.
  - **SalahShieldAction** — `ShieldAction`: Honor-mode unlock + records
    resist/bypass counters.
- A shared **App Group** (`group.com.flicktek.muslimpromax`) so the app and all
  three extensions read/write the same block state and counters.

The user's chosen apps are **opaque tokens** we never decode — that's an API
constraint, which is why "your choices stay private, even from us" is literally
true.

```
app/                     Expo Router screens (Today · Focus · Circle · More · auth)
src/
  lib/                   supabase, prayerTimes (adhan), theme
  features/
    blocking/            Salah Focus orchestrator (arms native scheduler daily)
    companion/           Noor — the lantern + Noor Score logic
    prayer/              prayer log + streak (with grace) + Period Pause
    circle/              Prayer Circle API (create/join/feed/leaderboard/realtime)
    verify/              Proof Mode client → Claude edge function
    auth/                session + email OTP
modules/screen-time/     local Swift native module (the bridge)
targets/                 3 iOS extension targets (the moat)
plugins/withScreenTime   entitlements + app group at prebuild
supabase/
  migrations/0001_init   profiles, prayers, circles, RLS
  functions/verify-prayer Claude Haiku vision verification (server-side key)
```

---

## MuslimProMax vs Prayer Pause

| Capability | Prayer Pause | MuslimProMax | Status |
|---|:--:|:--:|---|
| Block apps during salah (Screen Time API) | ✅ | ✅ | **built** (`targets/`, `modules/screen-time`) |
| Honor-mode unlock | ✅ | ✅ | **built** (shield action) |
| Proof Mode (camera) | ✅ basic classifier | ✅ **Claude Haiku vision** | **built** (edge fn) — stronger |
| Focus Sessions / Brick Mode | ✅ | ✅ | **built** (`blockNow`) |
| Prayer times (14 methods) | ✅ | ✅ | **built** (adhan) |
| Streaks with grace | ✅ | ✅ | **built** (`recomputeStreak`) |
| Period Pause | ✅ | ✅ | **built** |
| Companion gamification | 🐪 Sabr | 🏮 **Noor** (distinct) | **built** (`noor.ts`) |
| Focus score | Sabr Score | **Noor Score** | **built** |
| **Social Prayer Circle** | ❌ | ✅ | **built** — our wedge |
| Qibla compass | ✅ | ⏳ | lib ready (`qiblaDirection`) |
| Prayer-time notifications (+ reminders) | ✅ | ✅ | **built** — time-sensitive, with "I prayed" / "Verify now" actions |
| Qur'an reader (Arabic + EN + translit) | ✅ | ✅ | **built** — 114 surahs, fully offline (Tanzil data) |
| Dua & Adhkar | ✅ | ✅ | **built** — 134 categories, offline (Hisnul Muslim) |
| Tasbih counter | ✅ | ✅ | **built** — dhikr presets, haptics, lifetime totals |
| Hadith | ✅ | ◐ | scaffold only — awaiting a vetted, graded dataset (no fabricated text) |
| Islamic presets (Jummah/Tahajjud/Taraweeh/Last 10) | ✅ | ⏳ | roadmap |
| Widgets + Live Activities | ✅ | ⏳ | roadmap (WidgetKit/ActivityKit targets) |
| Full-screen prayer alarm | ✅ | ◐ | partial — time-sensitive notifications; persistent alarm is a follow-up |
| Travel Mode (Qasr) | ✅ | ⏳ | roadmap |
| Mac / Watch | ✅ | ⏳ | roadmap |
| App Store Challenges (in-app events) | ✅ | ⏳ | marketing |

**Already ahead:** Prayer Circle (nobody has it), Claude-powered Proof Mode.
**Parity:** blocking, streaks, Period Pause, companion, prayer times.
**Gap to close:** the devotional content hub + widgets (all local data, fast to add).

---

## Run it

> Requires a Mac with Xcode, a **real iPhone** (Screen Time doesn't work on the
> Simulator), and an Apple Developer account. Family Controls works in dev on a
> device without special approval; **App Store distribution needs Apple to grant
> the Family Controls (Distribution) entitlement** — request it early:
> https://developer.apple.com/contact/request/family-controls-distribution

```bash
# 1. deps
npm install

# 2. env
cp .env.example .env    # fill EXPO_PUBLIC_SUPABASE_URL + ANON_KEY

# 3. Supabase
supabase db push                              # applies migrations/0001_init.sql
supabase functions deploy verify-prayer
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# 4. generate native projects (runs the config plugin + builds the targets)
npx expo prebuild --clean

# 5. run on a connected iPhone
npx expo run:ios --device
```

### Onboarding & security
Flow: **Sign in with Apple** (or email one-time code) → confirm name + mark →
in-context permission priming (Screen Time, Notifications, Location — each
explained *before* the system prompt) → in. State is gated by `profiles.onboarded`.

- **Session tokens live in the Keychain/Keystore** (`src/lib/secureStorage.ts`),
  not plaintext AsyncStorage. Chunked to beat SecureStore's ~2KB limit.
- **Apple sign-in is nonce-bound** (SHA-256 to Apple, raw to Supabase) so a
  stolen identity token can't be replayed.
- **Passwordless** — nothing to breach; no password store.
- All user data is behind Postgres **Row Level Security** (migration `0001`).

Enable Apple sign-in once, on your side:
1. Apple Developer → your App ID → enable **Sign in with Apple** capability.
2. Supabase → Authentication → Providers → **Apple** → add your Services ID /
   bundle `com.flicktek.muslimpromax`.
3. `expo prebuild` adds the entitlement automatically (`usesAppleSignIn`).

### Secrets — the one rule
`ANTHROPIC_API_KEY` lives **only** in Supabase Edge Function secrets. It is never
in the app, `.env`, or git. The device calls `verify-prayer`; the function calls
Claude. Ship the key in the binary and it's scraped within hours.

---

## Next milestones (priority order)
1. **Proof Mode camera screen** — capture → downscale (`expo-image-manipulator`)
   → `verifyPrayerImage()`. Edge function is already live.
2. **Qur'an/Hadith/Dua/Tasbih hub** — bundle JSON, build the readers (the free
   funnel that pulls installs).
3. **Widgets + Live Activities** — new `targets/` entries (WidgetKit/ActivityKit).
4. **Islamic presets + Ramadan Mode** — preset schedules feeding `startSalahFocus`.
5. **Paywall** — RevenueCat; gate blocking, keep devotional content free.
6. **Android blocking** — `UsageStatsManager` + AccessibilityService in the
   module's Kotlin side.
