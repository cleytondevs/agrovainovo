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

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Build System**: Vite for frontend, esbuild for server bundling
- **API Structure**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas
- **Development Server**: Integrated Vite dev server with HMR support

### Authentication
- **Provider**: Supabase Authentication (client-side)
- **Pattern**: Frontend communicates directly with Supabase for auth
- **Environment Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- The backend doesn't handle auth directly; Supabase manages user sessions

### Data Storage
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Stored in `./migrations` directory
- **Current Storage**: Memory storage (`MemStorage`) as fallback when database unavailable
- **Database Push**: `npm run db:push` via drizzle-kit

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