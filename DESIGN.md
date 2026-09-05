# MarketSaaS — Design System & UI/UX Specifications

Este documento define la arquitectura visual, los tokens de diseño, la matriz completa de componentes, la jerarquía de carpetas, los lineamientos de experiencia de usuario (UX) y las especificaciones técnicas avanzadas para **MarketSaaS**, la plataforma hiperlocal multi-tenant de comercio para tiendas de barrio, minimarkets y comunidades en condominios.

---

## 1. Visión General y Estado del Sistema

### 1.1. Propósito y Propuesta de Valor
**MarketSaaS** es un sistema web progresivo (PWA Ready) diseñado para digitalizar el comercio barrial e intrainmueble. Permite a los residentes pedir abarrotes y productos de consumo diario directamente a su minimarket más cercano con entregas en 15-30 minutos y **0% de comisiones por transacción**, cerrando las compras a través de pedidos pre-formateados de WhatsApp.

### 1.2. Arquitectura de Navegación y Vistas (Switch de Modo)
El sistema opera bajo un esquema reactivo con 3 modos principales de vista gestionados centralizadamente desde el `StoreContext`:
1. **Modo Espectador (`spectator`) / Pantalla 1 (Modo Demostración):** Landing page informativa de alto impacto visual con simulador 3D interactivo para prospectos, comerciantes y administradores de condominios.
2. **Modo Cliente / Vecino (`customer`) / Pantalla 3:** Experiencia hiperlocal en dos etapas integradas:
   * **Nivel 1 — Directorio & Mapa Hiperlocal (`StoreDirectory`):** Descubrimiento de minimarkets en tiempo real con mapa interactivo de condominios, filtros por apertura, delivery y retiro, y distancias precisas.
   * **Nivel 2 — Catálogo de Minimarket (`CustomerHome`):** Storefront e-commerce optimizado para compras móviles ágiles con selección de departamento/torre, catálogo interactivo, lealtad con VeciPuntos y cierre a WhatsApp.
3. **Modo Dueño / Comerciante (`admin`):** Panel de administración en tiempo real con Tablero Kanban de pedidos en vivo, alertas acústicas (MP3), terminal POS, inventario dinámico y analíticas contables.

---

## 2. Herramientas Visuales, Estilos, Colores y Tipografía

### 2.1. Stack Visual y Herramientas Utilizadas
* **Engine Visual & Utility-First CSS:** **Tailwind CSS v4** (`@import "tailwindcss";`), configurado en `src/styles/index.css` con capas base y animaciones `@keyframes` personalizadas.
* **Librería de Iconografía:** **Lucide React** (más de 40 iconos vectoriales dinámicos: `ShoppingBag`, `Store`, `Building2`, `CheckCircle2`, `MessageSquare`, `Sparkles`, `TrendingUp`, `Bell`, `Volume2`, `Truck`, etc.).
* **Efectos de Celebración:** **Canvas Confetti** (`canvas-confetti`) activado en hitos clave como la creación exitosa de tiendas y confirmación de pedidos.
* **Filtros de Desenfoque y Cristal:** CSS Nivel 4 `backdrop-filter: blur(12px)` a `blur(16px)` para paneles glassmórficos y barras de navegación pegajosas (`sticky`).
* **Sistema de Notificaciones Auditivas:** HTML5 Audio Engine integrado con sonido real en formato MP3 (`Notificacion de orden de compra.mp3`) que alerta acústicamente al comerciante al ingresar un pedido nuevo.
* **Tipografía Externa:** Google Fonts enlazadas en `index.html` con precarga optimizada (`preconnect`).

---

### 2.2. Paleta de Colores y Tokens Semánticos

| Token | Código HEX | Valor RGBA / HSL | Uso y Semántica |
| :--- | :--- | :--- | :--- |
| `primary-500` | `#10b981` | `rgba(16, 185, 129, 1)` | Color primario de marca, botones CTA principal, badges "Abierto", acentos activos. |
| `primary-600` | `#059669` | `rgba(5, 150, 105, 1)` | Estados hover de botones primarios, enlaces con foco, acentos secundarios. |
| `primary-700` | `#047857` | `rgba(4, 120, 87, 1)` | Encabezados en gradiente esmeralda, bordes de alto contraste. |
| `primary-50` | `#ecfdf5` | `rgba(236, 253, 245, 1)` | Fondos de badges activos, contenedores de ofertas, resplandores suaves. |
| `accent-gold` | `#f59e0b` | `rgba(245, 158, 11, 1)` | Sistema de puntos de fidelización (**VeciPuntos**), estrellas de valoración, alertas. |
| `accent-light` | `#fef3c7` | `rgba(254, 243, 199, 1)` | Fondos para cajas de recompensas, ofertas relámpago y tags de VeciPuntos. |
| `neutral-900` | `#0f172a` | `rgba(15, 23, 42, 1)` | Slate oscuro para títulos H1-H3, footers profesionales, headers nocturnos. |
| `neutral-800` | `#1e293b` | `rgba(30, 41, 59, 1)` | Tarjetas oscuras del simulador, fondos de modales técnicos y texto cuerpo dark. |
| `neutral-500` | `#64748b` | `rgba(100, 116, 139, 1)` | Texto secundario, subtítulos, etiquetas de tiempo e iconos inactivos. |
| `neutral-100` | `#f1f5f9` | `rgba(241, 245, 249, 1)` | Fondos de campos de texto (inputs), divisores horizontales, rieles de scrollbar. |
| `neutral-50` | `#f8fafc` | `rgba(248, 250, 252, 1)` | Fondo general de la aplicación (*Snow Grey*) y secciones perladas. |
| `danger-500` | `#ef4444` | `rgba(239, 68, 68, 1)` | Indicadores de stock bajo/agotado, alertas de eliminación, badges de emergencia. |

