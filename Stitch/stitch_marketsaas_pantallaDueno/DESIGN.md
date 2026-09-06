---
name: Hyperlocal Glassmorphism
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
  primary-dark: '#047857'
  primary-soft: '#ecfdf5'
  accent-gold-soft: '#fef3c7'
  canvas-snow: '#f8fafc'
  surface-neutral-subtle: '#f1f5f9'
  text-muted: '#64748b'
  surface-card-dark: '#1e293b'
  status-pending: '#f59e0b'
  status-preparing: '#3b82f6'
  status-delivering: '#8b5cf6'
  status-delivered: '#10b981'
  status-danger: '#ef4444'
  whatsapp-action: '#25d366'
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
  touch-min: 44px
  gutter-mobile: 0.75rem
  gutter-tablet: 1rem
  gutter-desktop: 1.5rem
  container-max: 1280px
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.25rem
  space-2xl: 1.5rem
  space-3xl: 2rem
---

## Brand & Style

The design system drives a multi-tenant hyperlocal commerce ecosystem built for residential towers, condominium communities, and neighborhood minimarkets. It balances the high-velocity operational ergonomics of modern quick-commerce software with the trustworthy, approachable warmth of buying from a familiar neighbor.

The visual direction follows **Modern Clean Glassmorphism**:
- Ultra-clean, luminous canvas anchored by an airy Snow Grey base (`#f8fafc`).
- Translucent frosted glass panels featuring dual-layer backdrop blurs (`backdrop-blur-md` to `backdrop-blur-xl`) and hairline translucent borders that mirror contemporary architectural interiors.
- A signature Emerald Green brand accent conveying freshness, inventory availability, and frictionless neighborhood logistics, elevated with Amber Gold tokens representing community rewards (VeciPuntos).
- Purpose-built for high-speed touch interactions with tactile feedback, dedicated ergonomic tap zones (minimum 44px hit bounds), and rapid WhatsApp order-routing flows.

## Colors

The color palette centers on functional clarity and high-contrast scanning across sunlight-lit mobile store aisles and fast-paced cashier terminals.

### Core Roles
- **Primary (`#10b981`)**: Brand pulse. Applied to primary checkout CTA surfaces, online/open status pills, map store pins, and interactive progress bars.
- **Secondary (`#f59e0b`)**: Gamification and community incentive engine. Powers VeciPuntos loyalty tags, customer star ratings, and pending operational alerts.
- **Tertiary (`#059669`)**: Deep emerald for hover/active click feedback, text link hover states, and emphasized category headers.
- **Neutral (`#0f172a`)**: Deep slate for high-priority typography, high-impact modal headers, and spectator navigation surfaces.

### Operational State Tokens
- **Kanban Pendiente**: `#f59e0b` paired with surface tint `#fef3c7`.
- **Kanban Preparando**: `#3b82f6` paired with surface tint `#eff6ff`.
- **Kanban En Camino**: `#8b5cf6` paired with surface tint `#f5f3ff`.
- **Kanban Entregado**: `#10b981` paired with surface tint `#ecfdf5`.
- **Critical Stock / Cerrado**: `#ef4444` paired with surface tint `#fef2f2`.
- **WhatsApp Finalization**: `#25d366` reserved exclusively for direct customer-to-merchant conversational checkout handoff.

## Typography

The typography pairs **Outfit** for structural and architectural presence with **Plus Jakarta Sans** for mobile legibility.

- **Headlines & Display (Outfit)**: Tight, geometric proportions bring a structured storefront aesthetic to hero titles, catalog category headlines, and cashier counters. Negative letter-spacing prevents visual bloat on narrow mobile viewports.
- **Body & Controls (Plus Jakarta Sans)**: Generous counters and clear apertures provide instant readability across product listings, condo unit labels (e.g., *Torre B - Depto 402*), and live order status tickers.
- **Numbers & Monetary Scans**: All unit prices, shopping basket running totals, and cash denomination buttons must employ `headline-md` or `headline-sm` with `fontWeight: 700` to minimize operational errors during counter sales.

## Layout & Spacing

The system runs on a mobile-first, 4px/8px-aligned fluid grid transitioning into a balanced Bento split-screen model on desktop viewports.

### Breakpoints & Layout Adapters
- **Mobile (< 640px)**: Single column with edge gutters of `12px` (`gutter-mobile`). Split views (Directory vs. Map) switch via a dual pill segmented toggle (`[📋 Tiendas] | [🗺️ Mapa]`). Floating bottom cart capsule anchored at `bottom: 16px`.
- **Tablet (640px - 1023px)**: 2-to-3 column dynamic grid with `16px` gutters. Modals anchor as centered sheets constrained to `max-w-lg` or `max-w-2xl`.
- **Desktop (≥ 1024px)**: 
  - Store Directory utilizes a fixed-ratio split: 45% scrollable store/product inventory list on the left, paired with a 55% sticky interactive neighborhood map canvas on the right (`min-h-[650px]`).
  - Maximum central content container bound to `1280px` with horizontal page margin padding `px-4 sm:px-6 lg:px-8`.
  - Merchant Dashboard organizes into a 4-column responsive horizontal Kanban pipeline (`min-w-[280px]` per stage) with horizontal drag-scroll on intermediate displays.

