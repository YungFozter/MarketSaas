---
name: Hyperlocal Community Commerce
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#855300'
  on-tertiary: '#ffffff'
  tertiary-container: '#e29100'
  on-tertiary-container: '#523200'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  primary-emerald-hover: '#059669'
  primary-emerald-dark: '#047857'
  primary-emerald-surface: '#ecfdf5'
  accent-amber-light: '#fef3c7'
  neutral-slate-dark: '#1e293b'
  neutral-slate-border: '#e2e8f0'
  neutral-slate-divider: '#f1f5f9'
  neutral-slate-muted: '#64748b'
  feedback-danger: '#ef4444'
  glass-panel-bg: rgba(255, 255, 255, 0.85)
  glass-nav-bg: rgba(255, 255, 255, 0.92)
  glass-panel-border: rgba(226, 232, 240, 0.8)
typography:
  headline-hero:
    fontFamily: Outfit
    fontSize: 60px
    fontWeight: '800'
    lineHeight: 68px
    letterSpacing: -0.02em
  headline-hero-mobile:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  badge-micro:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  touch-min: 44px
  nav-height: 72px
  search-height: 56px
  gutter-xs: 0.5rem
  gutter-sm: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  gutter-xl: 3rem
  margin-mobile: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  max-width-canvas: 1280px
  split-ratio-list: 45%
  split-ratio-map: 55%
---

## Brand & Style

### Brand Personality & Emotional Impact
The visual language bridges neighborhood closeness with enterprise-grade logistics efficiency. It delivers the comforting familiarity of a trusted local minimarket combined with the high-speed clarity of modern logistics software. The emotional response is immediate reassurance, transactional velocity, and community belonging: residents feel their orders are handled next door by real neighbors, while merchants experience crisp operational control.

### Design Movement: Modern Bento Glassmorphism
The aesthetic synthesizes clean glassmorphism with modular Bento grids and mobile-first utilitarian clarity. Translucent glass surfaces (`backdrop-filter: blur(12px)`) separate spatial contexts without fragmenting information flow. Vibrant emerald interactive points command focus, grounded by clean snow-slate canvases and warm amber gamification anchors. 

Key visual principles:
- **Atmospheric Clarity:** Crisp, cool off-white and deep slate canvases keep high-density inventory legible.
- **Immediate Affordance:** Touch-first targets with a 44px minimum bounding box across all steppers, filters, and pills.
- **Physical Precision:** Zero superfluous chrome; tactile split-screen Bento cards anchor content alongside sticky, living spatial maps.

## Colors

The color system delivers tactical separation between transactional actions, editorial structure, and hyper-local gamification.

### Key Palettes
- **Primary (`#10b981`):** Active commercial driver. Used for primary CTAs, open-door status chips, store map markers, selected state pill segments, and final order triggers.
- **Secondary (`#0f172a`):** The grounding slate anchor. Applied to high-contrast display typography, modal backdrops, inverted navigation headers, and technical dashboard frames.
- **Tertiary (`#f59e0b`):** The community reward accent (**VeciPuntos**). Dedicated to loyalty points counters, community ratings, promotional perks, and warning cues.
- **Neutral (`#f8fafc`):** Snow Grey foundational canvas, paired with pure white (`#ffffff`) for elevated Bento cards and structured input containers.

### Semantics & Application Rules
- **Hover & Active States:** Primary controls transition from `#10b981` to `#059669`. Contrast borders and deep gradient text use `#047857`.
- **Destructive & Urgent Status:** Out-of-stock notices, closed stores, and cancellation flows use `#ef4444`.
- **Translucent Tiering:** Floating panels utilize `rgba(255, 255, 255, 0.85)` with a 1px boundary of `rgba(226, 232, 240, 0.8)`, guaranteeing contrast against both map textures and structured list tiers.

## Typography

The typographic hierarchy separates structural character from functional density:

- **Display & Headlines (`Outfit`):** Geometric, confident, and energetic. The pronounced geometric geometry provides distinction in commercial hero propositions, store names, and dashboard metrics.
- **Body, UI & Labels (`Plus Jakarta Sans`):** Balanced, modern, and humanized. Engineered with wide counters and robust stroke balance to retain legibility across dense pricing matrices, mobile checkout drawers, and live Kanban columns.

### Scaling & Responsiveness
- Hero elements reduce proportionally from `60px` (`headline-hero`) on desktop screens down to `36px` (`headline-hero-mobile`) on mobile viewports, avoiding awkward line wrapping in apartment and community titles.
- All uppercase chips and status badges utilize `badge-micro` (`10px`/`12px`) with deliberate `0.05em` letter-spacing to prevent visual clumping on high-density displays.

## Layout & Spacing

### Bento Grid & Split-Screen Hub
Layout rhythm is governed by an 8pt modular scale, structured around an asynchronous Bento split-screen architecture for localized desktop browsing:
- **Canvas Container:** Centered `max-w-7xl` (`1280px`) with fluid edge padding: `16px` (mobile), `24px` (tablet), and `32px` (desktop).
- **Desktop Bento Discovery:** Left column occupies `45%` fluid width for the virtual storefront and minimarket queue (`max-h-[800px]` with decoupled momentum scroll). The right column takes `55%` with sticky pinning (`min-h-[650px]`) dedicated to the vector map engine.
- **Mobile Paradigm:** Seamless segmented viewport switch between `[📋 Lista de Tiendas]` and `[🗺️ Ver Mapa]`, ensuring neither interface compromises the thumb zone.

