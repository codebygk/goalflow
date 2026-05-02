# GoalSeed

> Plant seeds. Grow goals.

GoalSeed is a full-stack goal management app built with Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, and Neon Postgres (Drizzle ORM).

## Features

- **Goals** - Create, edit, delete goals with status, target date, and category
- **Categories** - CRUD categories (name, color, icon) and assign to goals
- **Projects** - Break goals into projects
- **Tasks** - Actionable tasks with priority, due dates, repeat intervals
- **My Day** - Daily focus view
- **Overview** - Weekly and monthly progress with exportable social cards
- **Search, Filter & Sort** - Available on Goals, Projects, and Tasks
- **Auth** - Email/password via NextAuth v5

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Drizzle ORM + Neon Postgres
- NextAuth v5

## Setup

```bash
npm install
cp .env.local.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET
npm run db:push
npm run dev
```

## New: Migrations needed

The `categories` table and `category_id` column on `goals` are new.
Run `npm run db:push` to apply schema changes.