---

### 2.3. Tipografía y Jerarquía Textual

* **Fuentes Google Fonts:**
  * **Headings (Títulos & Display):** `'Outfit', sans-serif` (Pesos: `Font-Light 300`, `Medium 500`, `Semi-Bold 600`, `Bold 700`, `Extra-Bold 800`).
  * **Body & UI (Texto General, Inputs, Botones):** `'Plus Jakarta Sans', sans-serif` (Pesos: `Regular 400`, `Medium 500`, `Semi-Bold 600`, `Bold 700`).

* **Escala Tipográfica Escalable:**
  * `H1 (Hero Principal):` `text-4xl sm:text-5xl lg:text-6xl` (`leading-tight`, `font-extrabold`).
  * `H2 (Títulos de Sección):` `text-2xl sm:text-3xl lg:text-4xl` (`font-bold`, `tracking-tight`).
  * `H3 (Títulos de Tarjeta):` `text-lg sm:text-xl lg:text-2xl` (`font-semibold`).
  * `Body Standard:` `text-sm sm:text-base` (`font-medium`, `text-slate-600`).
  * `Micro-Copia & Badges:` `text-[10px] sm:text-xs` (`font-bold`, `uppercase`, `tracking-wider`).

---

## 3. Espaciado, Escala Proporcional y Elevación

### 3.1. Espaciado y Escala Proporcional (Responsive Layout)
El diseño sigue una estrategia **Mobile-First** con escalamiento progresivo mediante contenedores fluidos de Tailwind CSS:

* **Contenedores de Ancho Máximo:**
  * Vista General: `max-w-7xl mx-auto` (1280px máx) con padding lateral adapto `px-4 sm:px-6 lg:px-8`.
  * Modales y Centros de Contenido: `max-w-lg` (512px), `max-w-2xl` (672px) o `max-w-4xl` (896px).
* **Grid Proporcional & Columnas:**
  * Móvil (< 640px): Layout de 1 columna (`grid-cols-1`), tarjetas apiladas verticalmente, padding interno `p-3` o `p-4`.
  * Tablet (640px – 1024px): Layout de 2 a 3 columnas (`sm:grid-cols-2 md:grid-cols-3`), gaps de `gap-4` a `gap-5`.
  * Escritorio (> 1024px): Layout de 3 a 4 columnas (`lg:grid-cols-3 xl:grid-cols-4`), gaps amplios `gap-6` a `gap-8`.
* **Dimensiones Táctiles (Touch Targets):**
  * Todos los botones, iconos de interacción, modificadores de cantidad (`+`/`-`) e inputs cumplen con la norma mínima de **44px × 44px** (o paddings de `py-2.5 px-4`) para garantizar usabilidad con pulgar en dispositivos móviles.

---

### 3.2. Elevación, Efectos y Glassmorphism

