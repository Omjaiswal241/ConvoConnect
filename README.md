# Convo – Real‑Time Room Chat App

Convo is a full‑stack chat application where users can sign up, sign in, create or join rooms via room code, and exchange messages with other members. Room ownership, membership, and deletion behavior are handled on the backend, while a modern React + Tailwind UI powers the frontend. Real‑time message delivery is implemented with **Socket.IO** (WebSockets) between the backend and the RoomChat page.

**Live Demo (Frontend)**: https://convoconnect-frontend.onrender.com

This workspace contains two main projects:

- **Convo_Backend** – Node.js/Express API with MongoDB (Atlas) via Mongoose
- **Convo_Frontend** – Vite + React + TypeScript SPA

---

## Features

- **Authentication**
  - Sign up with name, email, and password
  - Sign in with email and password
  - Strong validation using Zod
  - Unique email and username enforced at the database level
  - JWT‑based authentication with `Authorization: Bearer <token>`

- **Rooms & Membership**
  - Create rooms with a name and optional description
  - Each room has a unique **room code** that can be shared
  - Join rooms either from a list of joined rooms or **via room code**
  - Per‑user room visibility: users only see rooms they are members of
  - Room membership and roles tracked via a `RoomMember` model (owner/member)

- **Ownership & Deletion Rules**
  - The room **creator is the owner**
  - Only the owner can **rename** the room
  - When the owner leaves, ownership is transferred to the next member
  - The room (and its messages & memberships) is **deleted only when the last member leaves**

- **Messaging**
  - Send and view messages within a room
  - Message history is loaded when entering a room
  - User’s own messages are shown on the **right**, others’ on the **left**
  - Basic member list with avatars is shown in the sidebar
  - New messages are pushed in **real time** via Socket.IO (WebSockets)

- **Profiles & Avatars**
  - Backend supports `GET /me` and `PATCH /me` to read/update profile (name + avatar field)
  - Chat UI uses the `avatar` text when present, otherwise falls back to initials

---

## Tech Stack

### Backend (Convo_Backend)

- Node.js (CommonJS)
- Express 5
- MongoDB Atlas via Mongoose 9
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)
- Zod (schema validation)
- Socket.IO server for WebSocket‑based real‑time events
- cors, dotenv

### Frontend (Convo_Frontend)

- React 18 + TypeScript
- Vite 5/7
- React Router DOM
- @tanstack/react-query
- Tailwind CSS + Radix UI components + shadcn‑style component abstractions
- socket.io-client for WebSocket connections to the backend
- lucide‑react icons

---

## Project Structure

```text
Convo/
  Convo_Backend/
    index.js         # Express app & API routes
    db.js            # Mongoose connection & models (User, Room, Message, RoomMember)
    package.json

  Convo_Frontend/
    client/
      App.tsx       # React Router, entry point
      pages/
        Index.tsx   # Landing page
        SignUp.tsx  # Register
        SignIn.tsx  # Login
        JoinRoom.tsx# List/join/create rooms
        RoomChat.tsx# Room chat UI
        NotFound.tsx
    package.json
    vite.config*.ts, tailwind.config.ts, etc.

  README.md
```

---

## Backend Setup (Convo_Backend)

1. **Install dependencies**

   ```bash
   cd Convo_Backend
   npm install
   ```

2. **Configure environment**

   The backend reads the MongoDB URI from `MONGODB_URI` or falls back to a default Atlas URI that points to the **ConvoConnect** database.

   Recommended: create a `.env` file in `Convo_Backend`:

   ```env
   MONGODB_URI="your-mongodb-atlas-uri-with-ConvoConnect-db"
   JWT_SECRET="your-secret-key"
   PORT=5000
   ```

3. **Run the server**

   ```bash
   cd Convo_Backend
   node index.js
   ```

   The API will listen on `http://localhost:5000` by default (or the `PORT` you set).

---

## Frontend Setup (Convo_Frontend)

> The frontend uses **npm** as the primary package manager. You can still use pnpm or yarn locally if you prefer, but the canonical lockfile in the repo is `package-lock.json`.

1. **Install dependencies**

   ```bash
  cd Convo_Frontend
  npm install
   ```

2. **Configure environment**

   The frontend expects the backend base URL through `VITE_API_BASE_URL`. If not set, components default to `http://localhost:5000`.

   Create a `.env` file in `Convo_Frontend` (same folder as `package.json`):

   ```env
   VITE_API_BASE_URL="http://localhost:5000"
   ```

3. **Run the dev server**

   ```bash
  cd Convo_Frontend
  npm run dev
   ```

   Open the printed URL (usually `http://localhost:5173`) in your browser.

---

## Core API Overview (Backend)

All protected routes require a header:

```http
Authorization: Bearer <JWT_TOKEN>
```

### Auth

- `POST /signup` – create user, returns `{ token, user }`
- `POST /signin` – login, returns `{ token, user }`

### Profile

- `GET /me` – get current user profile (id, name, email, avatar)
- `PATCH /me` – update `name` and/or `avatar`

### Rooms

- `GET /rooms` – list rooms the current user has joined (with member counts)
- `POST /rooms` – create a new room (also creates owner membership and room code)
- `POST /rooms/join-by-code` – join a room using `roomCode`
- `POST /rooms/:roomId/join` – join a room by its id
- `GET /rooms/:roomId/details` – get room info, members, and your membership
- `PATCH /rooms/:roomId` – rename room (owner only)
- `POST /rooms/:roomId/leave` – leave room; may transfer ownership or delete room if last member

### Messages

- `GET /rooms/:roomId/messages` – get all messages in a room (membership required)
- `POST /rooms/:roomId/messages` – send a new message to the room

### Health

- `GET /health` – simple health check

---

## Frontend Behavior (High Level)

- **Index page** – marketing/landing page with CTA to get started.
- **SignUp / SignIn** – forms call `/signup` and `/signin`; error messages from Zod validation are surfaced in the UI.
- **JoinRoom** – after login, shows all rooms the user is a member of, allows creating a room, joining an existing one, or joining by room code. Also includes **Sign Out** (clears localStorage and redirects).
- **RoomChat** – shows messages for a specific room, member list, and a message input. User’s own messages are right‑aligned; other messages are left‑aligned. Owners can **rename** the room inline.

Authentication state is stored in `localStorage`:

- `convo_token` – JWT
- `convo_user` – serialized user info

---

## Testing & Scripts

### Backend

- `npm test` – placeholder (no tests configured yet).

### Frontend

From `Convo_Frontend`:

- `pnpm dev` / `npm run dev` – Vite dev server
- `pnpm build` / `npm run build` – build client + server bundles
- `pnpm start` / `npm run start` – run built server bundle
- `pnpm test` / `npm test` – run vitest test suite
- `pnpm format.fix` – run Prettier over the project
- `pnpm typecheck` – run TypeScript type checking

---

## Future Improvements

- Presence indicators and typing status over Socket.IO
- Rich link previews (e.g., for Instagram reels) in messages
- Full profile UI (frontend) to manage avatar and display name
- Advanced room settings (privacy, invites, moderators)




