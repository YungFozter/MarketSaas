# MarketSaaS — Design System & UI/UX Specifications

Este documento define la arquitectura visual, tokens de diseño, jerarquía de componentes, lineamientos de experiencia de usuario (UX) y especificaciones de pantalla para **MarketSaaS**, la plataforma hiperlocal de comercio para tiendas de barrio, minimarkets y condominios.

---

## 1. Visión y Filosofía de Diseño

* **Propósito:** Conectar a los residentes de condominios y barrios con sus minimarkets de cercanía a través de una experiencia ágil, visualmente atractiva y libre de comisiones abusivas.
* **Enfoque:** *Mobile-First*, navegación fluida con una sola mano, accesibilidad táctil y cierre inmediato de compras vía WhatsApp.
* **Tono Visual:** Fresco, confiable, moderno y comunitario (*Emerald & Slate* con toques de *Amber Gold*).

---

## 2. Design Tokens & Fundamentos Visuales

### 2.1. Paleta de Colores

| Token | Código HEX | Uso / Semántica |
| :--- | :--- | :--- |
| `primary-500` | `#10b981` | Marca principal, botones CTA, badges de estado "Abierto". |
| `primary-600` | `#059669` | Hover de botones primarios, enlaces activos, acentos visuales. |
| `primary-700` | `#047857` | Cabeceras de gradiente, bordes destacados. |
| `primary-50` | `#ecfdf5` | Fondos de badges activos, contenedores suaves. |
| `accent-gold` | `#f59e0b` | Sistema de fidelización (VeciPuntos), estrellas, advertencias. |
| `accent-light` | `#fef3c7` | Fondos de badges de puntos y ofertas especiales. |
| `neutral-900` | `#0f172a` | Textos de encabezados (H1-H4), botones de acción de dueños. |
| `neutral-800` | `#1e293b` | Fondos de tarjetas de demostración y texto de cuerpo principal. |
| `neutral-500` | `#64748b` | Textos secundarios, descripciones y micro-etiquetas. |
| `neutral-100` | `#f1f5f9` | Fondos de inputs, divisores y barras de desplazamiento. |
| `neutral-50` | `#f8fafc` | Fondo general de la aplicación (*Snow Grey*). |
| `danger-500` | `#ef4444` | Badges de stock crítico, alertas y botón de cancelar. |

### 2.2. Tipografía

* **Headings (Títulos):** `'Outfit', sans-serif`
  * Jerarquía: H1 (`text-3xl` a `text-6xl`, `font-extrabold`), H2 (`text-2xl` a `text-3xl`), H3 (`text-xl` a `text-2xl`).
* **Body & UI (Texto General):** `'Plus Jakarta Sans', sans-serif`
  * Textos principales: `text-sm` a `text-base` (`font-semibold` / `font-medium`).
  * Micro-copia & Badges: `text-[10px]` a `text-xs` (`font-bold`).

### 2.3. Espaciado y Escala Proporcional (Responsive Layout)

* **Contenedores Principales:** `max-w-7xl mx-auto` con padding lateral dinámico `px-4 sm:px-6 lg:px-8`.
* **Márgenes y Gaps:**
  * Móvil (< 640px): `p-3`, `py-4`, `gap-3`.
  * Tablet (640px – 1024px): `p-5`, `py-6`, `gap-4`.
  * Escritorio (> 1024px): `p-6`, `py-8`, `gap-6`.
* **Áreas Táctiles Mínimas:** Mínimo **44px × 44px** (o padding `px-4 py-2.5`) para evitar toques accidentales en pantallas móviles.

### 2.4. Elevación y Efectos (Glassmorphism & Depth)

* **Glass Cards (`.spectator-glass-card` / `.glass-panel`):**
  * Fondo: `rgba(255, 255, 255, 0.88)`.
  * Filtro: `backdrop-filter: blur(16px)`.
  * Borde: `1px solid rgba(226, 232, 240, 0.9)`.
  * Sombra: `0 10px 30px -10px rgba(15, 23, 42, 0.06)`.
* **Animaciones de Transición:**
  * `@keyframes float-slow`: Efecto de levitación suave (5s) para tarjetas destacadas.
  * `@keyframes shimmer-sweep`: Reflejo sutil de carga y brillo en botones clave.
  * `@keyframes fade-in-up`: Entrada fluida de vistas y modales con curva `cubic-bezier(0.16, 1, 0.3, 1)`.