```css
/* Definición de Clases Glassmorphic en src/styles/index.css */
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

* **Capas de Profundidad y Sombras:**
  * `Nivel 1 (Superficie):` `bg-slate-50` (sin sombra).
  * `Nivel 2 (Tarjetas Estándar):` `bg-white shadow-sm border border-slate-100 hover:shadow-md transition-shadow`.
  * `Nivel 3 (Paneles Glassmórficos):` `glass-panel shadow-xl shadow-slate-900/5 rounded-2xl`.
  * `Nivel 4 (Modales y Drawers):` `z-50 bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl`.
* **Keyframes & Animaciones Dinámicas:**
  * `@keyframes bounce-gentle`: Micro-rebote de 2s para llamar la atención en botones flotantes.
  * `@keyframes pulse-glow`: Resplandor intermitente para badges "En Vivo" y "Abierto".
  * `@keyframes float-slow`: Levitación suave (5s) en maquetas 3D del simulador.
  * `@keyframes shimmer-sweep`: Destello metálico pasando sobre botones CTA principales.
  * `@keyframes fade-in-up`: Entrada suave desde abajo para modales y componentes (`cubic-bezier(0.16, 1, 0.3, 1)`).

---

## 4. Especificación Detallada de Pantallas

### 📱 Pantalla 1: MODO DEMOSTRACIÓN / Vista Espectador (`SpectatorHome`)

La **Pantalla 1** es la puerta de entrada principal a la plataforma (`/`). Su objetivo es presentar el ecosistema SaaS a compradores, minimarkets y administraciones de condominios mediante experiencias inmersivas y demostraciones interactivas.

```
┌────────────────────────────────────────────────────────────────────────┐
│ NAVBAR GLOBAL (Switch: [✨ Info] [🛍️ Cliente] [🏪 Comerciante])         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. HERO SECTION (Badge animado, Título Gradiente, CTAs, Ticker)        │
├────────────────────────────────────────────────────────────────────────┤
│ 2. SHOWCASE INTERACTIVO 3D (Simulador Multidispositivo)                │
│    ├── Pestaña 1: [🛍️ Vista Vecino / Residente]                         │
│    ├── Pestaña 2: [🏪 Panel Minimarket / Dueño con Audio MP3]           │
│    └── Pestaña 3: [🏢 Vista Condominios / Administración]              │
├────────────────────────────────────────────────────────────────────────┤
│ 3. ONBOARDING & BANNER DE CONVERSIÓN (Solicitud de Demo / Registro)    │
├────────────────────────────────────────────────────────────────────────┤
│ 4. FOOTER PROFESIONAL (Directorio de Tiendas, Enlaces Legales)          │
└────────────────────────────────────────────────────────────────────────┘
```

#### Subcomponentes y Vistas Detalladas de la Pantalla 1:

1. **Top Promotion Bar & Navbar Global (`Navbar.jsx`):**
   * Muestra el logo oficial de MarketSaaS con badge *"Barrio & Condominios"*.
   * Incorpora el **Switch Selector de Modo de Demostración** con tres pestañas píldora iluminadas: `[✨ Info]`, `[🛍️ Cliente]`, `[🏪 Dueño]`.
   * Botón de acceso rápido al modal de autenticación (`AuthModal`).

2. **Sección Hero de Bienvenida (`SpectatorHero.jsx`):**
   * **Badge Flotante Animado:** *"Plataforma SaaS Hiperlocal para Barrios y Condominios"*.
   * **Título H1 Impactante:** *"El comercio de cercanía, digitalizado en 15 minutos"*.
   * **Botones CTA Primarios:** Botón *"Explorar Tienda Demo"* (transiciona inmediatamente al Storefront del Cliente) y *"Panel de Acceso / Crear Tienda"*.
   * **Ticker de Métricas Clave:** 4 tarjetas de datos en tiempo real (Entregas en 15 min, 0% Comisiones, Cobertura en Condominios, Supabase Realtime Multi-tenant).
   * **Carrusel Promocional Integrado (`SpectatorCarousel.jsx`):** Banners deslizantes automáticos que muestran ofertas de barrio, VeciPuntos y facilidades de entrega.

3. **Simulador Interactivo 3D Multidispositivo (`SpectatorShowcase.jsx`):**
   Contiene un conmutador de 3 visores dimensionales interactivos:

   * **A) VISTA INFO PLATAFORMA & PROPUESTA DE VALOR:**
     * Explicación gráfica de la arquitectura sin intermediarios ni comisiones abusivas.
     * Comparativa directa: MarketSaaS (0% comisión, WhatsApp directo, cliente propio) vs. Apps Tradicionales (30% comisión, cobro por envío, cliente anónimo).

   * **B) VISTA VECINO / RESIDENTE (Mockup Móvil 3D):**
     * Simula la pantalla de un iPhone 15 Pro dentro de un marco glassmórfico.
     * Muestra el catálogo activo con selector de condo/departamento (*"Torre A • Depto 904"*).
     * Permite probar la adición interactiva de productos al carrito en vivo.
     * Incluye botón para simular la solicitud de un producto no existente (*"Pídelo si no está"*).
     * Muestra el flujo completo hasta generar la vista previa del mensaje de WhatsApp.

   * **C) VISTA PANEL MINIMARKET / DUEÑO (Mockup Dashboard 3D en Tiempo Real):**
     * Simula el panel de control del comerciante en un monitor o tablet de alta resolución.
     * **Notificación Auditiva MP3 Integrada:** Botón para activar/desactivar el reproductor de audio con el sonido real `Notificacion de orden de compra.mp3`.
     * **Botón "Simular Nuevo Pedido":** Dispara un evento reactivo que inserta instantáneamente una nueva orden en el Tablero Kanban y hace sonar la alerta auditiva.
     * **Tablero Kanban Interactivo:** 4 columnas dinámicas (`Pendiente` 🟡, `En Preparación` 🔵, `En Camino` 🟣, `Entregado` 🟢) con botones para avanzar pedidos de estado en un toque.
     * **Analíticas Rápidas:** Métricas dinámicas de ventas del día, pedidos procesados y ticket promedio.

   * **D) VISTA CONDOMINIOS / ADMINISTRACIÓN (`SpectatorCondoModal.jsx`):**
     * Muestra cómo la plataforma se integra con las conserjerías y directivas de edificios.
     * Modal interactivo con formulario para solicitar la incorporación de un condominio o edificio residencial al redil de tiendas asociadas.

4. **Banner de Onboarding y Conversión (`SpectatorOnboardingBanner.jsx`):**
   * Bloque visual de menta esmeralda iluminada que invita a los comerciantes de barrio a registrar su minimarket en menos de 2 minutos sin necesidad de tarjeta de crédito.

5. **Footer Profesional y Modales Secundarios (`SpectatorFooter.jsx` & `SpectatorLegalModal.jsx`):**
   * Pie de página en *Midnight Slate* (`#0f172a`) con enlaces directos a tiendas activas, documentación, redes sociales y formulario de soporte.
   * Modal de Términos Legales, Políticas de Privacidad y Modelo de Negocio Transparente (`SpectatorLegalModal.jsx`).

---

### 🔐 Pantalla 2: Portal de Acceso y Onboarding Multi-Tenant (`AuthModal`)

* **Objetivo:** Registro e inicio de sesión seguro para dueños de minimarkets con arquitectura multi-tenant aislada.
* **Componentes Visuales:**
  * **Pestaña 1: Iniciar Sesión:**
    * Campo de correo electrónico y contraseña con validaciones visuales en tiempo real.
    * Indicadores de carga y manejo de errores con toasts.
  * **Pestaña 2: Crear mi Tienda (Onboarding en 2 Pasos):**
    * *Paso 1 (Datos de Cuenta):* Nombre completo del propietario, correo de gestión y contraseña de seguridad.
    * *Paso 2 (Datos del Minimarket):* Nombre comercial de la tienda, slug o enlace único (`marketsaas.com/store/mi-tienda`), número de WhatsApp de recepción de pedidos y dirección física.
    * **Efecto Confeti (`canvas-confetti`):** Al finalizar la creación, la pantalla dispara una ráfaga de confeti y redirige automáticamente al usuario a su panel de dueño (`AdminHome`).

