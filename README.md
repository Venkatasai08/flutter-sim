# flutter-sim 📱✨

> Push a **Flutter** app to GitHub, build it on a GitHub-hosted Apple Silicon macOS runner, and stream the live, interactive **iOS Simulator** directly to your browser on Windows, Linux, or macOS.

```bash
cd my_flutter_app
flutter-sim up
```

```
› Preparing Flutter repository
✓ Committed changes on main
✓ Pushed to your-username/my_flutter_app
› Dispatching GitHub Actions build (session: a1b2c3d4)
✓ Dispatched workflow run
✓ Simulator stream is live!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📱 iOS Simulator Live Stream
  🔗 https://calm-river-1234.trycloudflare.com/?k=9f8e7d6c...
  ⏱️  Session active for 30 minutes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 💡 What it does

1. **Detects and configures your Flutter project**: Reads `pubspec.yaml` and sets up the GitHub Actions streaming workflow and secure reverse proxy.
2. **Dispatches a macOS runner on GitHub Actions**: Automatically spins up an Apple Silicon runner (`macos-15`).
3. **Compiles & Boots**: Compiles your app with `flutter build ios --simulator --no-codesign`, boots the simulator, and installs the resulting `Runner.app`.
4. **Streams Live Screen & Touch**: Uses `@expo/serve-sim` (via GPU `IOSurface` frame buffer capture) and pipes touch gestures/clicks back to Apple's `SimulatorKit` over WebSockets.
5. **Opens Tunnel & Browser**: Establishes an outbound Cloudflare Quick Tunnel (`cloudflared`) fronted by a token-authenticated reverse proxy (`gate.cjs`), and opens the simulator right on your Windows desktop!

---

## 📦 Installation & Setup

You can install `flutter-sim` directly from this GitHub repository:

### Option 1: One-Line Global Install (Recommended)
```bash
npm install -g https://github.com/Venkatasai08/flutter-sim.git
```

### Option 2: Clone & Link Locally
```bash
# Clone the repository
git clone https://github.com/Venkatasai08/flutter-sim.git
cd flutter-sim

# Install and link globally
npm install
npm link
```

### Option 3: Run via `npx` (Zero Installation)
```bash
npx https://github.com/Venkatasai08/flutter-sim up
```

---

## ⚡ Prerequisites

1. **Node.js** (v18+)
2. **Git**
3. **GitHub CLI (`gh`)**:
   ```bash
   # On Windows
   winget install GitHub.cli
   
   # Log in (one-time)
   gh auth login
   ```

---

## 🛠️ Commands

| Command | Description |
|---|---|
| `flutter-sim up` | Push, build Flutter app on macOS runner, and stream simulator *(default)* |
| `flutter-sim init` | Add `.github/workflows/flutter-sim.yml` and auth gate to project |
| `flutter-sim doctor` | Check environment and prerequisites |
| `flutter-sim status` | Inspect current session and stream URL |
| `flutter-sim down` | Cancel the active runner and stop the stream |
| `flutter-sim upload` | Upload a prebuilt `.app` or archive to draft release |

---

## ⚙️ Options (`flutter-sim up`)

| Flag | Default | Description |
|---|---|---|
| `--minutes <n>` | `30` | Stream duration in minutes (max 350) |
| `--device <name>` | `iPhone 16 Pro` | Simulator device name |
| `--flutter-version <v>` | `latest` | Flutter SDK version (e.g. `3.24.3`) |
| `--flutter-channel <c>` | `stable` | Flutter release channel (`stable`, `beta`, `master`) |
| `--mode <m>` | `build` | `build` (from source) or `app` (prebuilt archive) |
| `--app <url>` | `""` | URL to a prebuilt simulator `.app.tar.gz` |
| `--app-file <path>` | `""` | Upload local `.app` / `.tar.gz` and run it |
| `--public` | `true` | Create public repo (**unlimited free GitHub Actions minutes**) |
| `--fps <n>` | `30` | Stream framerate (FPS) |
| `--quality <n>` | `0.7` | MJPEG image quality (0.05 - 1.0) |
| `--no-open` | `false` | Do not automatically launch browser |

---

## 🏗️ Architecture

```
YOUR BROWSER                      CLOUDFLARE EDGE
     │                                  │
     │─── Open Stream URL ─────────────▶│
     │                                  │  (Runner connects OUTWARD
     │◀── Live Video Frames (MJPEG) ────│── and keeps tunnel open)
     │─── Touch / Input (WebSocket) ───▶│
                                        ▼
          ┌──────────────────────────────────────────────┐
          │  GitHub Actions macOS Runner (Apple Silicon) │
          │                                              │
          │   cloudflared (Outbound Quick Tunnel)        │
          │       ▼                                      │
          │   :3199  gate.cjs (Auth Gate & Proxy)        │
          │       ▼                                      │
          │   :3200  serve-sim (Preview & Touch Relay)   │
          │       ▼                                      │
          │   IOSurface GPU Capture                      │
          │       ▼                                      │
          │   iOS Simulator (Running Flutter Runner.app) │
          └──────────────────────────────────────────────┘
```

---

## 🤝 Credits & Acknowledgements

* Inspired by [bidah/native-sim](https://github.com/bidah/native-sim) for pioneer work bringing remote iOS simulator streaming to React Native. `flutter-sim` adapts and builds upon this concept specifically for the Flutter ecosystem.
* Powered by Apple Silicon macOS GitHub Actions runners, `@expo/serve-sim`, and Cloudflare Quick Tunnels.

---

## 📄 License

MIT License © 2026
