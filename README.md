# `#` NOTES

> A monochromatic, keyboard-friendly note-taking app with Markdown support, real-time cloud sync, and a sharp, focused design.

---

## ✦ Overview

**NOTES** is a minimal, fully-featured note-taking web application built with React and Firebase. It uses a strict monochromatic design system — one color, many shades — to keep your focus where it belongs: on your writing.

Notes are synced in real-time to the cloud via Firestore, so your data is always available across devices. Each note is built from composable **blocks** — text blocks with full Markdown rendering, and interactive task (checklist) blocks.

---

## ✦ Features

### ✍️ Block-Based Editor
- Notes are composed of independent **blocks** — mix and match as needed
- **Text blocks** — full Markdown editing with a live format toolbar (bold, italic, headings, code, blockquote, links)
- **Task blocks** — interactive checkboxes that persist their state
- Blocks can be reordered (↑ / ↓) or individually deleted
- Inline **edit ↔ preview** toggle per block
- Global **EDIT / PREVIEW** mode toggle for the whole note

### 🗂️ Categories
- Organize notes into custom categories (e.g. `WORK`, `IDEAS`, `CODE`, `PERSONAL`)
- Filter the notes grid by category from the header dropdown
- Rename or delete categories — affected notes are automatically reassigned
- Full CRUD via the **Category Manager** panel

### ☁️ Real-time Cloud Sync
- Notes and categories are stored in **Firebase Firestore**
- Changes persist instantly across browser reloads and devices
- Optimistic local updates — no waiting for network round-trips

### 🔐 Authentication
- Sign in with **Google** or **Email / Password**
- Register a new account in-app
- Change password from the Settings panel (email accounts)
- Sign out from any device

### 🧹 UX Details
- **Undo / Redo** stack (Ctrl+Z / Ctrl+Y) for block edits and title changes
- Title auto-appears in the editor header when you scroll past it
- **Background image** support per note (set via URL)
- Notes grid shows a live content preview of up to 4 blocks
- Category label and creation date shown on every note card
- Responsive layout — works on mobile and desktop

---

## ✦ Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS v4 |
| Markdown Rendering | `react-markdown` + `prismjs` (syntax highlighting) |
| Auth & Database | Firebase v11 (Auth + Firestore) |
| Icons | Lucide React |
| Animations | Motion (Framer Motion v12) |

---

## ✦ Project Structure

```
src/
├── App.tsx                   # Root app, auth gate, notes grid, state management
├── firebase.ts               # Firebase app initialization
├── types.ts                  # TypeScript types: Note, Block, BlockType
├── index.css                 # Global styles & Tailwind config
└── components/
    ├── AuthScreen.tsx         # Login / Register screen
    ├── NoteCard.tsx           # Grid card with content preview
    ├── NoteEditor.tsx         # Full-screen block editor
    ├── MarkdownEditorBlock.tsx # Individual editable block (text or task)
    ├── MarkdownRenderer.tsx   # Markdown → HTML renderer with Prism highlights
    ├── CategoryManager.tsx    # Add / rename / delete categories panel
    ├── SettingsPanel.tsx      # Account info, password change, sign out
    ├── ConfirmDialog.tsx      # Generic confirmation dialog
    └── InputDialog.tsx        # Generic text-input dialog
```

---

## ✦ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Firebase](https://console.firebase.google.com/) project with **Firestore** and **Authentication** enabled

### 1 — Clone & Install

```bash
git clone https://github.com/your-username/taj-notes.git
cd taj-notes
npm install
```

### 2 — Configure Environment

Copy the example env file and fill in your Firebase credentials:

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder values:

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

You can find these values in the **Firebase Console → Project Settings → Your apps**.

### 3 — Enable Firebase Services

In the Firebase Console:

1. **Authentication** → Sign-in method → Enable **Email/Password** and/or **Google**
2. **Firestore Database** → Create database → Start in **test mode** (or apply the rules below)

### 4 — Firestore Security Rules

For production, apply these rules in **Firestore → Rules**:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/app/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This ensures each user can only read and write their own notes.

### 5 — Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ✦ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local dev server on port 3000 |
| `npm run build` | Build the production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run TypeScript type checks (`tsc --noEmit`) |

---

## ✦ Data Model

Notes are stored in Firestore at:

```
users/{userId}/app/notes   → { list: Note[] }
users/{userId}/app/categories → { list: string[] }
```

**Note shape:**

```ts
interface Note {
  id: number;        // Unix timestamp (used as creation date)
  title: string;
  category: string;
  bg: string;        // Background image URL (optional)
  dimmed: boolean;
  blocks: Block[];
}

interface Block {
  id: string;
  type: 'text' | 'task';
  content: string;
  checked?: boolean; // Only present on task blocks
}
```

---

## ✦ License

MIT — see [LICENSE](LICENSE) for details.