---

### 🛒 Pantalla 3: Experiencia Integral del Vecino / Cliente (Directorio, Mapa Hiperlocal y Storefront)

La experiencia del vecino está concebida en una arquitectura de **dos niveles complementarios y continuos**:
* **Nivel 1 — Hub de Descubrimiento & Directorio Hiperlocal (`StoreDirectory` + `NeighborhoodMap`):** Permite al residente explorar los minimarkets cercanos a su condominio/zona, comparar tiempos de despacho y ver su localización interactiva en tiempo real sobre el mapa.
* **Nivel 2 — Storefront del Minimarket Seleccionado (`CustomerHome`):** Catálogo de productos interactivo de la tienda elegida, con selector de torre/departamento, carrito y checkout directo hacia WhatsApp.

---

#### 3.1. Hub de Descubrimiento: Directorio y Mapa Hiperlocal (`StoreDirectory`)

* **Objetivo:** Brindar al vecino un portal de exploración en tiempo real para encontrar las tiendas que despachan a su torre/condominio, comparar distancias, verificar quién está abierto y entrar a comprar sin rodeos.
* **Componentes Visuales del Directorio & Mapa:**
  1. **Top Global Navbar:** Marca MarketSaaS, selector de modo activo `[🛍️ Vista Vecino]`, resumen de canasta y selector de ubicación barrial (`📍 Condominio Las Palmas ▾`).
  2. **Buscador Hiperlocal & Selector de Zonas (`StoreSearchBar.jsx`):**
     * Barra de búsqueda redondeada (`rounded-2xl`, borde slate-200, sombra suave, 56px de alto).
     * Input interactivo con lupa: *"¿Qué buscas hoy? (ej. Pan fresco, Leche, Bebidas, Don Pedro...)"*.
     * Selector desplegable de condominios/zonas: *"📍 Todas las Zonas / Condominios ▾"*.
     * Botón CTA primario verde esmeralda con flecha de acción rápida.
  3. **Riel de Filtros Rápidos (Pills Horizontales con scroll táctil):**
     * `[🟢 Abiertas Ahora (con pulso verde)]`
     * `[🛵 Delivery Gratis]`
     * `[⚡ Retiro Inmediato (5-10 min)]`
     * `[💳 Aceptan QR / Transferencia]`
     * `[⭐ Mejor Calificadas (4.8+)]`
     * `[🎁 Club VeciPuntos]`
  4. **Layout Split-Screen Bento (Desktop: 45% Lista / 55% Mapa Interactivo | Móvil: Alternador [📋 Lista de Tiendas] / [🗺️ Ver Mapa]):**
     * **Columna Izquierda (Lista de Tarjetas Bento `StoreCard.jsx`):**
       * *Tarjeta Destacada (Featured):* Fotografía nítida del local con badge de estado `"🟢 ABIERTO AHORA • Cierra 22:00"`, avatar circular con logo, nombre comercial (`font-bold, 18px`), calificación comunitaria (`⭐ 4.9`), proximidad física (`📍 A 120m • Calle Los Sauces, frente a Torre B`), chips de beneficios (`🛵 Delivery a Depto en 10-15 min`, `💰 Envío Gratis > Bs. 50`), **tira de 3 productos destacados con precio y foto** y botón principal `"Entrar a la Tienda y Comprar ➔"`.
       * *Tarjetas Estándar:* Fotografía de góndola/fachada, estado de apertura, distancia, beneficios de pago y botón outline `"Ver Catálogo ➔"`.
     * **Columna Derecha (Mapa Interactivo Hiperlocal `NeighborhoodMap.jsx`):**
       * Renderizado vectorial estilo Leaflet / OpenStreetMap con calles en tonos pastel suaves y áreas de condominios y parques claramente delimitadas (*"Condominio Las Palmas", "Torre A", "Torre B", "Torre C"*).
       * **Pin de Usuario:** Marcador azul con onda de radar palpitante *"Tú estás aquí (Torre A - Depto 302)"*.
       * **Pines de Minimarkets:** Marcadores esmeralda con icono de tienda 🏪, anillo de pulso y popup emergente que incluye logo, nombre, rating, distancia y botón `"Ver Catálogo"`.
       * **Controles Flotantes:** Conmutador [Mapa | Satélite], Zoom [+] [-] y botón inferior `[📍 Re-centrar en mi condominio]`.
  5. **Banner Comunitario Inferior:**
     * Tarjeta estética con gradiente sutil: *"¿Tienes una tienda de barrio o minimarket en este condominio? Publica tu tienda gratis en MarketSaaS y recibe pedidos por WhatsApp."* + Botón CTA *"Registrar mi Tienda"*.

---

#### 3.2. Catálogo del Minimarket Seleccionado / Storefront (`CustomerHome`)

