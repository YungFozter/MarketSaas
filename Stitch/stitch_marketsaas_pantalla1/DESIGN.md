---
name: Hyperlocal Community Commerce
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#006c4a'
  on-tertiary: '#ffffff'
  tertiary-container: '#3eb686'
  on-tertiary-container: '#00422c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
  primary-700: '#047857'
  primary-50: '#ecfdf5'
  accent-gold-light: '#fef3c7'
  neutral-surface: '#f8fafc'
  neutral-card: '#ffffff'
  neutral-subtle: '#f1f5f9'
  neutral-text-muted: '#64748b'
  neutral-card-dark: '#1e293b'
  status-pending: '#f59e0b'
  status-preparing: '#3b82f6'
  status-delivering: '#8b5cf6'
  status-completed: '#10b981'
  status-danger: '#ef4444'
  whatsapp-green: '#25d366'
typography:
  display-hero:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 54px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
  label-badge:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '800'
    lineHeight: 12px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  touch-target-min: 44px
  space-xs: 4px
  space-sm: 8px
  space-md: 12px
  space-lg: 16px
  space-xl: 20px
  space-2xl: 24px
  space-3xl: 32px
  gutter-mobile: 12px
  gutter-tablet: 16px
  gutter-desktop: 24px
  max-content-width: 1280px
---

## Brand & Style

This design system powers a multi-tenant hyperlocal commerce engine connecting residential complexes, gated communities, and neighborhood minimarkets directly with neighbors. The brand personality balances hyper-speed convenience with warm, community-driven trust: it feels like buying from a neighbor you know well, powered by modern consumer-grade software.

The aesthetic philosophy is **Modern Clean Glassmorphism**:
- Ultra-crisp typography and airy snow-slate backgrounds.
- Layered frosted-glass panels (`backdrop-filter: blur(16px)`) with hairline translucent borders that echo high-end residential architecture.
- Vibrant emerald accents signaling freshness, rapid delivery, and neighborhood vitality, paired with amber gold tokens representing community loyalty ("VeciPuntos").
- Built strictly Mobile-First with ergonomic single-hand tap zones (minimum 44px hit targets) and tactile visual micro-feedback optimized for quick WhatsApp order dispatch.

## Colors

The system employs a fresh, hyper-legible color architecture centered on Emerald Green, Slate Neutrals, and Amber Gold accents.

### Role Assignments
- **Primary (`#10b981`)**: The active heartbeat of the application. Dictates primary action buttons, open storefront badges, dynamic cart badges, and checkout progress states.
- **Secondary (`#f59e0b`)**: The community loyalty and reward color ("VeciPuntos"), rating stars, and time-sensitive order state notifications.
- **Tertiary (`#059669`)**: Deeper emerald shade utilized for pressed and hover states on interactive primary surfaces, along with high-contrast text links.
- **Neutral (`#0f172a`)**: Deep slate for high-contrast headline readability and administrative navigation headers.
- **Backgrounds**: The canvas foundation rests on Snow Grey (`#f8fafc`), layered with translucent cards (`#ffffff` at 88% opacity) and cool divider lines (`#f1f5f9`).

### Operational Status Palette (Kanban & Storefront)
- **Pending (🟡)**: `#f59e0b` paired with `#fef3c7` container.
- **Preparing (🔵)**: `#3b82f6` paired with `#eff6ff` container.
- **Out for Delivery (🟣)**: `#8b5cf6` paired with `#f5f3ff` container.
- **Delivered (🟢)**: `#10b981` paired with `#ecfdf5` container.
- **Critical Stock / Alert (🔴)**: `#ef4444` paired with `#fef2f2` container.
- **WhatsApp Direct Action**: `#25d366` designated exclusively for the outbound WhatsApp checkout trigger.

## Typography

The typographic system utilizes a high-personality pairing:
- **Display & Headings:** `Outfit` provides a geometric, friendly, and structured storefront feel. Tight letter-spacing keeps titles compact and punchy on small smartphone viewports.
- **Body & Labels:** `Plus Jakarta Sans` delivers open counters, high x-height, and legibility at glancing speeds while customers navigate product aisles or merchants review Kanban orders on handheld devices.

### Microcopy and Pricing Tokens
- Currency amounts rely on `headline-md` or `headline-sm` with `font-bold` for rapid scanning.
- Discontinued or crossed-out original prices use `body-sm` with strike-through styling in `#64748b`.
- Operational micro-badges (e.g., "ABIERTO", "15 MIN", "+20 VECIPUNTOS") use `label-badge` with all-caps uppercase styling and extra letter-spacing.

## Elevation & Depth

Visual hierarchy uses frosted glassmorphism backed by ambient, slate-tinted drop shadows rather than heavy borders or opaque planar stacking.

