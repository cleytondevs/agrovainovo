# Agro Tech Agricultural Monitoring Dashboard - Design Guidelines

## Design Approach
**System:** Material Design 3 adapted for agricultural data. Chosen for robust data visualization patterns, strong grid systems, and flexibility with organic color palettes. Combines clean information architecture with approachable agricultural aesthetic.

## Typography
- **Primary:** Inter (via Google Fonts)
  - Headings: 600 weight, sizes 2xl to 4xl
  - Body: 400 weight, base and sm sizes
  - Data/Metrics: 500 weight, lg to 3xl for emphasis
  - Labels: 500 weight, xs to sm

## Spacing System
Use Tailwind units: **2, 3, 4, 6, 8, 12, 16** for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: py-8 to py-12
- Card gaps: gap-4 to gap-6
- Container max-width: max-w-7xl

## Layout Architecture

### Dashboard Structure
- **Persistent Top Navigation Bar** (h-16): Logo left, search center, notifications/profile right
- **Sidebar** (w-64): Collapsible navigation with icons + labels (Dashboard, Fields, Analytics, Reports, Settings)
- **Main Content Area**: Dynamic grid system adapting to data cards
- **Grid Patterns**: 
  - Overview metrics: 4-column grid (grid-cols-4)
  - Data cards: 2-3 column responsive (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
  - Detailed views: Full-width with nested 2-column layouts

### Hero Section
Large hero banner spanning full-width above dashboard (h-64 to h-80):
- Background: Agricultural field aerial photography
- Overlay gradient for text readability
- Centered content: Welcome message, quick stats, primary CTA with blurred background
- No hover states on hero buttons

## Component Library

### Core Components
1. **Metric Cards**: Elevated cards (rounded-lg, shadow-md) with icon, value (large bold), label, trend indicator (↑↓)
2. **Data Tables**: Striped rows, sortable headers, inline actions, pagination footer
3. **Charts**: Line graphs for trends, bar charts for comparisons, donut charts for distributions - all with green/blue data series
4. **Field Map View**: Interactive map component with plot boundaries, color-coded health indicators
5. **Alert Banners**: Rounded containers with icon, message, dismiss action for weather/pest warnings
6. **Filter Panel**: Sidebar with date range, field selection, parameter toggles
7. **Action Buttons**: Rounded-md, medium size, icon + text combinations

### Forms & Inputs
- **Text Fields**: Outlined style with floating labels
- **Dropdowns**: Custom styled with green accent on active
- **Date Pickers**: Calendar overlay with green selection
- **Toggle Switches**: Green when active for monitoring parameters

### Navigation
- **Top Bar**: Solid background, contained search input, icon-based utilities
- **Sidebar**: Section groups with dividers, active state with left border accent
- **Breadcrumbs**: Small text with separator (/) for nested views

### Soil Analysis Section
Dedicated cards with earth tone backgrounds (warm beige/tan):
- pH level indicators with color gradient scales
- Nutrient composition breakdown (N-P-K) in segmented displays
- Moisture readings with depth visualization
- Recommendation panels with actionable insights

## Data Visualization Patterns
- **Real-time Widgets**: Small cards with live updating values, sparkline mini-charts
- **Comparison Views**: Side-by-side field performance cards
- **Historical Trends**: Full-width timeline charts with selectable date ranges
- **Heat Maps**: Color-coded field sections showing irrigation/fertilization zones

## Images

### Hero Image
**Placement:** Full-width banner at top of dashboard (above main content)
**Description:** Aerial drone shot of organized agricultural fields with visible crop rows, showing healthy vegetation. Golden hour lighting preferred. Include subtle gradient overlay (dark bottom to transparent top) for text contrast.

### Empty States
**Field monitoring cards:** Illustrations of farm equipment, plants, or sensors when no data is available
**Weather widget:** Simple weather-related iconography

### Background Textures
**Soil section cards:** Subtle organic texture or close-up soil photography as very light background pattern (10-15% opacity)

## Animations
Minimal and purposeful only:
- Loading skeletons for data cards
- Smooth chart transitions on data update (300ms)
- Sidebar collapse/expand (200ms ease)

## Accessibility
- Minimum 4.5:1 contrast for all text
- Focus visible indicators (2px ring)
- ARIA labels for all interactive elements
- Keyboard navigation throughout dashboard
- Screen reader announcements for data updates