* **Objetivo:** E-commerce ultrarrápido y accesible para los residentes del condominio una vez elegida su tienda de preferencia.
* **Componentes Visuales:**
  1. **Barra de Navegación y Retorno:** Botón visible `[🗺️ Cambiar de Tienda / Volver al Mapa]` que permite volver al directorio sin perder la ubicación ni el carrito.
  2. **Store Navigation Header:** Marca del minimarket, estado del local (*Badge verde "Abierto"* o *rojo "Cerrado"*), y la barra de puntos acumulados.
  3. **Selector de Ubicación en Condominio (`LocationModal.jsx`):** Modal táctil para elegir o escribir Condominio, Torre/Bloque y Número de Departamento para entregas precisas en puerta o conserjería.
  4. **Banner Hero Promocional (`HeroBanner.jsx`):** Carrusel de ofertas destacadas con gradientes dinámicos y llamada a la acción.
  5. **Filtro Horizontal de Categorías (`CategoryBar.jsx`):** Barra de desplazamiento táctil horizontal con botones píldora (*Bebidas, Lácteos, Abarrotes, Limpieza, Snack, Panadería, Ofertas*).
  6. **Grid de Productos y Tarjeta Individual (`ProductCard.jsx` & `ProductModal.jsx`):**
     * Fotografía del producto optimizada, badge de descuento porcentual, precio en moneda local, badge de stock crítico y selector numérico de cantidad (`+` / `-`).
     * Al hacer clic en la tarjeta, abre el `ProductModal` con la descripción extendida y detalles nutricionales/marca.
  7. **Solicitud de Productos Faltantes (`RequestProductModal.jsx`):**
     * Botón especial en el catálogo: *"¿No encuentras lo que buscas? Pídelo aquí"*. Abre un formulario simple para sugerir productos al dueño.
  8. **Seguimiento de Pedidos y Puntos (`OrderTrackingModal.jsx` & `LoyaltyPointsModal.jsx`):**
     * Visualización del estado del pedido en tiempo real y desglose de VeciPuntos canjeables por descuentos.

---

### 🛍️ Pantalla 4: Carrito Lateral y Checkout a WhatsApp (`CartDrawer` & `CheckoutModal`)

* **Objetivo:** Convertir el carrito de compras en un mensaje perfectamente estructurado para WhatsApp en un solo clic.
* **Componentes Visuales:**
  * **Drawer Lateral del Carrito (`CartDrawer.jsx`):**
    * Panel deslizante desde el lateral derecho (`z-50`).
    * Lista de ítems seleccionados con controles para modificar cantidades o eliminar productos.
    * Barra interactiva de lealtad: Calcula automáticamente los **VeciPuntos** que ganará el cliente con esta compra.
    * Selector de modalidad de despacho: `[🚚 Delivery a Puerta/Conserjería] | [🏪 Retiro en Tienda]`.
    * Desglose de precios: Subtotal, Descuentos aplicados, Costo de despacho y Total general.
  * **Modal de Cierre y Envío (`CheckoutModal.jsx`):**
    * Formulario de confirmación de datos: Nombre del cliente, teléfono celular y notas adicionales para el repartidor.
    * Selector de método de pago: `[💵 Efectivo] | [📱 QR / Transferencia] | [💳 Tarjeta Débito/Crédito]`.
    * **Generador de Pedido de WhatsApp:** Botón primario verde esmeralda con el icono oficial de WhatsApp. Al presionar, abre la API de WhatsApp (`https://wa.me/...`) con un mensaje estructurado profesionalmente:

```text
🛒 *NUEVO PEDIDO - MARKETSAAS* 🛒
─────────────────────────────
👤 *Cliente:* Camila Rojas
🏢 *Ubicación:* Torre A • Depto 904 (Condominio Los Olivos)
📞 *Teléfono:* +56 9 1234 5678
💳 *Método de Pago:* QR / Transferencia

📦 *DETALLE DEL PEDIDO:*
• 1x Leche Entera 1L ($1.200)
• 2x Pan Marraqueta 1kg ($3.000)
• 1x Bebida 2L ($1.800)

💰 *TOTAL A PAGAR:* $6.000
─────────────────────────────
🚚 *Modo:* Delivery a Puerta
✨ *VeciPuntos Ganados:* +60 pts
```

---

### 📊 Pantalla 5: Panel de Gestión del Comerciante (`AdminHome` / `AdminDashboard`)

* **Objetivo:** Centro de mando integral para el minimarket con monitoreo en vivo de ventas, inventario y despacho.
* **Componentes Visuales:**
  1. **Header de Administración & KPIs (`AdminDashboard.jsx`):**
     * Métricas principales en tarjetas glassmórficas: Ventas Totales del Día, Pedidos Activos, Ticket Promedio y Productos con Stock Crítico.
  2. **Tablero Kanban de Pedidos en Vivo (`LiveOrdersBoard.jsx`):**
     * 4 Columnas dinámicas: `🟡 Pendientes` | `🔵 En Preparación` | `🟣 En Camino` | `🟢 Entregados`.
     * Conexión en tiempo real con Supabase Realtime para actualizar pedidos instantáneamente sin recargar la página.
     * Alerta sonora de pedido entrante con reproductor audio MP3.
  3. **Gestor de Inventario Dinámico (`InventoryManager.jsx`):**
     * Tabla interactiva con búsqueda por nombre/código de barras, edición rápida de precios, stock disponible, selector de categoría y switch para ocultar/mostrar productos en el catálogo.
     * Modal de creación y modificación de productos con carga de imágenes.
  4. **Terminal Punto de Venta POS (`PosTerminal.jsx`):**
     * Interfaz rápida para registrar ventas presenciales en el mostrador del minimarket sincronizada con el mismo inventario.
  5. **Gestor de Solicitudes de Vecinos (`ProductRequestsAdmin.jsx`):**
     * Panel donde el dueño revisa qué productos han pedido los vecinos que faltan en el catálogo.
  6. **Configuración de Tienda (`StoreSettings.jsx`):**
     * Ajustes de nombre comercial, WhatsApp de pedidos, colores corporativos, tarifas de despacho por condominio y horarios de atención.
  7. **Exportación Contable (`csvExport.js`):**
     * Generación automática de reportes de ventas descargables en formato `.CSV` para contabilidad Excel/Google Sheets.