### Surface Tiers
- **Tier 0 (Canvas Base):** Snow Grey (`#f8fafc`), flat, non-elevated.
- **Tier 1 (Frosted Surfaces / Default Cards):** Background `rgba(255, 255, 255, 0.88)` with `backdrop-filter: blur(16px)`, outlined by a translucent structural border `1px solid rgba(226, 232, 240, 0.9)`, and an ambient shadow `0 10px 30px -10px rgba(15, 23, 42, 0.06)`.
- **Tier 2 (Interactive Floating Modules / Hover States):** Lifted card transformation (`translateY(-2px)`), backed by `0 14px 36px -8px rgba(16, 185, 129, 0.12)` imparting a subtle brand emerald aura.
- **Tier 3 (Drawers, Modals, Sticky Floating CTAs):** Solid/high-density white `rgba(255, 255, 255, 0.96)` with `backdrop-filter: blur(20px)`, framed by `0 20px 45px -12px rgba(15, 23, 42, 0.18)` and an overlay scrim of `rgba(15, 23, 42, 0.45)`.

## Shapes

The design system maintains a generous, organic roundness level (`roundedness: 2`) that reinforces neighborliness, comfort, and approachable touch interactions:
- **Base Components (Inputs, Buttons, Badges):** `rounded-xl` (`0.75rem` / `12px`) providing comfortable touch wells.
- **Content Cards (Product Cards, Kanban Columns, Auth Panels):** `rounded-2xl` (`1rem` to `1.25rem` / `16px - 20px`).
- **Hero Banners & Modals:** `rounded-3xl` (`1.5rem` / `24px`) matching modern mobile operating system sheets.
- **Category Filter Chips & Quantity Steppers:** Fully pill-shaped (`rounded-full` / `9999px`).

## Components

### 1. Buttons
- **Primary Action (CTA):** Height `48px`, background `linear-gradient(135deg, #10b981 0%, #059669 100%)`, white bold typography (`label-lg`), `rounded-xl`. Pressed state scales down smoothly to `scale(0.98)` with an inner shadow.
- **WhatsApp Checkout Button:** Dedicated high-conversion button in brand WhatsApp Green (`#25d366`), with WhatsApp bubble icon preceding the text and dynamic live order total right-aligned.
- **Secondary / Ghost:** Height `44px`, background `rgba(241, 245, 249, 0.8)`, text `#1e293b`, subtle hover border `rgba(16, 185, 129, 0.4)`.

### 2. Category Chips & Horizontal Filters
- Pill-shaped (`rounded-full`), height `40px` (with `44px` invisible tap margin), horizontal scroll bar hidden (`scrollbar-none`).
- Inactive state: `rgba(255, 255, 255, 0.9)` background with slate text `#64748b` and hairline border.
- Active state: `#10b981` background with crisp white text, light emerald drop shadow.

### 3. Product Card
- Frosted glass container (`rounded-2xl`) with `1:1` aspect-ratio image display, lazy loaded.
- Floating top badges: Discount tag (`#ef4444` pill) top-left; VeciPuntos tag (`#f59e0b` pill) top-right.
- Quantity selector: Compact pill stepper with round `-` and `+` triggers enclosing a bold numeric count. When item count is `0`, a single green `+ Añadir` pill is displayed.

### 4. Kanban Order Cards (Merchant Dashboard)
- Compact cards (`rounded-xl`), bordered by state color on the left vertical spine (`4px` thick).
- Header row: Order ID (`#0402`), apartment designation (`Torre B - Depto 402`), and elapsed live timer.
- Item summary: Bulleted short list of SKUs with quantity badges.
- Single-tap progress button: Advances order seamlessly (`Pendiente` ➔ `Preparando` ➔ `En Camino` ➔ `Entregado`) with instantaneous optimistic UI update.

### 5. Input Fields & Form Controls
- Height `48px`, background `#f8fafc`, border `1.5px solid #e2e8f0`, `rounded-xl`.
- Focus state: Border transitions to `#10b981` accompanied by a soft glow ring `0 0 0 3px rgba(16, 185, 129, 0.15)`.
- Integrated leading icons (condo locator, search magnifying glass, or currency symbol) anchored in muted slate `#64748b`.

### 6. Cart Drawer & Floating Cart Capsule
- **Floating Cart Capsule (Mobile):** Sticks to bottom viewport (`bottom: 16px`), glassmorphism container (`rgba(15, 23, 42, 0.92)` dark glass), displaying items count, total price, and "Ver Canasta" arrow.
- **Cart Drawer:** Slides from the right (or bottom on mobile viewports), featuring an active VeciPuntos accumulation meter at the top header, item modification rows, delivery switch (`Conserjería / Puerta` vs `Retiro`), and the primary checkout trigger.