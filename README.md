# 🚀 DevFlow AI — Project Management & Collaboration Platform

DevFlow AI is a full-stack project management and collaboration platform designed to help teams organize workspaces, manage projects, track tasks, and coordinate development workflows in one place.

The platform focuses on structured task management, secure workspace-level access control, and relational data management to support collaboration between project owners, administrators, and team members.

## ✨ Features

### 📁 Workspace Management
- Organize work within dedicated workspaces.
- Support workspace roles: `OWNER`, `ADMIN`, and `MEMBER`.
- Apply workspace-level authorization to protect team resources.

### 📌 Project & Task Management
- Create and manage projects within workspaces.
- Organize work using a workspace → project → task hierarchy.
- Track task status, priority, type, assignments, and due dates.
- Manage task dependencies to represent relationships between tasks.
- Support task comments and activity tracking.

### 🔐 Authentication & Security
- JWT-based authentication.
- Password hashing using bcrypt.
- Role-Based Access Control (RBAC).
- Workspace-aware authorization middleware.
- Protected backend routes and access validation.

### 🗄️ Database Management
- PostgreSQL for relational data storage.
- Prisma ORM for database access and schema management.
- Structured relationships between users, workspaces, memberships, projects, and tasks.

### ⚙️ Backend & API
- RESTful API architecture using Node.js and Express.js.
- Centralized handling of application requests and business logic.
- Inngest integration for background processing where configured.

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT, bcrypt |
| Authorization | Role-Based Access Control (RBAC) |
| Background Processing | Inngest |
| Version Control | Git, GitHub |

## 🏗️ Architecture

DevFlow AI follows a client-server architecture.

```text
                 ┌──────────────────────┐
                 │      React + Vite    │
                 │       Frontend       │
                 └──────────┬───────────┘
                            │
                       HTTP / REST
                            │
                 ┌──────────▼───────────┐
                 │   Node.js + Express  │
                 │      Backend API     │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │   JWT Authentication │
                 │   Workspace RBAC     │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │     Prisma ORM       │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │     PostgreSQL       │
                 └──────────────────────┘
```

### Authorization Flow

1. A user authenticates with the application.
2. The backend validates the JWT for protected requests.
3. Workspace authorization middleware checks the user's membership and required role.
4. The request proceeds only when the user is authorized to perform the operation.

## 📂 Project Structure

```text
DevFlow-AI/
├── client/                 # React + Vite frontend
├── server/                 # Node.js + Express backend
├── .gitignore
└── README.md
```

The internal source structure may vary as the project evolves.

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites

- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/V-MANAS/DevFlow-AI.git
cd DevFlow-AI
```

### 2. Install Dependencies

Install frontend and backend dependencies separately.

```bash
cd client
npm install
```

Then open another terminal:

```bash
cd server
npm install
```

### 3. Configure Environment Variables

Create the environment files expected by your frontend and backend configuration.

For the backend, configure the database connection and JWT secret. For example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/devflow"
JWT_SECRET="replace_with_a_secure_random_secret"
```

These names are examples; use the exact variable names read by your application code. If your server uses additional environment variables, configure those as well.

**Security:** Never commit real credentials, API keys, or production secrets to GitHub.

### 4. Set Up the Database

From the server directory, run the Prisma commands appropriate to your project's current schema and migration setup.

```bash
npx prisma generate
npx prisma migrate dev
```

If the project already has migrations, apply them rather than creating duplicate schema changes. If your setup uses database introspection or another migration workflow, follow that workflow instead.

### 5. Start the Application

Start the backend using the script configured in `server/package.json`. For example, if `dev` is defined:

```bash
cd server
npm run dev
```

Start the frontend in a separate terminal:

```bash
cd client
npm run dev
```

Open the local URL printed by Vite in your terminal.

> Note: The exact environment variables, npm scripts, ports, and database commands should match the current project configuration.

## 🧠 Key Engineering Concepts

DevFlow AI provides practical experience with:

- REST API design and client-server communication.
- Authentication and authorization using JWT and RBAC.
- Relational database modeling and ORM-based queries.
- Middleware-based request processing.
- Workspace-level access control.
- Task dependency modeling and workflow organization.
- Background processing integration.
- Full-stack application development and debugging.

## 🔮 Future Enhancements

Potential improvements for future versions include:

- Task dependency graph visualization and critical path analysis.
- GitHub integration for repository and development activity tracking.
- AI-assisted task planning and project insights.
- Automated testing and continuous integration workflows.
- Enhanced project analytics and reporting.

These are proposed enhancements and should be marked as implemented only after they are available in the application.

## 👨‍💻 Author

**Manas Manoj Varade**

Computer Engineering Student | Full-Stack Developer

- GitHub: [@V-MANAS](https://github.com/V-MANAS)
- Project Repository: [DevFlow AI](https://github.com/V-MANAS/DevFlow-AI)

---

⭐ If you find this project interesting, consider giving the repository a star.