---

## 5. Matriz de Componentes y Jerarquía de Carpetas (DESCRIPCIÓN TOTAL)

A continuación se detalla la totalidad del árbol de archivos del código fuente (`src/`), describiendo la responsabilidad de cada archivo JSX, CSS y JS en la arquitectura del sistema:

```
src/
├── App.jsx                     # Enrutador principal y orquestador del switch de vistas (Spectator / Customer / Admin)
├── App.css                     # Estilos de utilidades generales del App
├── main.jsx                    # Punto de entrada React 18, montaje en el DOM (#root) y proveedores globales
│
├── components/
│   ├── admin/                  # 📊 MÓDULOS DE GESTIÓN DEL COMERCIANTE / DUEÑO
│   │   ├── AdminHome.jsx & .css           # Vista contenedora principal del panel del comerciante
│   │   ├── AdminDashboard.jsx & .css      # Dashboard superior con 4 tarjetas de KPIs y resumen ejecutivo
│   │   ├── LiveOrdersBoard.jsx & .css     # Tablero Kanban en tiempo real (4 columnas) con sonido de alertas
│   │   ├── InventoryManager.jsx & .css    # Tabla de control de productos, precios, categorías y stock
│   │   ├── PosTerminal.jsx & .css         # Terminal de caja registradora POS para ventas presenciales
│   │   ├── ProductRequestsAdmin.jsx & .css# Módulo donde el dueño gestiona peticiones de productos de vecinos
│   │   └── StoreSettings.jsx & .css       # Panel de configuración de tienda, WhatsApp, tarifas y horarios
│   │
│   ├── auth/                   # 🔐 MÓDULO DE AUTENTICACIÓN Y ONBOARDING MULTI-TENANT
│   │   └── AuthModal.jsx & .css           # Modal de Login y Registro de Tiendas en 2 pasos con confeti
│   │
│   ├── common/                 # ⚙️ COMPONENTES COMPARTIDOS GLOBALES
│   │   ├── Navbar.jsx & .css              # Barra superior con marca, switch de 3 modos y estado de sesión
│   │   └── Toast.jsx & .css               # Sistema de notificaciones flotantes (éxito, error, advertencia)
│   │
│   ├── customer/               # 🛒 MÓDULOS DEL STOREFRONT Y VISTA VECINO
│   │   ├── StoreDirectory.jsx & .css      # Hub de descubrimiento hiperlocal (Bento: lista + mapa)
│   │   ├── StoreCard.jsx & .css           # Tarjeta de minimarket con foto, distancia, rating y mini-catálogo
│   │   ├── NeighborhoodMap.jsx & .css     # Mapa interactivo hiperlocal con pines de tiendas y usuario
│   │   ├── StoreSearchBar.jsx & .css      # Buscador con selector de condominios y filtros rápidos
│   │   ├── CustomerHome.jsx & .css        # Catálogo individual del minimarket seleccionado
│   │   ├── CategoryBar.jsx & .css         # Carrusel horizontal táctil de categorías de productos
│   │   ├── HeroBanner.jsx & .css          # Banner promocional deslizable del catálogo
│   │   ├── ProductCard.jsx & .css         # Tarjeta de producto con foto, precio, stock y botones +/-
│   │   ├── ProductModal.jsx & .css        # Modal con vista detallada e ingredientes del producto
│   │   ├── CartDrawer.jsx & .css          # Drawer lateral del carrito con desglose de precios y VeciPuntos
│   │   ├── CheckoutModal.jsx & .css       # Modal de checkout con selección de pago y formato WhatsApp
│   │   ├── LocationModal.jsx & .css       # Modal de selección de Condominio, Torre y Departamento
│   │   ├── RequestProductModal.jsx & .css # Modal para que el vecino solicite productos faltantes
│   │   ├── LoyaltyPointsModal.jsx & .css  # Modal del programa de fidelización VeciPuntos
│   │   ├── OrderTrackingModal.jsx & .css  # Modal de seguimiento de estado de pedidos en ruta
│   │   └── CustomerFooter.jsx             # Pie de página informativo del storefront del vecino
│   │
│   └── spectator/              # 📱 PANTALLA 1: MODO DEMOSTRACIÓN / LANDING INFORMATIVA
│       ├── SpectatorHome.jsx & .css       # Contenedor principal de la Pantalla 1 con scroll observer
│       ├── SpectatorHero.jsx & .css       # Hero visual de bienvenida con badge animado y botones CTA
│       ├── SpectatorShowcase.jsx & .css   # Simulador 3D interactivo (Vista Info, Vecino, Minimarket y Audio MP3)
│       ├── SpectatorCarousel.jsx & .css   # Carrusel visual de características y ventajas del SaaS
│       ├── SpectatorCondoModal.jsx & .css # Modal de solicitud de alianza para condominios y edificios
│       ├── SpectatorOnboardingBanner.jsx & .css # Banner de menta esmeralda para registro rápido de tiendas
│       ├── SpectatorLegalModal.jsx & .css # Modal con términos legales, privacidad y modelo 0% comisiones
│       └── SpectatorFooter.jsx & .css     # Footer completo de la landing con enlaces y directorio
│
├── context/
│   └── StoreContext.jsx        # Estado global reactivo (Multi-tenant, Tienda activa, Carrito, Autenticación)
│
├── data/
│   └── initialData.js          # Mock data inicial para demostración (Productos, Tiendas, Pedidos demo)
│
├── services/
│   └── supabaseClient.js       # Cliente de integración con Supabase (Auth, Realtime y Base de Datos SQL)
│
├── styles/
│   └── index.css               # Tailwind CSS v4, animaciones keyframe globales y clases glassmorphism
│
└── utils/
    └── formatters.js           # Helpers para formato de moneda (CLP/USD), fechas y limpiador de WhatsApp
```