---

## 3. Especificación Detallada de Pantallas

### 📱 Pantalla 1: Vista Espectador / Landing Informativa (`SpectatorHome`)
* **Ubicación:** Ruta raíz (`/`) al ingresar a `https://marketsaas.onrender.com`.
* **Objetivo:** Presentar el ecosistema SaaS a compradores, comerciantes y administradores de condominios.
* **Componentes:**
  1. **Top Promotion Bar:** Indicador de frescura 100% y switch de 3 modos: `[✨ Info] [🛍️ Cliente] [🏪 Dueño]`.
  2. **Hero de Bienvenida:**
     * Badge flotante animado: *"Plataforma SaaS Hiperlocal para Barrios y Condominios"*.
     * Título con gradiente esmeralda.
     * CTAs primarios: *"Explorar Tienda Demo"* (lleva a la tienda) y *"Panel de Acceso"* (desplaza al login).
     * Ticker de métricas: Entregas 15 min, 0% comisiones, 100% tiempo real, arquitectura multi-tenant.
  3. **Demostrador Interactivo en 3 Dimensiones:**
     * Selector por pestañas: **Para Residentes**, **Para Comerciantes**, **Para Condominios**.
     * Mockup dinámico con previsualización del teléfono del cliente vs. panel de ventas del dueño.
  4. **Panel de Acceso Integrado:** Card conmutadora de Login y Registro de Tienda en 2 pasos.

---

### 🔐 Pantalla 2: Portal de Acceso y Onboarding (`AuthModal`)
* **Objetivo:** Autenticación fluida de dueños de tienda existentes y creación de nuevas tiendas multi-tenant.
* **Componentes:**
  * **Pestaña Iniciar Sesión:**
    * Input Email + Input Contraseña con iconos integrados.
    * Botón de ingreso directo y validación de errores visual.
  * **Pestaña Crear mi Tienda (Onboarding en 2 Pasos):**
    * *Paso 1:* Nombre del dueño, correo de acceso y contraseña (mínimo 6 caracteres).
    * *Paso 2:* Nombre comercial del minimarket, enlace único (`market/mi-tienda`) y teléfono/WhatsApp de pedidos.
    * Disparo de confeti festivo (`canvas-confetti`) tras la creación exitosa y redirección automática al panel del dueño.

---

### 🛒 Pantalla 3: Catálogo del Cliente / Storefront (`CustomerHome`)
* **Objetivo:** Experiencia de compra ágil para residentes de la comunidad.
* **Componentes:**
  1. **Store Header:** Logo del minimarket, nombre de la tienda, badge dinámico *"Abierto / Cerrado"*.
  2. **Selector de Ubicación:** Modal desplegable para indicar Condominio, Torre/Bloque y Número de Departamento.
  3. **Filtros por Categoría:** Carrusel horizontal táctil con botones píldora (*Bebidas, Lácteos, Abarrotes, Limpieza, etc.*).
  4. **Barra de Búsqueda:** Input predictivo con limpieza rápida.
  5. **Grid de Productos:**
     * Tarjeta de producto con foto optimizada, precio tachado (ofertas), badge de stock bajo y selector numérico de cantidad.
     * Botón flotante para pedir productos que falten en el catálogo (*"Pídelo si no está"*).
  6. **Botón Flotante de Carrito:** Indicador con badge de cantidad animado y total acumulado.

---

### 🛍️ Pantalla 4: Carrito Lateral y Checkout a WhatsApp (`CartDrawer` & `CheckoutModal`)
* **Objetivo:** Transformar el carrito en un pedido formateado para WhatsApp en un clic.
* **Componentes:**
  * **Drawer Lateral (`CartDrawer`):**
    * Lista interactiva de productos con controles `+` / `-` y eliminación.
    * Barra de puntos de lealtad (VeciPuntos) que se ganarán con la compra.
    * Switch de modo de entrega: `[Delivery a Puerta / Conserjería] | [Retiro en Tienda]`.
    * Desglose de precios: Subtotal, Descuentos por cupón, Costo de envío y Total.
  * **Modal de Cierre (`CheckoutModal`):**
    * Formulario de datos de contacto (nombre, teléfono y confirmación de departamento).
    * Selector de método de pago: `[Efectivo] | [QR / Transferencia] | [Tarjeta]`.
    * Botón *"Enviar Pedido por WhatsApp"* que genera un mensaje pre-estructurado con emojis, items, dirección y monto total.