All touch interaction surfaces adhere strictly to `touch-min` (`44px` height and width minimum) to ensure zero tap misses during outdoor handheld operation.

## Elevation & Depth

Visual depth is achieved through layered frosted-glass tiers, translucent acrylic surfaces, and slate-tinted ambient drop shadows rather than heavy structural divider borders.

### Surface Elevation Hierarchy
- **Level 1 (Foundation Canvas)**: Snow Grey (`#f8fafc`), flat base without shadow.
- **Level 2 (Standard Content Cards)**: White card substrate with subtle boundary (`border: 1px solid #f1f5f9`), lifted by `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Frosted Glass Panels & Sticky Headers)**: Translucent white `rgba(255, 255, 255, 0.85)` underpinned by `backdrop-filter: blur(16px)` and `-webkit-backdrop-filter: blur(16px)`. Bordered by a hairline translucent rim (`1px solid rgba(226, 232, 240, 0.8)`) and ambient shadow `box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.05)`.
- **Level 4 (Flyout Drawers, Modals & Cart Capsules)**: High-opacity white `rgba(255, 255, 255, 0.96)` layered over an ambient backdrop dimming scrim (`rgba(15, 23, 42, 0.45)` with `backdrop-blur-sm`). Elevated by deep volumetric shadow `box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.22)`.

## Shapes

The geometric personality features soft, modern rounding that reinforces welcoming community commerce:

- **Buttons, Text Inputs, and Dropdowns**: `rounded-xl` (`0.75rem` / `12px`), providing ergonomic tap boundaries.
- **Product Cards, Store Tiles, and Kanban Columns**: `rounded-2xl` (`1rem` / `16px`), framing complex card metadata smoothly.
- **Modals, Floating Drawers, and Interactive Map Enclosures**: `rounded-3xl` (`1.5rem` / `24px`), reflecting modern mobile OS bottom sheets.
- **Status Badges, Filter Chips, Stepper Controls, and Mode Switchers**: `rounded-full` (`9999px`) for high-contrast scanning.

## Components

### Buttons
- **Primary CTA**: Height `48px` minimum, `rounded-xl`, gradient surface `linear-gradient(135deg, #10b981 0%, #059669 100%)`, text `label-lg` white. Hover: brightness transition and `translate-y-[-1px]`. Active: `scale(0.98)`.
- **WhatsApp Order Closing Button**: Height `52px`, `rounded-xl`, saturated WhatsApp green (`#25d366`), white bold text, displaying leading chat bubble icon and dynamic order total pinned to the trailing edge.
- **Secondary & POS Quick-Cash**: Height `44px`, `rounded-xl`, surface `#f1f5f9`, slate text `#0f172a`, active border highlight in `#10b981`.

### Category Chips & Mode Switchers
- Height `40px` with `44px` transparent tap area, `rounded-full`, horizontal flex layout.
- Inactive: Background `rgba(255, 255, 255, 0.9)`, border `1px solid #e2e8f0`, text `#64748b`.
- Active: Background `#10b981`, border `1px solid #10b981`, white text, shadow `0 4px 12px rgba(16, 185, 129, 0.25)`.

### Input Fields & Search Bars
- Height `48px` (Search bar: `56px`), `rounded-xl` (Search bar: `rounded-2xl`), surface `#ffffff`, border `1.5px solid #e2e8f0`.
- Focus state: Border color `#10b981` with ring halo `0 0 0 3px rgba(16, 185, 129, 0.15)`. Leading icon slot anchored in `#64748b`.

### Product & Storefront Cards
- Frosted surface (`rgba(255, 255, 255, 0.85)`), `rounded-2xl`, border `1px solid rgba(226, 232, 240, 0.8)`.
- Top-left badge: Discount pill (`#ef4444` background, white uppercase text).
- Top-right badge: VeciPuntos multiplier (`#fef3c7` background, `#f59e0b` text and sparkles).
- Stepper button: When `0`, display `+ Añadir` pill (`rounded-full`, `#ecfdf5` background, `#047857` text). When `> 0`, expand to inline numeric counter flanked by `-` and `+` touch circles.

### Kanban Pipeline Cards (Merchant Dashboard)
- Compact `rounded-xl` container with a `4px` left vertical status indicator rail corresponding to the active state color (`#f59e0b`, `#3b82f6`, `#8b5cf6`, or `#10b981`).
- Apartment / Delivery destination in bold `headline-sm`, SKU checklist with toggleable completion states, and an instant one-tap state advancement button.

### Floating Mobile Cart Drawer & Bar
- **Persistent Bottom Capsule**: Floating `16px` above viewport bottom on mobile, dark glass surface (`rgba(15, 23, 42, 0.94)` with `backdrop-blur-md`), `rounded-2xl`, displaying running total, counter badge, and forward arrow.
- **Cart Drawer**: Slides smoothly (`cubic-bezier(0.16, 1, 0.3, 1)`) from bottom (mobile) or right (desktop), featuring VeciPuntos progress bar, delivery location selector, and WhatsApp order submission.