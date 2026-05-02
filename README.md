# GoalFlow

A full-stack goal tracking app built with Next.js 14, NextAuth v5, Drizzle ORM, and Neon Postgres.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js v5 with JWT strategy
- **Database**: Neon Postgres (serverless)
- **ORM**: Drizzle ORM
- **UI**: shadcn/ui components + Tailwind CSS
- **Validation**: Zod + React Hook Form
- **Deployment**: Vercel

## Features

- 🔐 Email/password authentication
- 🎯 **Goals** — Define what you want to achieve
- 📁 **Projects** — Linked to goals, organize your work
- ✅ **Tasks** — Linked to projects, actionable items with priority & due dates
- Full CRUD for all entities
- One-click task completion toggle

## Setup

### 1. Clone & install

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in:

```env
# From neon.tech — create a project and copy the connection string
DATABASE_URL="postgresql://..."

# Generate with: openssl rand -base64 32
AUTH_SECRET="your-secret"

NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret"
```

### 3. Push the database schema

```bash
npm run db:push
```

### 4. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Database Commands

| Command | Description |
|---|---|
| `npm run db:push` | Push schema to DB (dev) |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Deploying to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add all env vars from `.env.local`
4. Deploy

## Project Structure

```
src/
├── app/
│   ├── (auth)/         # Login & Register pages
│   ├── (dashboard)/    # Protected app pages
│   └── api/            # API routes (goals, projects, tasks, auth)
├── components/
│   ├── ui/             # Base shadcn components
│   ├── layout/         # Sidebar
│   ├── goals/          # Goal CRUD components
│   ├── projects/       # Project CRUD components
│   └── tasks/          # Task CRUD components
├── lib/
│   ├── auth/           # NextAuth config
│   ├── db/             # Drizzle schema & client
│   └── validations/    # Zod schemas
└── hooks/              # useToast
```