---

## 6. Parámetros para Modelado en Google Stitch / Figma

Para reproducir o iterar estas pantallas en herramientas generativas de UI como **Google Stitch** o en sistemas de diseño en **Figma**, utilice las siguientes especificaciones y prompts base estructurados:

### 6.1. Especificación de Canvas & Grid System
* **Figma Canvas Sizes:**
  * Móvil: Frame iPhone 15 Pro (`393px × 852px`).
  * Tablet: Frame iPad Pro 11" (`834px × 1194px`).
  * Desktop: Frame Mac Display (`1440px × 900px`).
* **Figma Auto-Layout Padding & Spacing:**
  * Cards Padding: `16px` o `24px` con `Corner Radius: 16px (rounded-2xl)`.
  * Gaps en Grids: `16px` en móvil, `24px` en desktop.
  * Nav Height: `64px` fijo con `glass-nav` backdrop blur.

---

### 6.2. Prompts de Generación para Google Stitch AI

#### 🎯 Prompt 1 — Pantalla 1: Modo Demostración & Landing (Spectator View)
> *"High-converting modern SaaS landing page for a hyperlocal grocery platform called MarketSaaS. Dark slate background (#0f172a) combined with ultra-clean snow-grey surfaces (#f8fafc) and vivid emerald green accents (#10b981). Features a sticky glassmorphic top navigation bar with a 3-mode pill switch: [✨ Info] [🛍️ Cliente] [🏪 Comerciante]. Hero section includes an animated floating badge 'Plataforma SaaS Hiperlocal', bold H1 headline 'El comercio de cercanía, digitalizado en 15 minutos', dual CTA buttons, a 4-card live metrics ticker, and an interactive 3D perspective device simulator comparing the Mobile Resident View with the Realtime Merchant Kanban Dashboard with audio alert triggers. Rounded-2xl glassmorphism cards with soft glowing borders and professional dark footer."*

---

#### 🗺️ Prompt 2 — Pantalla 3: Vista Vecino / Directorio & Mapa Hiperlocal (Neighbor Discovery & Interactive Map View)
> **Instrucciones:** Copia y pega el siguiente bloque textual en **Google Stitch** para generar el modelo visual interactivo de la pantalla de descubrimiento del vecino:

