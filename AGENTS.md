# 🤖 Developer & Agent Documentation

This document provides technical context for LLMs, autonomous agents, and developers wishing to extend the Vivre Card Tracker.

## 🏗️ Architecture Overview

The application is a single-page React application that functions as a serverless P2P node.

### 1. P2P Layer (`PeerJS`)
- **Peer ID:** Generated on mount using a pirate-themed naming utility.
- **Connections:** Data-only WebRTC channels. No media streams are used.
- **State Management:** The `connRef` holds the active connection. Location data is emitted via `conn.send` whenever the local `watchPosition` updates.

### 2. Geolocation & Mathematics
- **Bearing Logic:** The `calculateBearing` function implements the formula:
  `θ = atan2(sinΔλ ⋅ cosφ2, cosφ1 ⋅ sinφ2 − sinφ1 ⋅ cosφ2 ⋅ cosΔλ)`
- **Distance:** Uses the Haversine formula for spherical distance.
- **Coordinate Updates:** Uses `navigator.geolocation.watchPosition` with `enableHighAccuracy: true`.

### 3. Visual System
- **Burning Animation:** Controlled via the `isBurning` state. It triggers:
  - CSS keyframes for paper charring.
  - A particle emitter (embers) inside the React render loop.
  - A 3.5s timeout before resetting to the lobby.
- **Procedural Textures:** Parchment and torn edges are generated via CSS `clip-path` and SVG filters to avoid high-latency image assets.

### 4. Audio Synthesis
- **Engine:** Web Audio API (`AudioContext`).
- **Connect:** A sawtooth oscillator with a frequency ramp.
- **Burn:** A white-noise buffer generated on-the-fly to simulate sizzling.
- **Track:** A high-frequency sine wave ping.

## 🛠️ Contribution Guidelines

- **Styling:** Use Tailwind utility classes. Maintain the `#f4e4bc` (parchment) and `#8b4513` (leather/wood) color palette.
- **Orientation:** (Planned) Integration with `DeviceOrientationEvent` to allow the card to point correctly relative to the phone's physical heading, not just North.
- **Safety:** Geolocation data is never stored on a server; it is shared only with the specific Peer ID the user chooses to connect with.

## 📡 PeerJS Server
By default, this uses the public PeerJS cloud server. For production scaling or higher privacy, a custom `peerjs-server` can be configured in the `new Peer()` constructor.