### Touch Target Standard
Every interactive primitive—including category chips, counter triggers (`+` / `-`), filter badges, and drawer actions—strictly enforces a `44px × 44px` minimum bounding box to guarantee reliable operation in one-handed mobile scenarios.

## Elevation & Depth

Visual hierarchy uses clean glassmorphic strata, tinted ambient drops, and crisp low-contrast surface outlines instead of muddy drop shadows.

### Elevation Hierarchy
1. **Level 0 (App Canvas):** Pure flat Snow Grey (`#f8fafc`). Baseline background layer.
2. **Level 1 (Card & Content Blocks):** Pure white (`#ffffff`) bounded by a subtle `1px solid #f1f5f9` outline. Elevated by `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05)`. Hovering transitions elevate cards to `0 10px 15px -3px rgba(15, 23, 42, 0.08)`.
3. **Level 2 (Glassmorphic Floating Panels & Sticky Navigation):** `rgba(255, 255, 255, 0.85)` surface combined with `backdrop-filter: blur(12px)`. Bounded by `1px solid rgba(226, 232, 240, 0.8)` with an atmospheric depth shadow of `0 20px 25px -5px rgba(15, 23, 42, 0.05)`.
4. **Level 3 (Modal Dialogs, Overlays & Drawers):** High-opacity crystalline surface `rgba(255, 255, 255, 0.95)` with `backdrop-filter: blur(16px)`. Backed by an ultra-diffused boundary shadow `0 25px 50px -12px rgba(15, 23, 42, 0.18)` positioned over a dimming slate scrim (`rgba(15, 23, 42, 0.6)`).

## Shapes

The design uses a rounded geometry level of `2` (`0.5rem` base, `1rem` for `rounded-lg`, and `1.5rem` for `rounded-xl`), creating friendly, approachable silhouettes that preserve compact UI space:

- **Segmented Controls & Filter Pills (`rounded-full`):** Category pills, top-level mode toggles, micro-status tags, and quick-add counters.
- **Content Panels & Product Cards (`rounded-2xl` / `16px`):** Standard inventory cards, store directory cells, and glassmorphic HUD clusters.
- **Overlays, Large Containers & Map Views (`rounded-3xl` / `24px`):** The interactive map viewport, modal alert containers, and customer cart drawers.

## Components

### Buttons & Interactive Triggers
- **Primary Commercial Action:** High-saturation emerald (`#10b981`) surface, text pure white (`#ffffff`), `font-semibold`, radius `rounded-xl` or `rounded-full`, min-height `44px`. Micro-interaction applies a shimmering horizontal gloss sweep on highlight and scales down to `0.98` on press.
- **Secondary Outlined:** Border `1.5px solid #10b981`, background transparent, text `#047857`. Hover transitions to `#ecfdf5`.
- **Mode Segmented Switcher:** Encapsulated in a `rounded-full` glassmorphic pill track (`p-1.5`, `bg-white/80`). Inactive pills render `#64748b` text; active mode triggers smooth spring translation into solid emerald with pure white text and soft emerald glow.

### Store & Bento Product Cards
- **Directory Store Card:** Encased in `rounded-2xl` with a crisp `border border-slate-100`. Features an aspect-ratio store cover banner, an overlapping circular brand badge, clear distance metrics (`📍 A 120m`), an open-status indicator with pulsating radar dot, a horizontal strip of 3 mini-product cards with prices, and a full-width emerald action button.
- **Product Listing Cell:** Compact layout with product thumbnail, floating amber discount pill (if applicable), high-contrast pricing in `Outfit`, and integrated `+`/`-` quantity stepper controls meeting touch criteria.

### Cart Drawer & WhatsApp Conversion Flow
- **Cart Sheet:** Slides from screen-right with cubic entry curve (`cubic-bezier(0.16, 1, 0.3, 1)`). Displays selected items, real-time VeciPuntos calculation bar, apartment/tower delivery badge, and payment-choice tabs (QR/Transfer, Cash, Card).
- **Direct WhatsApp Conversion Button:** Fixed full-width bottom trigger in `#10b981` paired with the official WhatsApp icon. Compiles items, recipient tower/apartment number, and delivery mode into an encoded URL parameter string on press.

### Real-Time Merchant Kanban Board
- **Board Grid:** 4-column fluid horizontal pipeline (`Pendiente` 🟡, `En Preparación` 🔵, `En Camino` 🟣, `Entregado` 🟢).
- **Kanban Order Card:** Crisp white surface with colored left status border (3px). Features timestamp, customer identity, apartment coordinates, expandable item checklist, and a 1-tap progression button.
- **Audio Feedback:** Real-time incoming order events trigger an HTML5 audio playback (`Notificacion de orden de compra.mp3`) paired with a visual pulse across the column counter.

### Interactive Neighborhood Map
- **Map Viewport:** Framed in `rounded-3xl` with an inset `border border-slate-200`. Uses pastel-toned spatial tiles with marked condominium parcel outlines.
- **Markers:** Blue pulsing sonar ring for user geolocation (*"Tú estás aquí"*); custom emerald pin badges with store glyphs for active minimarkets, triggering a glassmorphic preview tooltip on selection.

### Form Inputs & Search Fields
- **Hyperlocal Search Bar:** `56px` height container with `rounded-2xl` bounds, `bg-white`, and `border border-slate-200`. Houses search input with icon, vertical separator, inline zone dropdown (`📍 Todas las Zonas ▾`), and primary search action button.
- **Standard Input Fields:** Background `#f1f5f9`, transitioning to white with a `2px solid #10b981` ring on focus.