```text
Design a modern, clean, mobile-first SaaS web screen for "MarketSaaS - Vista Vecino / Directorio & Mapa Hiperlocal".
Target resolution: 1440px desktop with mobile-responsive layout (390px).
Design Style: Clean Bento / Split-Screen, Glassmorphism, Tailwind CSS aesthetics, modern e-commerce.
Color Palette: Emerald Primary (#10B981, #059669, #047857), Slate/Dark Navy Backgrounds (#0F172A, #1E293B, #F8FAFC), Accent Amber Gold (#F59E0B), Pure White cards (#FFFFFF).
Typography: Headings in 'Outfit' (Bold/Extrabold), Body & UI in 'Plus Jakarta Sans'.

=== LAYOUT ARCHITECTURE ===

1. TOP GLOBAL NAVBAR (Sticky, 72px height, Glassmorphic White with subtle shadow border):
- Left: MarketSaaS logo (Green shopping cart + modern wordmark) + subtitle "Red de Minimarkets de Proximidad".
- Center: Segmented View Pill Switcher:
  * [✨ Info Plataforma] (inactive, text-slate-600)
  * [🛍️ Vista Vecino] (ACTIVE, solid emerald badge #10B981, text-white, font-bold)
  * [🏪 Panel Minimarket] (inactive, text-slate-600)
- Right: Quick Cart summary badge ("Tu Canasta: Bs. 0.00") and User Location Pill ("📍 Condominio Las Palmas ▾").

2. HERO SEARCH & HYPERLOCAL FILTER BAR (Top Section, full width):
- Title: "Encuentra tu minimarket más cercano en tiempo real" (Outfit, 28px, font-extrabold, text-slate-900).
- Subtitle: "Compara precios, verifica disponibilidad y pide directo a tu puerta o retira en local sin comisiones."
- Search Bar Container (Rounded-2xl, border slate-200, shadow-sm, bg-white, 56px height):
  * Left: Search input with magnifying glass: "¿Qué buscas hoy? (ej. Pan fresco, Leche, Bebidas, Don Pedro...)"
  * Center-Right: Zone Dropdown Selector: "📍 Todas las Zonas / Condominios ▾"
  * Far-Right: Primary Emerald Button "Buscar Tiendas" with Arrow icon.
- Filter Pills Row (horizontal scrolling):
  * [🟢 Abiertas Ahora (Pulse green dot)]
  * [🛵 Delivery Gratis]
  * [⚡ Retiro Inmediato (5-10 min)]
  * [💳 Aceptan QR / Transferencia]
  * [⭐ Mejor Calificadas (4.8+)]
  * [🎁 Club VeciPuntos]

3. MAIN CONTENT: DUAL SPLIT-SCREEN BENTO (Desktop: 45% List / 55% Interactive Map; Mobile: Toggle Tab [📋 Lista de Tiendas] | [🗺️ Ver Mapa]):

LEFT COLUMN - STORE LIST (Scrollable, max-h-[800px], space-y-4):
- Header: Showing "4 minimarkets disponibles en tu sector" + Sorting dropdown ("Más Cercanos", "Mayor Calificación").
- Store Card 1 (Selected/Featured Store):
  * Header Image: Bright photo of a clean local minimarket storefront with a badge "🟢 ABIERTO AHORA • Cierra 22:00".
  * Store Logo: Circular brand avatar in top left overlapping the banner.
  * Store Name: "Minimarket Don Vecino" (Font-bold, 18px).
  * Rating & Reviews: "⭐ 4.9 (142 valoraciones de vecinos)".
  * Proximity & Address: "📍 A 120m • Calle Los Sauces, frente a Torre B".
  * Key Perks Row (Small badges): "🛵 Delivery a Depto en 10-15 min", "💰 Envío Gratis > Bs. 50", "🏷️ 340 productos en stock".
  * Featured Mini-Catalog Strip: 3 product thumbnails with discounted prices ("Leche 1L Bs. 8.00", "Coca-Cola 2L Bs. 13.00", "Huevos 15u Bs. 15.00").
  * Action Button: Full-width gradient emerald button "Entrar a la Tienda y Comprar ➔" (Hover scale, shadow-md).

- Store Card 2 (Standard Store):
  * Image: Modern grocery / deli shelf photo.
  * Badge: "🟢 Abierto • Listo en 15 min".
  * Store Name: "Abarrotes & Delicatessen La Pradera".
  * Rating: "⭐ 4.8 (89 pedidos)".
  * Proximity: "📍 A 350m • Condominio Altos del Valle".
  * Perks: "🛵 Delivery propio", "💳 QR Simple", "🧺 Retiro en Caja".
  * Button: Clean outlined emerald button "Ver Catálogo ➔".

- Store Card 3 (Beverages & Snacks):
  * Image: Cold beverage coolers and snack section.
  * Badge: "🟢 Abierto 24 Horas".
  * Store Name: "Licorería & Express 24/7".
  * Rating: "⭐ 4.7 (215 valoraciones)".
  * Proximity: "📍 A 500m • Av. Principal #104".
  * Button: "Ver Catálogo ➔".

RIGHT COLUMN - INTERACTIVE HYPERLOCAL MAP (Sticky, rounded-3xl, border slate-200, shadow-lg, min-h-[650px], overflow-hidden):
- Modern Map Canvas (Leaflet/Mapbox vector style, soft pastel streets, green condominium park areas labeled "Condominio Las Palmas", "Torre A", "Torre B", "Torre C").
- Active Store Pins:
  * Pin 1 (Primary Store): Emerald glowing marker with a shop icon 🏪, pulsing ring animation, with an expanded Popup Card showing: Store logo, "Minimarket Don Vecino", "⭐ 4.9", "120m de distancia", and CTA button "Ver Catálogo".
  * Pin 2 & Pin 3: Stylized teal markers with mini store icons and price tags.
  * User Location Pin: Blue pulse marker with radar wave labeled "Tú estás aquí (Torre A - Depto 302)".
- Floating Map Controls:
  * Top-right: Layer switcher [Mapa | Satélite], Zoom [+] [-].
  * Bottom-left: "📍 Re-centrar en mi condominio" button.
  * Bottom-center banner: "Mostrando minimarkets con cobertura directa a tu puerta".

4. BOTTOM COMMUNITY BANNER:
- Sleek card with gradient border: "¿Tienes una tienda de barrio o minimarket en este condominio? Publica tu tienda gratis en MarketSaaS y recibe pedidos por WhatsApp." + Button "Registrar mi Tienda".
```

---

#### 🛒 Prompt 3 — Pantalla 3.2 & 4: Storefront del Minimarket & Carrito WhatsApp (Customer Storefront View)
> *"Clean mobile-first e-commerce storefront for a neighborhood minimarket. Top navigation with return breadcrumb '[🗺️ Cambiar de Tienda / Volver al Mapa]', store logo, green 'Abierto' status chip, apartment delivery selector ('Torre A • Depto 904'), and an amber VeciPuntos counter badge. Includes a horizontal touch-scrolling category chip bar, search bar, and a 2-column product grid with vibrant food photography, discount percentage badges, prices, and quantity incrementors (+/-). Floating cart drawer with item summary, VeciPuntos calculation, and a prominent emerald WhatsApp checkout CTA button."*

---

#### 📊 Prompt 4 — Pantalla 5: Panel de Gestión del Comerciante (Merchant Admin Dashboard)
> *"Professional real-time merchant control panel for a local minimarket owner. Top bar with 4 KPI overview cards (Today's Sales, Active Orders, Average Ticket, Low Stock Alerts). Main workspace features an interactive 4-column live order Kanban board (Pending 🟡, Packing 🔵, On The Way 🟣, Delivered 🟢) with order cards showing customer condo address, items list, payment badge, and instant status advance buttons. Side panel navigation for Inventory Table, POS Register Terminal, Customer Requests, and CSV Export."*
