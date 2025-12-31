# Replit.md

## Overview

This is an Agro Tech web application built with a React frontend and Express backend. The project combines agricultural themes with technology to create a dashboard-style application. The frontend uses Supabase for authentication, while the backend is structured to support PostgreSQL via Drizzle ORM. The application features a login system and protected dashboard with agricultural monitoring widgets.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Agro Tech theme (green primary, blue secondary, earth accents)
- **Form Handling**: React Hook Form with Zod validation
- **Fonts**: Outfit (display) and Plus Jakarta Sans (body)

### Access Control & Pages
- **SignUp** (`/`) - Public page for creating new accounts
- **SetupAccess** (`/setup?code=XXXXX`) - Restricted page for initial setup with single-use link (usage expires after one use)
- **Dashboard** (`/dashboard`) - Protected page with login functionality for existing users

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Build System**: Vite for frontend, esbuild for server bundling
- **API Structure**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas
- **Development Server**: Integrated Vite dev server with HMR support

### Authentication
- **Provider**: Supabase Authentication (client-side)
- **Pattern**: Frontend communicates directly with Supabase for auth
- **Environment Variables**: 
  - `VITE_SUPABASE_URL` - Public Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Populated from secret `SUPABASE_ANON_KEY`
  - Secret `SUPABASE_ANON_KEY` - Secure storage for the anon key
- The backend doesn't handle auth directly; Supabase manages user sessions
- **Security**: The anon key is stored as a Replit secret and exposed to frontend via environment variable

### Deployment Notes
**For Netlify (Required for Supabase login to work):**

1. **Go to your Netlify site → Site settings → Build & deploy → Environment**
2. **Add these environment variables:**
   - Name: `VITE_SUPABASE_URL` | Value: Your Supabase project URL (e.g., `https://xxx.supabase.co`)
   - Name: `SUPABASE_ANON_KEY` | Value: Your Supabase anonymous/public key

3. **Verify build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist/public`
   - Base directory: (leave empty)

4. **How it works:**
   - During build, `npm run build` calls `server/setup-env.mjs` 
   - `setup-env.mjs` reads the environment variables and creates `.env.local`
   - Vite compiles the frontend with Supabase credentials embedded
   - The server also has access to `SUPABASE_ANON_KEY` at runtime (fallback if frontend needs it)

5. **Testing:**
   - After deploy, check browser console for "[Supabase Init]" messages
   - If you see errors, check Netlify build logs for environment variable warnings

### Data Storage
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Stored in `./migrations` directory
- **Current Storage**: Memory storage (`MemStorage`) as fallback when database unavailable
- **Database Push**: `npm run db:push` via drizzle-kit
- **Access Link System**: Tracks setup links in `access_links` table with usage-based expiration (1 use per link)

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (Shadcn)
    hooks/        # Custom React hooks
    lib/          # Utilities and clients
    pages/        # Route pages
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route definitions
  storage.ts      # Data storage abstraction
  db.ts           # Database connection
shared/           # Shared between client/server
  schema.ts       # Drizzle database schema
  routes.ts       # API route type definitions
```

### Build and Development
- **Development**: `npm run dev` - Runs Express with Vite middleware
- **Production Build**: `npm run build` - Bundles client with Vite, server with esbuild
- **Output**: `dist/public` for client, `dist/index.cjs` for server

## Integration Status

### GitHub
- **Status**: User requested connection to GitHub
- **Repository**: https://github.com/cleytondevs/agrovainovo.git
- **Note**: Replit restricts direct git operations via CLI. User needs to complete git setup through Replit's Git pane or by connecting through the GitHub integration in Replit settings

## Authentication Architecture

**Decision (2025-12-30):** Using only Supabase Auth for authentication
- Removed admin login functionality that depended on Express API endpoints
- All users now authenticate via Supabase Auth (email/password)
- This makes the app suitable for frontend-only hosting (Netlify, Vercel)
- No backend Express server required, can be fully deployed on Supabase + hosting provider

## Soil Analysis Workflow (2025-12-31)

**Feature Implemented:** Complete analysis review and delivery flow

### How It Works:
1. **Client submits analysis** - Via Dashboard > "Análise de Solo" tab
2. **Admin reviews** - Via `/admin` panel, sees all pending analyses
3. **Admin provides feedback** - Adds:
   - Status (Pending/Approved/Rejected)
   - Admin comments explaining the analysis
   - Result files (PDFs, reports, etc.)
4. **Client receives results** - Analysis appears in "Minhas Análises" page
   - Shows status badge
   - Displays admin comments
   - Provides download links for all result files

### Technical Details:
- **Data Flow**: Client → Soil Analysis Table → Admin Review → Same record updated
- **Storage**: Files stored in Supabase Storage bucket (`soil-analysis-pdfs`)
- **Access**: Clients only see their own analyses via email filter
- **Download**: Secure download using Supabase Storage API

### UI Components:
- **Dashboard**: "Minhas Análises" button in header (line 566)
- **MyAnalyses Page**: `/my-analyses` route shows all analyses with:
  - Status with color-coded badge
  - Admin comments section (if any)
  - Download buttons for result files
  - Back to Dashboard button

## Recent Fixes (2025-12-30)

### Session Validation with Deleted Users
**Issue**: When a user was deleted from Supabase, the session remained valid in the browser and user could still access the dashboard. Additionally, deleted users could still login through the admin login endpoint.

**Solution**: Added multi-layer validation to prevent deleted users from accessing the app:

1. **useAuth hook** - Validates session on load and when auth state changes. If user doesn't exist, automatically signs out.

2. **Dashboard component** - Added periodic validation every 30 seconds. Detects if user is admin login or Supabase Auth and validates accordingly:
   - Admin logins: Checks if login still exists in logins table via `/api/verify-login-exists` endpoint
   - Supabase Auth: Checks if user still exists in Supabase Auth via `getUser()`

3. **verify-login endpoint** - Added verification that user still exists in Supabase Auth before allowing login. Even if credentials exist in the logins table, login fails if user was deleted from Supabase Auth.

4. **verify-login-exists endpoint** (NEW) - Validates session without requiring password. Used by frontend to periodically verify admin logins are still valid.

**How it works**:
- When user logs in via admin, localStorage stores `isAdminLogin=true` and `userEmail`
- Periodic validation (every 30s) checks appropriate endpoint based on login type
- If validation fails (user/login deleted or expired), session is cleared and user is signed out
- On logout, localStorage is cleaned up

## External Dependencies

### Supabase
- **Purpose**: Authentication and user management
- **Configuration**: Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables
- **Client**: `@supabase/supabase-js` initialized in `client/src/lib/supabaseClient.ts`

### PostgreSQL Database
- **Purpose**: Data persistence
- **Configuration**: Requires `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with `drizzle-kit` for migrations
- **Connection**: Managed via `pg` Pool in `server/db.ts`
- **Fallback**: Application gracefully handles missing database connection for Supabase-only usage

### UI Dependencies
- **Radix UI**: Complete set of accessible UI primitives
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel functionality
- **Recharts**: Charting library (via `chart.tsx` component)
- **Vaul**: Drawer component
- **cmdk**: Command menu component