---

### 📊 Pantalla 5: Panel de Gestión del Comerciante (`AdminHome`)
* **Objetivo:** Control operativo y en tiempo real para el comerciante.
* **Componentes:**
  1. **Tarjetas de KPIs:** Ventas del Día, Pedidos Totales, Ticket Promedio y Productos con Stock Crítico.
  2. **Tablero Kanban de Pedidos en Vivo:**
     * Columnas: `Pendientes` 🟡, `En Preparación` 🔵, `En Camino` 🟣, `Entregados` 🟢.
     * Notificación acústica de nuevo pedido en tiempo real vía Supabase Realtime.
     * Botones de avance de estado de pedido en un toque.
  3. **Control de Inventario:**
     * Tabla con ajuste rápido de precios, control de stock y switch de producto visible/oculto.
     * Modal de creación y edición de productos.
  4. **Exportación Contable:** Botón para generar y descargar reportes de ventas completos en formato `.CSV`.
  5. **Personalización de Marca:** Configuración de nombre, teléfono de WhatsApp, colores corporativos y horarios de atención.

---

## 4. Matriz de Componentes y Jerarquía de Carpetas

```
src/
├── components/
│   ├── admin/             # Módulos del Comerciante
│   │   ├── AdminHome.jsx & .css
│   │   ├── OrdersKanban.jsx & .css
│   │   ├── ProductTable.jsx & .css
│   │   └── StoreSettings.jsx & .css
│   ├── auth/              # Módulos de Acceso y Registro
│   │   └── AuthModal.jsx & .css
│   ├── common/            # Componentes Compartidos Globales
│   │   ├── Navbar.jsx & .css
│   │   └── Toast.jsx & .css
│   ├── customer/          # Módulos de Compra del Residente
│   │   ├── CustomerHome.jsx & .css
│   │   ├── CartDrawer.jsx & .css
│   │   ├── CheckoutModal.jsx & .css
│   │   ├── LocationModal.jsx & .css
│   │   ├── LoyaltyPointsModal.jsx & .css
│   │   ├── OrderTrackingModal.jsx & .css
│   │   ├── ProductCard.jsx & .css
│   │   └── RequestProductModal.jsx & .css
│   └── spectator/         # Pantalla Informativa de Bienvenida
│       └── SpectatorHome.jsx & .css
├── context/
│   └── StoreContext.jsx   # Estado reactivo, Multi-tenant y Supabase Auth
└── styles/
    └── index.css          # Tailwind CSS v4, animaciones globales y reset
```

---

## 5. Parámetros para Modelado en Google Stitch / Figma

Para alimentar modelos generativos de UI en herramientas como **Google Stitch**, utiliza los siguientes prompts base:

> **Prompt para Google Stitch (Spectator View):**
> *"Modern SaaS landing page for a hyperlocal grocery platform called MarketSaaS. Dark slate background (#0f172a) combined with clean snow-grey surfaces (#f8fafc) and vivid emerald accents (#10b981). Glassmorphism feature cards with soft glowing borders. Hero section featuring an animated platform badge, H1 title 'El comercio de cercanía, digitalizado', dual CTA buttons for 'Explorar Tienda Demo' and 'Panel de Acceso', a 4-card metric ticker, and an interactive 3-tab perspective simulator comparing Shopper Mobile View with Merchant Realtime Kanban Dashboard. 100% responsive, mobile-first design with rounded-2xl cards."*

> **Prompt para Google Stitch (Storefront View):**
> *"Clean mobile-first e-commerce storefront for a neighborhood minimarket. Top navigation showing store name, an 'Abierto' status badge, a condo apartment delivery selector ('Torre B - Depto 402'), and an amber loyalty points counter. Horizontal scrolling category filter chips, search input, and a responsive product grid showing vibrant food photos, discount badges, price in local currency, and quick add-to-cart buttons. Floating shopping bag counter with emerald glow."*

> **Prompt para Google Stitch (Merchant Admin Dashboard):**
> *"Professional real-time merchant management dashboard. Top row displaying 4 key metrics: Today's Revenue, Active Orders, Average Ticket, and Low Stock Alerts. Main section with an interactive 4-column Kanban board for live orders (Pending, Preparing, Out for Delivery, Delivered) featuring status chips, customer details, and quick action buttons. Floating secondary actions for CSV export and store settings."*
