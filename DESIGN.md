# MarketSaaS — Design System & UI/UX Specifications

Este documento define la arquitectura visual, los tokens de diseño, la matriz completa de componentes, la jerarquía de carpetas, los lineamientos de experiencia de usuario (UX) y las especificaciones técnicas avanzadas para **MarketSaaS**, la plataforma hiperlocal multi-tenant de comercio para tiendas de barrio, minimarkets y comunidades en condominios.

---

## 1. Visión General y Estado del Sistema

### 1.1. Propósito y Propuesta de Valor
**MarketSaaS** es un sistema web progresivo (PWA Ready) diseñado para digitalizar el comercio barrial e intrainmueble. Permite a los residentes pedir abarrotes y productos de consumo diario directamente a su minimarket más cercano con entregas en 15-30 minutos y **0% de comisiones por transacción**, cerrando las compras a través de pedidos pre-formateados de WhatsApp o gestionando ventas directas en mostrador con caja POS.

### 1.2. Arquitectura de Navegación y Vistas (Switch de 4 Modos)
El sistema opera bajo un esquema reactivo con **4 modos principales de vista** gestionados centralizadamente desde el [StoreContext](file:///e:/Proyectos/MarketSaaS/src/context/StoreContext.jsx) y orquestados en [App.jsx](file:///e:/Proyectos/MarketSaaS/src/App.jsx):

1. **Modo Espectador (`spectator`) / Pantalla 1 (Landing & Modo Demostración):** Landing page informativa de alto impacto visual con simulador 3D interactivo para prospectos, comerciantes y administradores de condominios.
2. **Modo Cliente / Vecino (`customer`) / Pantalla 3:** Experiencia hiperlocal en dos etapas integradas:
   * **Nivel 1 — Directorio & Mapa Hiperlocal (`StoreDirectory`):** Descubrimiento de minimarkets en tiempo real con mapa interactivo Leaflet de condominios, filtros por apertura, delivery, retiro, medios de pago y distancias precisas.
   * **Nivel 2 — Catálogo de Minimarket (`CustomerHome`):** Storefront e-commerce optimizado para compras móviles ágiles con selección de departamento/torre, catálogo interactivo, lealtad con VeciPuntos, horarios de atención y checkout con soporte de Pago Combinado.
3. **Modo Dueño / Comerciante (`admin`) / Pantalla 5:** Panel de administración multi-módulo en tiempo real con Tablero Kanban de pedidos en vivo, alertas acústicas (Web Audio API y MP3), terminal de caja registradora POS, control de fiados ("Cuaderno de Créditos"), gestión de proveedores, arqueo de caja, inventario dinámico, kit de impresión con QR y exportación contable en Excel.
4. **Modo Plataforma / SuperAdmin (`superadmin`) / Pantalla 6:** Centro de mando maestro para los administradores globales de MarketSaaS. Permite supervisar todos los tenants, generar y gestionar códigos de activación de suscripciones (Planes Basic y Pro), suspender o prorrogar tiendas, emitir comunicados globales por megáfono (*System Broadcast*) y utilizar el modo de suplantación (*Impersonation*) para soporte técnico directo.

---

## 2. Herramientas Visuales, Estilos, Colores y Tipografía

### 2.1. Stack Visual y Dependencias de Interfaz
* **Framework Base:** **React 19** (`react ^19.2.8`, `react-dom ^19.2.8`) sobre **Vite 8** (`vite ^8.2.0`).
* **Engine Visual & Utility-First CSS:** **Tailwind CSS v4** (`tailwindcss ^4.3.3`, `@tailwindcss/vite ^4.3.3`), configurado en `src/styles/index.css` con variables CSS modernas y animaciones `@keyframes` personalizadas.
* **Motor de Mapas Hiperlocales:** **Leaflet** (`leaflet ^1.9.4`) integrado en `NeighborhoodMap.jsx` con marcadores vectoriales personalizados, capas pastel optimizadas para barrios residenciales y cálculo de distancias Haversine.
* **Librería de Iconografía:** **Lucide React** (`lucide-react ^1.33.0`) con más de 60 iconos vectoriales temáticos para comercio, logística, administración y finanzas.
* **Generación de Hojas de Cálculo y Reportes Contables:** **SheetJS** (`xlsx ^0.18.5` y `xlsx-js-style ^1.2.0`) para exportación con celdas estilizadas, encabezados corporativos y totales automáticos.
* **Efectos de Celebración:** **Canvas Confetti** (`canvas-confetti ^1.9.4`) disparado tras la creación exitosa de tiendas y pedidos confirmados.
* **Filtros Glassmórficos:** CSS Nivel 4 `backdrop-filter: blur(12px)` a `blur(16px)` para barras de navegación pegajosas (`glass-nav`), tarjetas flotantes (`glass-panel`) y modales.
* **Sistema de Notificaciones Auditivas y Síntesis:** [orderNotificationService.js](file:///e:/Proyectos/MarketSaaS/src/services/orderNotificationService.js) combinando Web Audio API (tonos melódicos sintetizados), audio MP3 real (`Notificacion de orden de compra.mp3`) y notificaciones de escritorio / Web Push.
* **Tipografía Externa:** Google Fonts precargadas en `index.html`: **Outfit** y **Plus Jakarta Sans**.

---

### 2.2. Paleta de Colores y Tokens Semánticos

| Token | Código HEX | Valor RGBA / HSL | Uso y Semántica |
| :--- | :--- | :--- | :--- |
| `primary-500` | `#10b981` | `rgba(16, 185, 129, 1)` | Color primario de marca, botones CTA principal, badges "Abierto", pines del mapa. |
| `primary-600` | `#059669` | `rgba(5, 150, 105, 1)` | Estados hover de botones primarios, enlaces activos, acentos secundarios. |
| `primary-700` | `#047857` | `rgba(4, 120, 87, 1)` | Encabezados en gradiente esmeralda, bordes de alto contraste. |
| `primary-50` | `#ecfdf5` | `rgba(236, 253, 245, 1)` | Fondos de badges activos, contenedores de ofertas, resplandores suaves. |
| `accent-gold` | `#f59e0b` | `rgba(245, 158, 11, 1)` | Sistema de fidelización (**VeciPuntos**), estrellas de valoración, alertas de stock. |
| `accent-light` | `#fef3c7` | `rgba(254, 243, 199, 1)` | Fondos para recompensas, ofertas relámpago y tags de saldo a favor. |
| `indigo-600` | `#4f46e5` | `rgba(79, 70, 229, 1)` | Acentos del panel SuperAdmin, planes Pro, insignias de verificación institucional. |
| `indigo-50` | `#eef2ff` | `rgba(238, 242, 255, 1)` | Fondos de banners de plataforma y tarjetas de códigos de activación. |
| `neutral-900` | `#0f172a` | `rgba(15, 23, 42, 1)` | Slate oscuro para títulos H1-H3, footers profesionales, headers nocturnos. |
| `neutral-800` | `#1e293b` | `rgba(30, 41, 59, 1)` | Tarjetas del simulador 3D, fondos de modales técnicos y texto de alto contraste. |
| `neutral-500` | `#64748b` | `rgba(100, 116, 139, 1)` | Texto secundario, subtítulos, etiquetas de tiempo e iconos inactivos. |
| `neutral-100` | `#f1f5f9` | `rgba(241, 245, 249, 1)` | Fondos de inputs, divisores horizontales, rieles de scrollbar. |
| `neutral-50` | `#f8fafc` | `rgba(248, 250, 252, 1)` | Fondo general de la aplicación (*Snow Grey*) y secciones de tienda. |
| `danger-500` | `#ef4444` | `rgba(239, 68, 68, 1)` | Stock crítico/agotado, alertas de cobro de fiados, badges de morosidad. |

---

### 2.3. Tipografía y Jerarquía Textual

* **Fuentes Google Fonts:**
  * **Headings (Títulos & Display):** `'Outfit', sans-serif` (Pesos: `Font-Light 300`, `Medium 500`, `Semi-Bold 600`, `Bold 700`, `Extra-Bold 800`).
  * **Body & UI (Texto General, Inputs, Botones):** `'Plus Jakarta Sans', sans-serif` (Pesos: `Regular 400`, `Medium 500`, `Semi-Bold 600`, `Bold 700`).

* **Escala Tipográfica Responsiva:**
  * `H1 (Hero Principal & Dashboards):` `text-3xl sm:text-4xl lg:text-5xl` (`leading-tight`, `font-extrabold`).
  * `H2 (Títulos de Sección & Módulos):` `text-xl sm:text-2xl lg:text-3xl` (`font-bold`, `tracking-tight`).
  * `H3 (Títulos de Tarjeta & Subsecciones):` `text-base sm:text-lg lg:text-xl` (`font-semibold`).
  * `Body Standard:` `text-sm sm:text-base` (`font-medium`, `text-slate-600`).
  * `Micro-Copia & Badges:` `text-[10px] sm:text-xs` (`font-bold`, `uppercase`, `tracking-wider`).

---

## 3. Espaciado, Escala Proporcional y Elevación

### 3.1. Espaciado y Escala Proporcional (Responsive Layout)
El diseño sigue una estrategia **Mobile-First** con escalamiento fluido:

* **Contenedores de Ancho Máximo:**
  * Vista General: `max-w-7xl mx-auto` (1280px máx) con padding lateral adapto `px-3 sm:px-6 lg:px-8`.
  * Modales y Centros de Contenido: `max-w-md` (448px), `max-w-lg` (512px), `max-w-2xl` (672px), `max-w-4xl` (896px) o `max-w-6xl` (1152px para POS/SuperAdmin).
* **Grid Proporcional & Bento:**
  * Móvil (< 640px): 1 columna (`grid-cols-1`), tarjetas apiladas, padding interno `p-3` o `p-4`.
  * Tablet (640px – 1024px): 2 columnas (`sm:grid-cols-2 md:grid-cols-3`), gaps de `gap-3` a `gap-5`.
  * Escritorio (> 1024px): 3 a 4 columnas (`lg:grid-cols-3 xl:grid-cols-4`), gaps amplios `gap-5` a `gap-6`.
* **Dimensiones Táctiles (Touch Targets):**
  * Todos los botones, iconos de interacción, modificadores de cantidad (`+`/`-`) e inputs cumplen con la norma mínima de **44px × 44px** (o paddings `py-2.5 px-4`).

### 3.2. Elevación, Sombras y Clases Glassmorphism

```css
/* src/styles/index.css */
.glass-panel {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.glass-nav {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
```

* **Capas de Profundidad:**
  * `Nivel 1 (Superficie):` `bg-slate-50` (sin sombra).
  * `Nivel 2 (Tarjetas Estándar):` `bg-white shadow-sm border border-slate-100 hover:shadow-md transition-shadow`.
  * `Nivel 3 (Paneles Glassmórficos):` `glass-panel shadow-xl shadow-slate-900/5 rounded-2xl`.
  * `Nivel 4 (Modales y Drawers):` `z-50 bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl`.

---

## 4. Especificación Detallada de Pantallas y Módulos

### 📱 Pantalla 1: MODO DEMOSTRACIÓN / Landing Espectador (`SpectatorHome`)

Punto de bienvenida y captación (`/`). Presenta la propuesta de valor con un simulador interactivo de alta fidelidad.

* **1. Top Promotion Bar & Navbar Global ([Navbar.jsx](file:///e:/Proyectos/MarketSaaS/src/components/common/Navbar.jsx)):**
  * Logo de MarketSaaS con badge dinámico *"Barrio & Condominios"*.
  * Selector de modos con pestañas píldora iluminadas: `[✨ Info]`, `[🛍️ Cliente]`, `[🏪 Dueño]` y acceso rápido a inicio de sesión / registro.
* **2. Sección Hero ([SpectatorHero.jsx](file:///e:/Proyectos/MarketSaaS/src/components/spectator/SpectatorHero.jsx)):**
  * Badge flotante animado, título H1 esmeralda, botones CTA para probar la tienda demo y ticker de métricas clave (entregas en 15 min, 0% comisiones, cobertura en condominios, Supabase Realtime).
* **3. Carrusel Promocional ([SpectatorCarousel.jsx](file:///e:/Proyectos/MarketSaaS/src/components/spectator/SpectatorCarousel.jsx)):** Banners deslizantes automáticos de promociones, VeciPuntos y ventajas logísticas.
* **4. Simulador Interactivo 3D Multidispositivo ([SpectatorShowcase.jsx](file:///e:/Proyectos/MarketSaaS/src/components/spectator/SpectatorShowcase.jsx)):**
  * **Pestaña Vecino:** Marco móvil iPhone 15 Pro con catálogo navegable, adición al carrito y vista previa del pedido a WhatsApp.
  * **Pestaña Dueño / Panel:** Mockup de tablet con botón *"Simular Nuevo Pedido"*, tablero Kanban dinámico y reproductor de audio MP3 real.
  * **Pestaña Condominios & Despacho:** Vinculación con [SpectatorDeliveryModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/spectator/SpectatorDeliveryModal.jsx) para registrar edificios residenciales y alianzas de conserjería.
* **5. Banner de Onboarding ([SpectatorOnboardingBanner.jsx](file:///e:/Proyectos/MarketSaaS/src/components/spectator/SpectatorOnboardingBanner.jsx)):** Bloque esmeralda para registro en 2 minutos sin tarjeta.
* **6. Footer Profesional & Modal Legal ([SpectatorFooter.jsx](file:///e:/Proyectos/MarketSaaS/src/components/spectator/SpectatorFooter.jsx) & [SpectatorLegalModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/spectator/SpectatorLegalModal.jsx)):** Términos, políticas de privacidad y enlaces institucionales.

---

### 🔐 Pantalla 2: Portal de Acceso y Onboarding Multi-Tenant (`AuthModal`)

Ubicado en [AuthModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/auth/AuthModal.jsx). Gestiona el ciclo completo de autenticación:
* **Pestaña Iniciar Sesión:** Validación de credenciales con indicador de carga y soporte de recuperación de contraseña con captura de tokens OTP de Supabase.
* **Pestaña Crear Tienda (Onboarding en 2 Pasos):**
  * *Paso 1:* Datos de cuenta del propietario (nombre, correo y contraseña).
  * *Paso 2:* Datos del minimarket (nombre comercial, slug para URL amigable, número de WhatsApp para pedidos y dirección).
  * *Efecto Confeti:* Disparo de ráfaga de confeti con `canvas-confetti` y redirección automática al panel del comerciante.

---

### 🛒 Pantalla 3: Experiencia Integral del Vecino / Cliente (`Customer`)

La experiencia del vecino está estructurada en **dos niveles continuos**:

#### 3.1. Nivel 1 — Directorio y Mapa Hiperlocal ([StoreDirectory.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/StoreDirectory.jsx))
* **Buscador Hiperlocal & Zonas ([StoreSearchBar.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/StoreSearchBar.jsx)):** Búsqueda por nombre de producto o minimarket y filtro por condominio.
* **Riel de Filtros Rápidos:** `[🟢 Abiertas Ahora]` con pulso verde, `[🛵 Delivery Gratis]`, `[⚡ Retiro Inmediato]`, `[💳 Aceptan QR / Transferencia]`, `[⭐ Mejor Calificadas]`, `[🎁 Club VeciPuntos]`.
* **Layout Bento Split-Screen:**
  * *Columna Izquierda (Lista de Tarjetas [StoreCard.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/StoreCard.jsx)):* Foto de fachada, horario de cierre, distancia en metros, badges de beneficios, tira de 3 productos destacados con precio y botón de acceso.
  * *Columna Derecha (Mapa Interactivo [NeighborhoodMap.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/NeighborhoodMap.jsx)):* Renderizado real con Leaflet, pin con radar del usuario (*"Tú estás aquí"*), pines esmeralda con popup de cada tienda, botón de recentrado y cambio de capa satelital/calles. Configuración desacoplada en `NeighborhoodMap.config.js` y `NeighborhoodMap.markers.js`.

#### 3.2. Nivel 2 — Storefront del Minimarket Seleccionado ([CustomerHome.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/CustomerHome.jsx))
* **Barra de Navegación y Retorno:** Botón `[🗺️ Cambiar de Tienda / Volver al Mapa]` preservando carrito y ubicación.
* **Header del Minimarket & Puntos:** Nombre de tienda, badge de apertura/cierre, horarios de atención con [CustomerStoreSchedule.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/CustomerStoreSchedule.jsx) y acumulador de VeciPuntos.
* **Selector de Ubicación en Condominio ([LocationModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/LocationModal.jsx)):** Selección de Condominio, Torre/Bloque y Número de Departamento para despachos directos a puerta o conserjería.
* **Banner Promocional ([HeroBanner.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/HeroBanner.jsx)):** Carrusel deslizante con ofertas del minimarket.
* **Filtro de Categorías ([CategoryBar.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/CategoryBar.jsx)):** Selector táctil horizontal (*Bebidas, Lácteos, Abarrotes, Limpieza, Snacks, Panadería, Ofertas*).
* **Catálogo & Tarjetas ([ProductCard.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/ProductCard.jsx) & [ProductModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/ProductModal.jsx)):** Fotografía, badges de descuento, stock crítico, selector numérico `+`/`-` y modal con detalles nutricionales y marca.
* **Horarios de Entrega ([CustomerDeliveryScheduleCard.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/CustomerDeliveryScheduleCard.jsx)):** Tarjeta con las próximas ventanas de despacho disponibles.
* **Banner de Instalación PWA ([PwaInstallBanner.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/PwaInstallBanner.jsx)):** Asistente flotante para instalar la aplicación en el dispositivo móvil o PC.
* **Petición de Faltantes ([RequestProductModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/RequestProductModal.jsx)):** Formulario para que los vecinos soliciten productos no encontrados al dueño.
* **Seguimiento en Vivo ([OrderTrackingModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/OrderTrackingModal.jsx)):** Visualizador de avance de pedido en tiempo real (*Pendiente ➔ Preparando ➔ En Camino ➔ Entregado*).
* **Footer del Storefront ([CustomerFooter.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/CustomerFooter.jsx)):** Enlaces de contacto, horario y soporte vecinal.

---

### 🛍️ Pantalla 4: Carrito Lateral y Checkout a WhatsApp con Pago Combinado

Gestionado en [CartDrawer.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/CartDrawer.jsx) y [CheckoutModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/CheckoutModal.jsx):

* **Drawer Lateral del Carrito ([CartDrawer.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/CartDrawer.jsx)):**
  * Desglose de productos seleccionados con edición de cantidades y eliminación en un toque.
  * Selector de despacho: `[🚚 Delivery a Puerta/Conserjería]` o `[🏪 Retiro en Tienda]`.
  * Cálculo dinámico de tarifa de envío según distancia/zona y cálculo de **VeciPuntos** ganados.
  * Resumen de Subtotal, Descuentos, Costo de Despacho y Total a pagar.
* **Modal de Checkout y Medios de Pago ([CheckoutModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/customer/CheckoutModal.jsx)):**
  * Formulario de nombre, teléfono y notas adicionales para el repartidor.
  * **Soporte de Pago Combinado (Mixto):** Además de `Efectivo`, `QR / Transferencia` y `Tarjeta`, permite seleccionar **Pago Combinado** al retirar en mostrador, permitiendo al cliente pagar una parte en efectivo y el resto por QR con desglose exacto de ambos montos.
  * **Generador de WhatsApp wa.me:** Formateo automático de texto estructurado con emojis, ítems, desglose de pago, dirección completa y enlace directo al chat del minimarket.

---

### 📊 Pantalla 5: Panel de Gestión del Comerciante (`AdminHome`)

Centro de operaciones del minimarket ubicado en [AdminHome.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/AdminHome.jsx), organizado en **11 pestañas de control** y un ecosistema de modales especializados:

#### Pestañas Principales de Navegación:
1. **Tablero Kanban de Pedidos en Vivo (`kanban`):**
   * 4 columnas dinámicas: `🟡 Pendientes`, `🔵 En Preparación`, `🟣 En Camino`, `🟢 Entregados`.
   * Avance de pedidos en un solo clic, cancelación, restauración o purga permanente.
   * Sistema de alerta acústica con [OrderNotificationBanner](file:///e:/Proyectos/MarketSaaS/src/components/admin/OrderNotificationBanner/OrderNotificationBanner.jsx) y [orderNotificationService.js](file:///e:/Proyectos/MarketSaaS/src/services/orderNotificationService.js).
2. **Terminal Punto de Venta POS (`pos`) — [PosTerminal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/PosTerminal.jsx):**
   * Caja registradora táctil optimizada para ventas presenciales en mostrador. Búsqueda rápida por nombre/código de barras, calculadora de cambio, venta a cuenta corriente de clientes fiados y emisión de tickets.
3. **Historial de Ventas (`sales`) — [SalesHistory.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/SalesHistory.jsx):**
   * Registro histórico de todas las transacciones (WhatsApp y POS), desglose por método de pago (incluyendo pago combinado), reimpresión de comprobantes y filtros por fecha.
4. **Cuaderno de Fiados / Créditos (`credits`) — [CreditManager.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/CreditManager.jsx):**
   * Módulo especializado para registrar clientes de confianza del barrio/condominio, anotar compras fiadas, abonar pagos parciales, calcular deuda total y generar recordatorios amigables listos para WhatsApp.
5. **Inventario Dinámico (`inventory`) — [InventoryManager.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/InventoryManager.jsx):**
   * Tabla con búsqueda en vivo, edición inline de precios y stock, selector de categorías, interruptor de visibilidad en catálogo y vinculación con [ProductCameraModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/ProductCameraModal.jsx) para fotos desde la cámara y [ProductPerformanceModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/ProductPerformanceModal.jsx) para analítica de ventas del ítem.
6. **Gestor de Proveedores (`suppliers`) — [SupplierManager.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/SupplierManager.jsx):**
   * Directorio de proveedores de abarrotes, días de visita de camiones repartidores, registro de facturas/compras y pedidos de reposición por WhatsApp.
7. **Analítica de Productos y Rendimiento (`analytics`):**
   * Métricas de rotación de stock, productos estrella, cálculo de margen comercial y horas de mayor afluencia.
8. **Solicitudes de Vecinos (`requests`) — [ProductRequestsAdmin.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/ProductRequestsAdmin.jsx):**
   * Bandeja de entrada donde el comerciante revisa los productos solicitados por los residentes para incorporarlos al catálogo con un solo clic.
9. **Horarios y Disponibilidad (`schedule`) — [StoreScheduleManager.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/StoreScheduleManager.jsx):**
   * Configuración de días de apertura, horarios continuos o partidos, descansos y botón de estado rápido "Abierto / Cerrado temporalmente".
10. **Ajustes del Minimarket (`settings`) — [StoreSettings.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/StoreSettings.jsx):**
    * Configuración de nombre, logo, número de WhatsApp oficial, dirección física, ubicación GPS en el mapa, y configuración de tarifas de despacho con [AdminDeliveryRatesModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/AdminDeliveryRatesModal.jsx).
11. **Suscripción y Plan SaaS (`subscription`) — [SubscriptionManager.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/SubscriptionManager.jsx):**
    * Visualización del plan activo (Free / Pro), días restantes, activación de planes mediante códigos provistos por la plataforma y prevención de bloqueo con [SubscriptionBlockedModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/SubscriptionBlockedModal.jsx).

#### Herramientas y Modales Auxiliares de Administración:
* **[CashRegisterModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/CashRegisterModal.jsx):** Control de apertura, arqueo de turno, ingresos/retiros manuales y cierre de caja.
* **[ExportSalesReportModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/ExportSalesReportModal.jsx):** Generador de reportes contables en Excel (`.xlsx` con estilos nativos) y CSV.
* **[StorePrintKitModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/StorePrintKitModal.jsx):** Generador e impresión de material POP con código QR para pegar en vitrinas, góndolas y ascensores.
* **[ShareStoreModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/ShareStoreModal.jsx):** Enlaces directos y banners para compartir la tienda en grupos vecinales de WhatsApp.
* **[WeeklySummaryModal.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/WeeklySummaryModal.jsx):** Resumen ejecutivo semanal con comparación de ventas contra la semana anterior.
* **[SeedCatalogModal](file:///e:/Proyectos/MarketSaaS/src/components/admin/SeedCatalogModal):** Asistente para cargar catálogos iniciales preconfigurados de abarrotes con precios sugeridos.
* **[StoreUserGuide.jsx](file:///e:/Proyectos/MarketSaaS/src/components/admin/StoreUserGuide.jsx):** Manual interactivo y guía paso a paso para el comerciante.

---

### 🛡️ Pantalla 6: Centro de Control Maestro de la Plataforma (`SuperAdminHome`)

Exclusivo para la administración central de MarketSaaS ([SuperAdminHome.jsx](file:///e:/Proyectos/MarketSaaS/src/components/superadmin/SuperAdminHome.jsx)). Cuenta con cuatro frentes operacionales:

1. **Generador y Gestor de Códigos de Activación:**
   * Creación individual o en lote de claves de activación para planes `basic` y `pro`.
   * Presets de vigencia: `30 días`, `90 días`, `180 días`, `365 días` o `5 minutos` (para demos en vivo).
   * Asignación de notas de cliente, trazabilidad de canje y exportación a planilla.
2. **Supervisión de Tiendas y Tenants Multi-Tenant:**
   * Listado en vivo de todas las tiendas registradas con buscador por nombre, dueño o slug.
   * Monitoreo de estado de suscripción (Activa, En Prueba, Próxima a Vencer, Suspendida).
   * Acciones administrativas: Añadir días extra de cortesía, suspender tienda o reactivar servicio.
3. **Modo de Suplantación (*Impersonation Mode*):**
   * Permite al SuperAdmin ingresar al panel de cualquier tienda con un solo clic para brindar soporte técnico, corregir productos o verificar pedidos, manteniendo una barra superior flotante para salir de la sesión suplantada en cualquier momento.
4. **Sistema de Difusión Global (*System Broadcast / Megáfono*):**
   * Envío de avisos prioritarios y alertas técnicas a todas las tiendas conectadas en tiempo real.

---

## 5. Matriz Completa de Componentes y Jerarquía de Carpetas (`src/`)

Estructura completa de archivos verificada contra el código fuente:

```
src/
├── App.jsx                     # Enrutador principal, gestor de modales y switch de 4 modos (Lazy de Admin y SuperAdmin)
├── App.css                     # Estilos de utilidades generales
├── main.jsx                    # Punto de entrada React 19, montaje en el DOM (#root) y StrictMode
│
├── assets/                     # Recursos gráficos e isotipos oficiales
│   ├── hero.png                # Imagen principal del Hero
│   ├── iconoPestana.png        # Favicon e icono de pestaña
│   ├── logoCompleto.png        # Logotipo horizontal oficial
│   ├── react.svg               # Vector React
│   └── vite.svg                # Vector Vite
│
├── components/
│   ├── admin/                  # 📊 MÓDULOS DE GESTIÓN DEL COMERCIANTE / DUEÑO
│   │   ├── AdminHome.jsx & .css           # Vista contenedora principal (11 pestañas, Kanban en vivo y KPIs)
│   │   ├── AdminDeliveryRatesModal.jsx    # Modal de tarifas de despacho por condominio/distancia
│   │   ├── CashRegisterModal.jsx          # Modal de apertura, arqueo y cierre de caja de turno
│   │   ├── CreditManager.jsx & .css       # Gestor de fiados y cuentas corrientes de clientes
│   │   ├── ExportSalesReportModal.jsx     # Exportador de reportes de ventas Excel (.xlsx estilizado) y CSV
│   │   ├── InventoryManager.jsx & .css    # Tabla de control de productos, precios, categorías y stock
│   │   ├── OrderNotificationBanner/       # Subcomponente de banner flotante de pedidos entrantes
│   │   ├── PosTerminal.jsx & .css         # Terminal de caja registradora POS para mostrador
│   │   ├── ProductCameraModal.jsx         # Captura de fotos con cámara y lector de códigos de barras
│   │   ├── ProductPerformanceModal.jsx    # Analítica y rentabilidad por producto
│   │   ├── ProductRequestsAdmin.jsx & .css# Bandeja de peticiones de productos solicitados por vecinos
│   │   ├── SalesHistory.jsx & .css        # Historial de ventas con reimpresión de comprobantes y filtros
│   │   ├── SeedCatalogModal/              # Asistente de precarga de catálogo de productos semilla
│   │   ├── ShareStoreModal.jsx            # Modal de enlaces y códigos QR para compartir la tienda
│   │   ├── StorePrintKitModal.jsx & .css  # Generador de afiches y cartelería POP con QR para vitrinas
│   │   ├── StoreScheduleManager.jsx       # Gestor de horarios de atención y descansos por día
│   │   ├── StoreSettings.jsx & .css       # Ajustes de tienda, WhatsApp, ubicación y datos de facturación
│   │   ├── StoreUserGuide.jsx             # Manual y guía de usuario interactiva para comerciantes
│   │   ├── SubscriptionBlockedModal.jsx   # Modal de aviso preventivo de suspensión por vencimiento
│   │   ├── SubscriptionManager.jsx        # Gestor de plan, códigos de activación y renovación
│   │   ├── SupplierManager.jsx            # Gestor de proveedores y reposición de compras
│   │   └── WeeklySummaryModal.jsx         # Resumen ejecutivo semanal de rendimiento
│   │
│   ├── auth/                   # 🔐 MÓDULO DE AUTENTICACIÓN Y ONBOARDING MULTI-TENANT
│   │   ├── AuthModal.jsx & .css           # Modal de Login, Recuperación y Registro en 2 pasos con confeti
│   │
│   ├── common/                 # ⚙️ COMPONENTES COMPARTIDOS GLOBALES
│   │   ├── ErrorBoundary.jsx              # Capturador global de errores React para alta disponibilidad
│   │   ├── Navbar.jsx & .css              # Barra superior con logo, switch de modos, canasta y ubicación
│   │   └── Toast.jsx & .css               # Sistema de notificaciones flotantes (éxito, error, advertencia)
│   │
│   ├── customer/               # 🛒 MÓDULOS DEL STOREFRONT Y VISTA VECINO
│   │   ├── StoreDirectory.jsx & .css      # Hub de descubrimiento hiperlocal (Bento: lista + mapa Leaflet)
│   │   ├── StoreCard.jsx & .css           # Tarjeta de minimarket con foto, distancia, rating y mini-catálogo
│   │   ├── NeighborhoodMap.jsx & .css     # Mapa interactivo Leaflet con pines de tiendas y usuario
│   │   ├── NeighborhoodMap.config.js      # Configuraciones de centro, límites y zoom del mapa
│   │   ├── NeighborhoodMap.markers.js     # Generador de iconos SVG y marcadores del mapa
│   │   ├── StoreSearchBar.jsx & .css      # Buscador con selector de condominios y filtros rápidos
│   │   ├── CustomerHome.jsx & .css        # Catálogo individual del minimarket seleccionado
│   │   ├── CategoryBar.jsx & .css         # Carrusel horizontal táctil de categorías de productos
│   │   ├── HeroBanner.jsx & .css          # Banner promocional deslizable del catálogo
│   │   ├── ProductCard.jsx & .css         # Tarjeta de producto con foto, precio, stock y botones +/-
│   │   ├── ProductModal.jsx & .css        # Modal con vista detallada e información del producto
│   │   ├── CustomerDeliveryScheduleCard.jsx # Tarjeta informativa de ventanas de entrega
│   │   ├── CustomerStoreSchedule.jsx      # Visor detallado de horarios de atención del local
│   │   ├── PwaInstallBanner.jsx           # Banner de instalación rápida de la PWA
│   │   ├── CartDrawer.jsx & .css          # Drawer lateral del carrito con cálculo de VeciPuntos
│   │   ├── CheckoutModal.jsx & .css       # Modal de checkout con Pago Combinado y formato WhatsApp
│   │   ├── LocationModal.jsx & .css       # Modal de selección de Condominio, Torre y Departamento
│   │   ├── RequestProductModal.jsx & .css # Modal para solicitar productos faltantes
│   │   ├── OrderTrackingModal.jsx & .css  # Seguimiento en vivo del estado de la orden
│   │   ├── SearchEmptyState/              # Estado visual vacío cuando no hay resultados de búsqueda
│   │   └── CustomerFooter.jsx             # Pie de página informativo del storefront del vecino
│   │
│   ├── spectator/              # 📱 PANTALLA 1: MODO DEMOSTRACIÓN / LANDING INFORMATIVA
│   │   ├── SpectatorHome.jsx & .css       # Contenedor principal de la landing con animaciones de entrada
│   │   ├── SpectatorHero.jsx & .css       # Hero visual de bienvenida con badge animado y botones CTA
│   │   ├── SpectatorShowcase.jsx & .css   # Simulador 3D (Vista Info, Vecino, Minimarket y Audio)
│   │   ├── SpectatorCarousel.jsx & .css   # Carrusel visual de características y ventajas del SaaS
│   │   ├── SpectatorDeliveryModal.jsx     # Modal de alianzas para condominios y cobertura de entrega
│   │   ├── SpectatorOnboardingBanner.jsx  # Banner de menta esmeralda para registro rápido de tiendas
│   │   ├── SpectatorLegalModal.jsx & .css # Modal con términos legales, privacidad y modelo 0% comisiones
│   │   └── SpectatorFooter.jsx & .css     # Footer completo de la landing con enlaces institucionales
│   │
│   └── superadmin/             # 🛡️ PANTALLA 6: PANEL DE CONTROL GLOBAL SUPERADMIN
│       └── SuperAdminHome.jsx             # Centro de mando para códigos, tenants, suplantación y megáfono
│
├── context/
│   └── StoreContext.jsx        # Estado global reactivo (Multi-tenant, Tiendas, Carrito, Auth, Fiados, etc.)
│
├── data/                       # Datasets de demostración y catálogos semilla
│   ├── initialData.js          # Datos base iniciales
│   ├── tienditaFernandoData.js # Tienda semilla 1 (Catálogo completo de abarrotes de barrio)
│   ├── matiasTiendaTodoData.js # Tienda semilla 2 (Catálogo completo minimarket express)
│   ├── storesData.js           # Directorio de minimarkets en condominios
│   ├── seedProductsData.js     # Banco de productos predefinidos con categorías y fotos
│   ├── creditInitialData.js    # Cuentas corrientes y fiados de ejemplo
│   ├── supplierInitialData.js  # Proveedores de muestra
│   ├── storeInventories.js     # Inventarios vinculados
│   └── officialPlatformContact.js # Canales de soporte y contacto central
│
├── services/
│   ├── supabaseClient.js       # Conexión con Supabase (Auth, Realtime y Base de Datos SQL)
│   └── orderNotificationService.js # Sistema de audio MP3, Web Audio sintetizado y notificaciones
│
├── styles/
│   └── index.css               # Tailwind CSS v4, animaciones keyframe globales y clases glassmorphism
│
└── utils/                      # Módulos de cálculo y utilidades puras
    ├── formatters.js           # Formato de moneda, fechas, teléfonos y saneamiento HTML
    ├── paymentUtils.js         # Lógica de medios de pago, cálculo de Pago Combinado y redondeos
    ├── salesExportUtils.js     # Exportador avanzado de ventas a Excel (.xlsx con formato) y CSV
    ├── excelProductUtils.js    # Procesamiento de planillas Excel para productos
    ├── deliveryFeeUtils.js     # Cálculo de tarifas de delivery por distancia y zonas
    ├── scheduleUtils.js        # Validación de horarios de apertura, cierre y turnos
    ├── subscriptionUtils.js    # Validación de vigencia de planes, códigos y estados de prueba
    ├── storeTenantUtils.js     # Normalización de slugs y detección multi-tenant
    ├── geoUtils.js             # Fórmulas de distancia Haversine y geo-posicionamiento
    └── imageUtils.js           # Optimización y redimensionamiento de imágenes
```

---

## 6. Parámetros para Modelado en Google Stitch / Figma

Para reproducir o iterar estas pantallas en herramientas generativas de UI como **Google Stitch** o en sistemas de diseño en **Figma**, utilice las siguientes especificaciones y prompts estructurados:

### 6.1. Especificación de Canvas & Grid System
* **Figma Canvas Sizes:**
  * Móvil: Frame iPhone 15 Pro (`393px × 852px`).
  * Tablet: Frame iPad Pro 11" (`834px × 1194px`).
  * Desktop: Frame Mac Display (`1440px × 900px`).
* **Figma Auto-Layout Padding & Spacing:**
  * Tarjetas estándar: `16px` o `20px` con `Corner Radius: 16px (rounded-2xl)`.
  * Gaps en Grids: `12px` en móvil, `20px` a `24px` en desktop.
  * Nav Height: `64px` fijo con `glass-nav` backdrop blur.

---

### 6.2. Prompts de Generación para Google Stitch AI

#### 🎯 Prompt 1 — Pantalla 1: Modo Demostración & Landing (Spectator View)
> *"High-converting modern SaaS landing page for a hyperlocal grocery platform called MarketSaaS. Dark slate background (#0f172a) combined with ultra-clean snow-grey surfaces (#f8fafc) and vivid emerald green accents (#10b981). Features a sticky glassmorphic top navigation bar with a multi-mode pill switch: [✨ Info] [🛍️ Cliente] [🏪 Comerciante]. Hero section includes an animated floating badge 'Plataforma SaaS Hiperlocal', bold H1 headline 'El comercio de cercanía, digitalizado en 15 minutos', dual CTA buttons, a 4-card live metrics ticker, and an interactive 3D perspective device simulator comparing the Mobile Resident View with the Realtime Merchant Kanban Dashboard with audio alert triggers. Rounded-2xl glassmorphism cards with soft glowing borders and professional dark footer."*

---

#### 🗺️ Prompt 2 — Pantalla 3.1: Directorio & Mapa Hiperlocal (Neighbor Discovery & Leaflet Map)
> *"Clean mobile-first SaaS split-screen view for 'MarketSaaS - Hyperlocal Neighborhood Directory & Interactive Map'. Clean Bento layout with emerald green brand accents (#10b981) and crisp white cards. Top search bar with zone dropdown '📍 Todas las Zonas / Condominios' and horizontal filter pill row ('🟢 Abiertas Ahora', '🛵 Delivery Gratis', '⚡ Retiro Inmediato', '💳 Aceptan QR'). Left pane features scrollable store cards showing opening badges, 120m proximity, ratings, and a 3-item mini product preview strip. Right pane shows an interactive Leaflet vector street map with residential condominium buildings, user radar pulse marker 'Tú estás aquí', and glowing shop pins with interactive popup cards."*

---

#### 🛒 Prompt 3 — Pantalla 3.2 & 4: Storefront del Minimarket, Pago Combinado & Checkout WhatsApp
> *"Clean mobile-first e-commerce storefront for a neighborhood minimarket in MarketSaaS. Top header with back button '[🗺️ Cambiar de Tienda]', store schedule card, apartment delivery selector ('Torre A • Depto 904') and an amber VeciPuntos counter badge. Horizontal category pill bar and 2-column product grid with high-res photos, discount chips and (+/-) selectors. Sliding cart drawer and modern checkout modal featuring Split Payment / Combined Payment option (paying partial cash and remaining via QR code at pickup counter), with an emerald CTA button generating a formatted order summary directly for WhatsApp."*

---

#### 📊 Prompt 4 — Pantalla 5: Panel de Gestión del Comerciante (Merchant Admin Dashboard)
> *"Comprehensive merchant administration dashboard for a local grocery store owner in MarketSaaS. Top bar with store status toggle (Open/Closed), audible order notification banner, and 4 KPI cards (Today's Sales, Active Orders, Average Ticket, Low Stock). 11-tab workspace featuring a 4-column Live Order Kanban Board (Pending 🟡, In Preparation 🔵, In Route 🟣, Delivered 🟢), POS Cash Register Terminal, Customer Credit Ledger ('Cuaderno de Fiados') with WhatsApp reminder generator, dynamic Inventory Table with camera barcode scanner, Supplier Orders, and Excel spreadsheet sales report exporter."*

---

#### 🛡️ Prompt 5 — Pantalla 6: Centro de Control Maestro de la Plataforma (SuperAdmin Platform Suite)
> *"High-security platform control center for MarketSaaS global super administrators. Modern dark slate and deep indigo theme (#4f46e5). Key sections include: 1) Subscription Activation Code Generator with duration presets (30d, 90d, 180d, 365d, 5min demo), 2) Multi-tenant Store Monitor showing active stores, remaining subscription days, and quick grant/suspend buttons, 3) One-click Store Impersonation Mode with a sticky top exit bar to assist shop owners directly, and 4) Emergency Global Megaphone Broadcast banner system to announce updates to all online stores."*
