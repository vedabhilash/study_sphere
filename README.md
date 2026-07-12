# StudySphere: Student Online Study Group & Skill Swap MERN App

Welcome to **StudySphere**, a production-ready, highly secure, and optimized full-stack MERN (MongoDB, Express.js, React, Node.js) web application designed for students to collaborate, schedule study meetups, swap academic skills, and engage in real-time virtual classrooms (incorporating WebRTC video and collaborative whiteboard sketchpads).

---

## 🚀 Key Improvements & Architecture Overhaul

The codebase has been refactored to align with enterprise security, optimal database performance, modern state management, and elegant UI/UX design.

### 🛡️ 1. Enterprise-Grade Security
*   **HTTP Protection & Hardening**: Configured `helmet` to establish secure HTTP response headers, preventing clickjacking, MIME-type sniffing, and XSS.
*   **API Rate Limiting**: Added `express-rate-limit` to restrict brute-force attacks on authorization routes (`/api/auth/*`) and general API abuse.
*   **NoSQL Injection Mitigation**: Hooked `express-mongo-sanitize` to purge query injections (e.g., removing `$` and `.` prefixes from client payloads).
*   **Payload Size Limits**: Constrained body-parsers to a `10kb` limit on JSON and URL-encoded bodies.
*   **Strict Upload Validation**: Refactored Multer `fileFilter` to whitelist safe files (`.pdf, .doc, .docx, .png, .jpg, .jpeg, .gif, .zip, .txt`) and block executable/arbitrary files, with a `10MB` limit.
*   **WebSockets Secure Handshake**: Modified Socket.IO connections to authorize handshakes using decoded JWT payload IDs rather than client-reported identifiers, preventing user impersonation.

### 📊 2. Centralized Input Validation & Custom Error Interceptor
*   **Joi Request Schemas**: Created unified Joi schemas in `server/middleware/validationMiddleware.js` targeting:
    *   User Registration / Login
    *   Group Creation
    *   Study Session Scheduling
*   **Global Express Error Interceptor**: Added a centralized error handler (`errorMiddleware.js`) that captures CastErrors, mongoose ValidationErrors, Duplicate Key entries, and Multer limits, returning sanitized logs in production.

### 🗃️ 3. Optimized Database Performance (MongoDB Indexing)
Defined compound, sparse, and single-field indexing schemes inside models to guarantee fast query executions:
*   **User Model**: Indexes on `academicMajor` (1) and compound index `{ rating: -1, completedSessions: -1 }` for matches.
*   **Group Model**: Compound index `{ members: 1 }` and a sparse index on `inviteCode`.
*   **Message Model**: Compound index `{ groupId: 1, timestamp: 1 }` for faster chat thread loads.
*   **SkillSession Model**: Compound indices on `{ mentor: 1, status: 1 }` and `{ learner: 1, status: 1 }`.

### 💻 4. Client Architecture & UI/UX Upgrades
*   **Unified API Service Layer**: Replaced ad-hoc axios instances with a standardized client in `client/src/utils/apiService.js`, setting up automatic request/response interceptors to attach JWT Bearer tokens and gracefully handle errors.
*   **Skeleton & Empty State Loaders**: Designed high-quality animated shimmer loading skeletons (`Skeleton.jsx`) and illustrated empty-slate placeholders (`EmptyState.jsx`) to replace raw loader widgets.
*   **Overhauled Dashboard Feed**: Upgraded dashboard to display personalized profile completion metrics, dynamic recommended study groups, skill-swapping matches, and recent activities.
*   **Next-Gen Chatroom**:
    *   *Threaded Quotes / Replies* to message cards.
    *   *Real-time Typing Statuses* synchronized via socket relays.
    *   *Unread Message Badges* when navigating away from the chatroom panel.
    *   *Interactive Emoji Popover Picker*.
    *   *Date Separator Bubbles* (e.g. daily intervals).
*   **Virtual Classroom Refactoring**:
    *   Extracted collaborative whiteboard canvas into a modular component (`Whiteboard.jsx`).
    *   Extracted WebRTC meeting chat sidebar into `MeetingChat.jsx`.
    *   Implemented WebRTC garbage collection routines that clear RTCPeerConnections and stop microphone/camera media tracks on component unmounting, preventing memory leaks and active hardware indicators.

---

## 📂 Project Directory Structure

```
student-study-group/
├── client/                     # Front-end React + Vite App
│   ├── src/
│   │   ├── components/         # Reusable widgets (Avatar, Skeleton, EmptyState, Whiteboard, MeetingChat)
│   │   ├── context/            # AuthContext, SocketContext
│   │   ├── pages/              # Main routes (Dashboard, GroupDetailsPage, Login, Register)
│   │   ├── utils/              # centralized apiService.js
│   │   ├── App.jsx             # Client routes and main layout
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Back-end Node + Express API Server
│   ├── middleware/             # errorMiddleware, validationMiddleware, uploadMiddleware, authMiddleware
│   ├── models/                 # Mongoose models (User, Group, Message, SkillSession, Resource)
│   ├── routes/                 # Express REST routes (authRoutes, groupRoutes, skillsRoutes, resourceRoutes)
│   ├── socket/                 # socketHandler.js (WebSockets and JWT Handshake verification)
│   ├── config/                 # db.js
│   ├── server.js               # Entry point (Express server instantiation, security middleware registration)
│   └── package.json
```

---

## 🛠️ Running Locally

### Prerequisites
*   Node.js (v18+)
*   MongoDB Instance (Local or MongoDB Atlas)

### Setup Configurations

1.  **Clone the workspace** and navigate to the directory:
    ```bash
    cd student-study-group
    ```

2.  **Configure Backend Environments (`server/.env`)**:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/studysphere
    JWT_SECRET=your_jwt_secret_key_here
    ```

3.  **Configure Frontend Environments (`client/.env`)**:
    ```env
    VITE_API_URL=http://localhost:5000
    ```

### Starting the Application

#### Backend:
```bash
cd server
npm install
npm run dev
```

#### Frontend:
```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
