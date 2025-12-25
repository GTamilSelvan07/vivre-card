# 🧭 Vivre Card Tracker

An interactive, real-time location tracker inspired by the "Vivre Cards" from One Piece. 

Unlike a standard "Find My" app, this web application uses P2P (Peer-to-Peer) technology to connect two devices directly. The "Life Paper" on your screen physically rotates and points in the real-world direction of your friend, just like the lore.

## ✨ Features

- **P2P Direct Connection:** Uses PeerJS for browser-to-browser communication without a central database.
- **Compass Tracking:** Real-time bearing calculation using GPS coordinates.
- **One Piece Aesthetic:** Procedural parchment textures, torn edges, and pirate-themed ID generation.
- **Dynamic Burning Effect:** If a friend disconnects (their "life force" fades), the card realistically burns away to ash with synchronized sound effects.
- **Procedural Sound:** Web Audio API synthesized sounds for connection, tracking, and burning.

## 🚀 Getting Started

### Local Development

1. **Clone the repo:**
   ```bash
   git clone https://github.com/GTamilSelvan07/vivre-card.git
   cd vivre-card
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Testing:**
   - Open the app in two different tabs or devices.
   - Copy the ID from one and paste it into the "Target Card ID" of the other.
   - Hit **CONNECT LIVES**.

## 🛠️ Tech Stack

- **Framework:** React + Vite (TypeScript)
- **Networking:** PeerJS (WebRTC)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Styling:** Tailwind CSS

## 📜 Lore (How it works)

A Vivre Card is made from the clippings of a person's fingernails and hair. This app approximates that by exchanging a unique **Life Paper ID**. Once connected, the application calculates the Great Circle bearing between two GPS points and applies that rotation to the card UI.

---
*Created with the spirit of adventure.* 🏴‍☠️
