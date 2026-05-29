# DailyDash Native App

A productivity app for managing daily routines, todos, and schedules.

## Core Features

1. **Todos**
   - Create, edit, and complete todos
   - Priority levels (low, medium, high)
   - Scheduled times for tasks
   - Due date presets (today, tomorrow)

2. **Schedules**
   - Daily routine templates
   - Time-blocked tasks with durations
   - Task categories (health, fitness, work, finance, personal)
   - Progress tracking with streaks

3. **Dashboard**
   - Activity heatmap (GitHub-style contribution graph)
   - Weekly stats and completion rates
   - Streak tracking

4. **AI Assistant**
   - Productivity tips and guidance
   - Schedule planning help
   - Habit building advice

## Tech Stack

- **Expo Router** - File-based routing
- **React Navigation** - Drawer + tabs + stack navigation
- **Supabase** - Backend database + authentication
- **Apollo Client** - GraphQL (optional)
- **TypeScript** - Throughout

## Authentication

Uses Supabase Auth with:
- Email/password sign up and sign in
- Google OAuth (requires setup in Supabase Dashboard)
- Password reset via email
- Session persistence with Expo SecureStore

## Data Storage

### Supabase Tables
- `profiles` - User profiles (auto-created on signup via trigger)
- `todos` - Todo items with priorities and schedules
- `schedules` - Daily routine templates
- `schedule_tasks` - Tasks within schedules
- `daily_progress` - Task completion tracking

All tables use Row Level Security (RLS) with `auth.uid()`.

### Local Storage
- Expo SecureStore for auth session
- AsyncStorage for offline schedule data

## Project Structure

```
app/
  (drawer)/           # Drawer navigation group
    (tabs)/           # Tab navigation (Home, Dashboard, Profile)
    apps/             # Sub-apps (Calendar, Notes, Settings, Schedules)
  compose.tsx         # New post/note modal
components/
  cards/              # TodoCard
  chat/               # ChatFAB, ChatOverlay (AI assistant)
  drawer/             # EntityDrawer navigation
  modals/             # AddTodoModal
  schedules/          # ScheduleModal, TaskModal, TaskList
  ui/                 # ScreenHeader
contexts/
  AddTodoModalContext.tsx
  ChatOverlayContext.tsx
lib/
  api/                # Apollo Client setup
  schedules/          # Schedule types, storage, defaults
  supabase/           # Supabase client, auth hooks, provider
  todos/              # Todo types and storage
  utils/              # useThemedColors
```

## Setup

1. Create a Supabase project at https://supabase.com
2. Copy `.env.example` to `.env` and fill in your Supabase credentials
3. Link and push the database schema:
   ```bash
   npm run db:link        # Enter your project ref
   npm run db:push        # Push migrations to remote
   npm run db:types       # Generate TypeScript types
   ```
4. (Optional) Enable Google OAuth in Supabase Dashboard > Authentication > Providers

## EAS Workflows

Workflow definitions live in `.eas/workflows/`:

- `.eas/workflows/create-preview-builds.yml`: builds `preview` profile for PRs targeting `main`
- `.eas/workflows/create-production-builds.yml`: builds `production` profile for pushes to `main`

Run a workflow manually:

```bash
npx eas-cli@latest workflow:run create-preview-builds.yml
npx eas-cli@latest workflow:run create-production-builds.yml
```

To enable GitHub-triggered runs, connect this repo in the project's GitHub settings on `expo.dev` (Project → Settings → GitHub).

Configure secrets/vars (for example, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) using EAS Environment Variables on `expo.dev` (set them per environment: `preview` / `production`).

## Database Commands

```bash
npm run db:link          # Link to remote Supabase project
npm run db:push          # Push migrations to remote database
npm run db:reset         # Reset local database (requires Docker)
npm run db:types         # Generate TypeScript types from schema
npm run db:migrate NAME  # Create a new migration file
```

## Design Notes

- **Dark theme first** - Clean, modern dark UI
- **Floating action button** - Quick access to add todos, notes, AI chat
- **Tab bar** - Home (todos), Dashboard (stats), Profile
- **Drawer** - Quick app switching and navigation
