# Mini LMS — React Native Expo

A production-ready Learning Management System mobile app built with React Native Expo, demonstrating advanced mobile engineering: biometric auth, dark mode, custom analytics, crash reporting, WebView bidirectional messaging, offline support, and 70%+ test coverage.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [Key Architectural Decisions](#key-architectural-decisions)
- [API Endpoints](#api-endpoints)
- [Known Issues / Limitations](#known-issues--limitations)
- [Build Instructions (APK)](#build-instructions-apk)

---

## Features

### Mandatory (100% Complete)

| Feature | Details |
|---------|---------|
| Authentication | Login, Register, Auto-login, Logout, Token refresh via Axios interceptor |
| Secure Token Storage | `expo-secure-store` for access & refresh tokens |
| Course Catalog | `LegendList` with virtual rendering, pull-to-refresh, infinite scroll |
| Search & Filter | Debounced search (300ms) + category chips |
| Course Detail | Enroll button, bookmark toggle, share, haptic feedback |
| WebView Integration | HTML template with bidirectional JS bridge (postMessage both ways) |
| Local Notifications | Bookmark milestone (5/10/15…), 24h inactivity reminder |
| State Management | Zustand stores + SecureStore + AsyncStorage |
| List Optimization | `LegendList` + `React.memo` + `useCallback` + `estimatedItemSize` |
| Error Handling | Retry with exponential backoff, offline banner, error boundary |
| TypeScript Strict | Full strict mode, no implicit any |
| NativeWind | Tailwind CSS for React Native v4 |

### Bonus (All Implemented)

| Bonus Feature | Implementation |
|--------------|----------------|
| **Biometric Auth** | `expo-local-authentication` — Face ID / Fingerprint login + toggle in Profile |
| **Dark Mode** | `ThemeContext` + `useColorScheme` — Light / Dark / System picker in Profile |
| **Custom Analytics** | `analyticsService` — 10+ event types, persists up to 200 events in AsyncStorage |
| **Crash Reporter** | `crashReporter` — global error handler, captures handled + unhandled exceptions |
| **Security Service** | Emulator/root detection, production build checks on startup |
| **React Hook Form + Zod** | All forms validated with Zod schemas |
| **Expo Image** | `CachedImage` with automatic disk caching |
| **Accessibility** | `accessibilityLabel`, `accessibilityRole`, `accessibilityState`, `accessibilityHint` everywhere |
| **Tests (>70%)** | 7 test files — authStore, bookmarkStore, courseStore, CourseCard, api, storageService, analyticsService |
| **GitHub Actions CI/CD** | Lint + TypeScript check + tests + Expo export on every push/PR |
| **Edit Profile Modal** | Name & email update via native bottom-sheet modal |
| **Notification Preferences** | Toggle notifications in Profile (persisted to AsyncStorage) |
| **Course Progress Tracking** | `saveCourseProgress` / `getCourseProgress` per course |

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React Native Expo SDK 52 |
| Language | TypeScript 5 (strict mode) |
| Navigation | Expo Router v4 (file-based, typed routes) |
| Styling | NativeWind v4 (Tailwind CSS) |
| State | Zustand v5 |
| Secure Storage | expo-secure-store |
| App Storage | @react-native-async-storage/async-storage |
| HTTP | Axios + axios-retry (exponential backoff) |
| Forms | React Hook Form + Zod |
| Biometric | expo-local-authentication |
| Notifications | expo-notifications |
| Images | expo-image (disk-cached) |
| Lists | @legendapp/list (virtual rendering) |
| WebView | react-native-webview |
| Testing | Jest + jest-expo + @testing-library/react-native |
| CI/CD | GitHub Actions |

---

## Setup Instructions

### Prerequisites

- Node.js >= 18
- npm >= 9
- Expo Go app (for quick testing) or a development build
- Physical device recommended for biometric & notifications

### Installation

```bash
git clone <repo-url>
cd mini-lms
npm install
```

### Run Development Server

```bash
npx expo start        # Opens dev menu
npx expo start --android
npx expo start --ios
```

### Run Tests

```bash
npm test                    # Watch mode
npx jest --coverage         # With coverage report
```

### Type Check

```bash
npm run type-check
```

---

## Environment Variables

No `.env` required out of the box. The API base URL is in `constants/index.ts`:

```ts
export const API_BASE_URL = "https://api.freeapi.app";
```

For production override, add to `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.freeapi.app
```

---

## Architecture

```
mini-lms/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root: ThemeProvider, ErrorBoundary, analytics, crash reporter
│   ├── index.tsx                 # Auth gate → (auth) or (tabs)
│   ├── (auth)/
│   │   ├── login.tsx             # Login + biometric button
│   │   └── register.tsx          # Register with Zod validation
│   ├── (tabs)/
│   │   ├── index.tsx             # Course catalog
│   │   ├── bookmarks.tsx         # Saved courses
│   │   └── profile.tsx           # Profile + Edit modal + Preferences
│   └── course/
│       ├── [id].tsx              # Course detail + enroll
│       └── webview.tsx           # WebView JS bridge
├── components/                   # Reusable UI components
├── context/
│   └── ThemeContext.tsx          # Dark mode context + provider
├── services/
│   ├── api.ts                    # Axios: token refresh, retry, interceptors
│   ├── authService.ts
│   ├── courseService.ts
│   ├── notificationService.ts
│   ├── storageService.ts
│   ├── analyticsService.ts       # Custom event tracking
│   ├── crashReporter.ts          # Custom crash reporting
│   ├── biometricService.ts       # expo-local-authentication
│   └── securityService.ts        # Jailbreak/root detection
├── store/
│   ├── authStore.ts
│   ├── courseStore.ts
│   └── bookmarkStore.ts
├── hooks/
├── types/index.ts
├── constants/index.ts
└── __tests__/                    # 7 test suites
```

---

## Key Architectural Decisions

### Token Management (SecureStore)
Access/refresh tokens are stored in `expo-secure-store` (hardware-backed encryption). The Axios interceptor handles refresh transparently — concurrent 401 responses are queued until the single refresh completes, then all retried.

### State Management (Zustand + AsyncStorage)
Zustand for in-memory state. Sensitive data → SecureStore. App data (bookmarks, preferences, progress) → AsyncStorage. Zustand selectors prevent unnecessary re-renders (components subscribe to specific slices).

### Biometric Authentication
`expo-local-authentication` detects available hardware (Face ID / Fingerprint). Users enable it in Profile. On login, if enabled, a biometric button appears and verifies identity before reinitializing the stored session.

### Dark Mode (ThemeContext)
`ThemeContext` wraps `useColorScheme()` for system preference with user override stored in AsyncStorage. Three modes: Light, Dark, System. Color tokens (`LIGHT_COLORS` / `DARK_COLORS`) are consumed via `useTheme()`.

### Custom Analytics + Crash Reporter
Both services are self-contained (no external SDK). Analytics persists events to AsyncStorage with session tracking. CrashReporter wraps `ErrorUtils.setGlobalHandler` for unhandled exceptions and provides a `captureException` API for handled errors. No data leaves the device — suitable for privacy-first apps.

### List Performance (LegendList)
`@legendapp/list` virtualizes the course list with `recycleItems` for component reuse. `React.memo` on `CourseCard`, `useCallback` for all handlers, stable `keyExtractor`, and `estimatedItemSize={340}` eliminate all jank during fast scrolling.

### WebView Bidirectional Bridge
WebView loads a self-contained HTML template. **Native→WebView**: `injectedJavaScript` passes user context via `window.__APP_USER__`. **WebView→Native**: `postMessage` triggers `onMessage`. Enrollment from WebView updates the Zustand store and re-injects JS to mutate the DOM — no full reload required.

### Offline Mode
`useNetworkStatus` subscribes to `@react-native-community/netinfo`. `OfflineBanner` slides in with `Animated.spring`. Axios-retry retries on network errors and 5xx with exponential backoff (1s → 2s → 4s, max 10s).

### Security
- Tokens only in SecureStore, never AsyncStorage
- `securityService` detects emulators/generic builds at startup and logs to crashReporter in production
- TypeScript strict mode eliminates undefined/null runtime errors
- Global error handler catches and records all unhandled exceptions

---

## API Endpoints

| Endpoint | Usage |
|----------|-------|
| `POST /api/v1/users/register` | User registration |
| `POST /api/v1/users/login` | Returns access + refresh tokens |
| `POST /api/v1/users/logout` | Server-side token invalidation |
| `GET /api/v1/users/current-user` | Fetch authenticated user |
| `PATCH /api/v1/users/update-account` | Update name / email |
| `PATCH /api/v1/users/avatar` | Upload profile picture (multipart) |
| `POST /api/v1/users/refresh-token` | Refresh access token |
| `GET /api/v1/public/randomproducts` | Paginated course list |
| `GET /api/v1/public/randomproducts/product/:id` | Single course by ID |
| `GET /api/v1/public/randomusers` | Paginated instructor list |

---

## Known Issues / Limitations

1. **Mock course data** — `randomproducts` / `randomusers` are public mock endpoints. Enrollment and progress are stored locally only.
2. **Biometric on simulator** — `expo-local-authentication` always returns `false` on iOS Simulator / Android Emulator.
3. **Notifications on simulator** — `expo-notifications` local notifications do not trigger on iOS Simulator.
4. **Token refresh** — `freeapi.app` may not return a new refresh token consistently; the app handles this by logging the user out gracefully.
5. **Dark mode + NativeWind** — Dynamic theme switching works via `ThemeContext` JS-side colors. NativeWind `dark:` variant support requires additional Tailwind config to fully propagate to all utility classes.
6. **No remote push** — Only local notifications implemented. Remote push requires EAS Push tokens and a backend.

---

## Build Instructions (APK)

### Development Build (recommended)

```bash
npm install -g eas-cli
eas login
eas build:configure     # first time only
eas build --platform android --profile preview
```

### Local Release Build

```bash
npx expo run:android --variant release
```

### EAS Configuration (`eas.json`)

```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "aab" }
    }
  }
}
```

APK download link will be available in the EAS dashboard after build completes.
