---
name: MarketSaaS Merchant Cockpit & Store Operations
colors:
  surface: '#0f172a'
  surface-dim: '#020617'
  surface-bright: '#1e293b'
  surface-container-lowest: '#0b0f19'
  surface-container-low: '#131c31'
  surface-container: '#1e293b'
  surface-container-high: '#27354f'
  surface-container-highest: '#334155'
  on-surface: '#f8fafc'
  on-surface-variant: '#94a3b8'
  inverse-surface: '#f8fafc'
  inverse-on-surface: '#0f172a'
  outline: '#475569'
  outline-variant: '#334155'
  surface-tint: '#10b981'
  primary: '#10b981'
  on-primary: '#022c22'
  primary-container: '#064e3b'
  on-primary-container: '#6ee7b7'
  inverse-primary: '#047857'
  secondary: '#3b82f6'
  on-secondary: '#172554'
  secondary-container: '#1e3a8a'
  on-secondary-container: '#bfdbfe'
  tertiary: '#f59e0b'
  on-tertiary: '#451a03'
  tertiary-container: '#78350f'
  on-tertiary-container: '#fde68a'
  error: '#ef4444'
  on-error: '#450a0a'
  error-container: '#7f1d1d'
  on-error-container: '#fecaca'
  status-pending: '#f59e0b'
  status-pending-bg: '#fef3c7'
  status-pending-border: '#fde68a'
  status-preparing: '#3b82f6'
  status-preparing-bg: '#eff6ff'
  status-preparing-border: '#bfdbfe'
  status-shipping: '#8b5cf6'
  status-shipping-bg: '#f5f3ff'
  status-shipping-border: '#ddd6fe'
  status-delivered: '#10b981'
  status-delivered-bg: '#ecfdf5'
  status-delivered-border: '#a7f3d0'
  status-cancelled: '#ef4444'
  status-cancelled-bg: '#fef2f2'
  status-cancelled-border: '#fecaca'
  pos-display-bg: '#020617'
  pos-keypad-btn: '#1e293b'
  pos-keypad-hover: '#334155'
typography:
  headline-hero:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
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
    fontWeight: '500'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
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
    fontWeight: '800'
    lineHeight: 14px
    letterSpacing: 0.05em
  number-counter:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
rounded:
  sm: 0.375rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.25rem
  2xl: 1.5rem
  full: 9999px
spacing:
  touch-min: 44px
  header-height: 64px
  tab-bar-height: 52px
  sidebar-width: 260px
  kanban-col-min-width: 310px
---

# Especificación Integral: Vista Dueño / Panel MiniMarket (Admin Cockpit)

Este documento define la totalidad de directrices, experiencia de usuario (UX), arquitectura de componentes, flujos operativos, esquema de datos y recursos técnicos necesarios para el **Panel de Control del Dueño de Minimarket** (`viewMode: 'admin'`) en MarketSaaS.

---

## 1. Visión y Propósito Operativo

### 1.1. Perfil del Usuario y Contexto Real
El dueño de tienda o encargado de mostrador opera en un entorno físico de alto estrés y ritmo acelerado: atiende clientes presenciales, recibe llamadas, prepara bolsas para delivery y vigila su inventario.

**Objetivo Central del Panel:**
Proveer un centro de comando táctico ("Cockpit") que requiera el **mínimo número de clics**, con feedback visual y acústico instantáneo, legible a 1 metro de distancia en tabletas o laptops de mostrador, y totalmente operable en smartphones de gama media.

---

## 2. Estructura de Navegación y Header Operativo

### 2.1. Barra Superior Pegajosa (Sticky Operations Header)
Permanece siempre visible en la parte superior con los controles críticos del negocio:

1. **Estado de Apertura en Vivo (`Switch isOpen`):**
   - Toggle grande tipo pastilla: `[ 🟢 ABIERTO AHORA ]` / `[ 🔴 CERRADO TEMPORALMENTE ]`.
   - Al cambiar a "Cerrado", la tienda se bloquea automáticamente en la Vista Vecino, impidiendo nuevos pedidos.
2. **Control Acústico de Alertas (`Audio Alerts Controller`):**
   - Botón con icono de bocina `Volume2` / `VolumeX`.
   - Permite activar/silenciar el timbre auditivo (`Notificacion de orden de compra.mp3`).
   - Botón secundario `[ Probar Sonido ]` para que el comerciante verifique que su altavoz o bluetooth está activo.
3. **Selector Rápido de Sucursal / Nombre de la Tienda:**
   - Muestra el nombre comercial actual (`storeConfig.name`) con acceso directo a ajustes.
4. **Selector de Modo / Salida:**
   - Botón para previsualizar la tienda como vecino `[ 👁️ Vista Vecino ]` y volver al panel.

### 2.2. Barra de Módulos (Tab Navigation)
Segmentada con iconos de alta visibilidad y contadores badge dinámicos:
* 📊 **Dashboard:** Resumen métrico del día, ventas en Bs., horas pico y productos estrella.
* 📦 **Pedidos en Vivo (Kanban):** Flujo de preparación y despacho con alertas sonoras (Badge con contador de pendientes).
* 🛒 **Punto de Venta (POS):** Cobro rápido en mostrador con escaneo de código de barras.
* 🏷️ **Inventario:** Catálogo completo, control de stock crítico y edición rápida de precios.
* 🔔 **Peticiones de Vecinos:** Demandas de productos faltantes reportadas por residentes.
* ⚙️ **Configuración:** Condominios atendidos, tarifas de delivery, montos mínimos, QR y horarios.

---

## 3. Especificación Detallada por Módulo

### 📊 Módulo 1: Dashboard de Control y Métricas Rápidas (`AdminDashboard`)

#### A. Tarjetas de KPIs Operativos del Día (Top Metrics)
1. **Ventas Totales del Día:** Cifra en Bs., comparativa porcentual vs. día anterior y total de órdenes cerradas.
2. **Pedidos en Espera / Activos:** Contador en tiempo real resaltado en ámbar/azul.
3. **Ticket Promedio:** Gasto medio por cliente (ej. 45.50 Bs.).
4. **Alertas de Stock Crítico:** Cantidad de productos con stock menor al umbral mínimo (`stock <= minStock`).

#### B. Gráficos y Análisis Intuitivo
* **Gráfico de Horas Pico (Bar Chart):** Distribución de pedidos por hora (ej. pico a las 13:00 y a las 20:00) para prever la necesidad de empaquetadores o repartidores.
* **Top 5 Productos Más Vendidos:** Lista con foto miniatura, unidades despachadas y facturación total generada.
* **Desglose de Métodos de Pago Recibidos:** Proporción entre Efectivo vs. QR Simple vs. Tarjeta POS.

---

### 📦 Módulo 2: Tablero Kanban de Pedidos en Vivo (`LiveOrdersBoard`)

Es el corazón operativo del comercio en horas pico.

#### A. Arquitectura de Columnas (4 Etapas Reactivas)
1. 🟡 **Pendientes (Nuevos Pedidos):**
   - Activa de inmediato el archivo de audio (`Notificacion de orden de compra.mp3`) de manera cíclica cada 15 segundos hasta ser atendido.
   - Borde amarillo pulsante (`animate-pulse`).
   - Muestra tiempo transcurrido desde el pedido (ej. "Hace 2 min").
   - Botón CTA: `[ 🔵 Aceptar y Preparar ]`.
2. 🔵 **En Preparación (En Mostrador):**
   - Checklist interactivo de productos: el operario va marcando con un tap cada producto que coloca en la bolsa.
   - Indicador de empaque: `3 de 5 productos listos`.
   - Botón CTA: `[ 🟣 Despachar / Listo para Entrega ]`.
3. 🟣 **En Camino / Listo para Retiro:**
   - Si es **Delivery:** Muestra el condominio, torre y departamento destino, con botón para contactar al cliente o al repartidor.
   - Si es **Retiro en Tienda:** Etiqueta distintiva `🏪 Retiro en Local`.
   - Botón CTA: `[ 🟢 Confirmar Entrega ]`.
4. 🟢 **Entregados / Historial del Día:**
   - Lista consolidada de pedidos completados con detalles de pago y vuelto entregado.
   - Opción para archivar o reimprimir comanda.

#### B. Componentes Internos de la Tarjeta de Pedido
* **Encabezado:** ID del pedido (ej. `#ORD-8492`), hora de registro, tipo de servicio (`🛵 Delivery` o `🏪 Retiro`).
* **Datos del Vecino:** Nombre completo, teléfono con enlace directo a WhatsApp (`wa.me`) con mensaje contextual prefabricado (*"Hola Valeria, tu pedido #8492 de Amarket está listo y saliendo hacia la Torre B"*).
* **Dirección Hiperlocal:** Condominio, Torre y Número de Depto.
* **Desglose Financiero:** Subtotal, costo de envío, descuento de VeciPuntos y Total a Cobrar en Bs.
* **Detalle de Pago:** Método seleccionado (Efectivo y monto con el que pagará para calcular el **Vuelto exacto**, QR o Tarjeta).
* **Acciones Rápidas:**
  - 🖨️ `Imprimir Comanda` (Formato ticket térmico de 58mm/80mm).
  - 💬 `WhatsApp Directo`.
  - ❌ `Rechazar / Cancelar Pedido` (Requiere motivo: Falta de stock, fuera de horario).

---

### 🛒 Módulo 3: Punto de Venta para Mostrador (`PosTerminal`)

Diseñado para cobrar a vecinos que compran físicamente en el local con rapidez de supermercado.

#### A. Interfaz Dividida en 2 Secciones
1. **Lado Izquierdo — Catálogo Táctil y Buscador:**
   - Campo de búsqueda instantánea con compatibilidad para **Lector de Código de Barras USB o Bluetooth** (detecta `Enter` automático al escanear EAN-13).
   - Cuadrícula de productos favoritos de alta rotación (Pan, Leche, Gaseosas, Hielo, Cigarrillos) con botones grandes para sumar con 1 tap.
2. **Lado Derecho — Ticket Virtual y Cobro:**
   - Lista de ítems en canasta con botones `+` / `-` y botón papelera.
   - Subtotal, Descuentos aplicados y Total en Bs.
   - **Calculador de Cambio / Vuelto:** Teclado numérico táctil en pantalla con botones de billetes bolivianos rápidos: `Bs. 10`, `Bs. 20`, `Bs. 50`, `Bs. 100`, `Bs. 200`. Calcula instantáneamente el cambio.
   - Botones de cobro final: `[ Efectivo ]`, `[ Cobro QR ]`, `[ Tarjeta POS ]`.
   - Al cerrar la venta: descuenta automáticamente del inventario general y emite ticket de venta.

---

### 🏷️ Módulo 4: Gestor de Inventario y Catálogo (`InventoryManager`)

Control total sobre qué ven los vecinos en la tienda digital.

#### A. Vista de Tabla y Cuadrícula
* Filtros por categoría (`Lácteos`, `Bebidas`, `Snacks`, `Limpieza`, `Abarrotes`, etc.).
* Filtro rápido por estado: `Todos`, `En Stock`, `Bajo Stock (< 5)`, `Agotados`.
* Búsqueda en tiempo real por nombre, código de barras o SKU.
* **Control de Stock Inline:** Botones de suma y resta rápida directamente en la tabla sin abrir el modal.
* Switch de visibilidad en tienda (permite ocultar un producto temporalmente sin borrarlo).

#### B. Modal de Alta y Edición de Producto
* **Nombre del Producto:** Campo obligatorio.
* **Categoría:** Dropdown con autocompletado y opción de crear nueva categoría.
* **Precios:**
  - Precio de Venta (Bs.) *.
  - Precio de Costo (Bs.) (opcional, para métricas internas de ganancia bruta).
* **Control de Existencias:**
  - Stock actual.
  - Stock mínimo de alerta.
  - Unidad de medida (`Unidad`, `Kg`, `Litro`, `Paquete`, `Botella`).
* **Código de Barras / SKU:** Input con botón para autogenerar código o escanear con pistola.
* **Imagen del Producto:** Selector de imágenes locales o enlaces predefinidos optimizados con CDN.
* **Configuraciones Especiales:**
  - Switch `⭐ Producto Destacado / Favorito del Barrio`.
  - Switch `🏷️ En Oferta / Promoción Especial` (permite ingresar precio anterior tachado).

---

### 🔔 Módulo 5: Buzón de Solicitudes de Vecinos (`ProductRequestsAdmin`)

Transforma la demanda insatisfecha en ventas garantizadas.

* **Listado de Peticiones:** Muestra los productos que los vecinos pidieron mediante el botón `🔔 ¿Falta un producto? Pídelo`.
* **Métricas de Demanda:** Agrupa solicitudes iguales (ej. *"Leche Deslactosada 1L — 4 vecinos interesados en Torre Las Palmas"*).
* **Acciones del Dueño:**
  - `[ ➕ Agregar al Catálogo ]`: Abre el formulario de nuevo producto con el nombre ya completado.
  - `[ 💬 Avisar al Vecino por WhatsApp ]`: Notifica al vecino que su producto ya fue surtido y está listo para pedir.
  - `[ Descartar ]`: Marca la solicitud como no viable.

---

### ⚙️ Módulo 6: Configuración del Minimarket (`StoreSettings`)

Controla los parámetros comerciales y de entrega.

#### A. Identidad y Contacto
* Nombre de la Tienda, Slogan, Logo y Foto de Portada.
* Teléfono de contacto y **Número de WhatsApp de Pedidos** (formato internacional ej. `591XXXXXXXX`).
* Dirección física del local y coordenadas GPS aproximadas.

#### B. Cobertura Hiperlocal & Condominios
* Selector multi-tag de condominios y barrios asignados.
* Gestión de Torres/Bloques para facilitar la dirección al vecino en el checkout.

#### C. Políticas de Delivery & Pedidos
* Switch `Habilitar Envíos a Domicilio` (si se desactiva, la tienda opera solo para retiro en local).
* Costo fijo de envío (ej. `5.00 Bs.`) o `0.00 Bs.` (Gratis).
* **Monto Mínimo de Pedido (`minOrder`):** Monto mínimo para calificar a delivery (ej. `25.00 Bs.`).
* **Umbral de Envío Gratis:** Monto a partir del cual el delivery es bonificado (ej. `80.00 Bs.`).

#### D. Pasarela de Cobro QR Propia
* Subida de imagen del **Código QR de Cobro** (Simple QR de cualquier banco de Bolivia: BNB, BCP, Mercantil, Fie, Unión, etc.).
* Datos bancarios en texto: Banco, Número de Cuenta y Titular (con botón de copia rápida).

#### E. Gamificación VeciPuntos
* Switch `Activar Programa VeciPuntos`.
* Ratio de acumulación: Puntos por cada Bs. comprado (default `1 Bs. = 1 punto`).
* Configuración de recompensas canjeables (ej. 150 pts = Cupón de 10 Bs. de descuento).

---

## 4. Recursos Técnicos y Assets Necesarios

### 4.1. Archivos Multimedia
* `public/audio/Notificacion de orden de compra.mp3`: Timbre de sonido nítido para ingreso de pedidos.
* `public/images/defaults/store-cover-placeholder.webp`: Portada genérica para minimarkets.
* `public/images/defaults/qr-placeholder.png`: Imagen de demostración para el pago QR.

### 4.2. Librería de Iconos Requerida (`lucide-react`)
`LayoutDashboard`, `Kanban`, `Receipt`, `Package`, `Settings`, `MessageSquare`, `TrendingUp`, `AlertTriangle`, `Volume2`, `VolumeX`, `Plus`, `Edit2`, `Trash2`, `CheckCircle2`, `Clock`, `Truck`, `Store`, `QrCode`, `Banknote`, `CreditCard`, `Printer`, `Barcode`, `Users`, `Flame`, `Sparkles`, `Search`, `Filter`, `ArrowRight`, `ExternalLink`.

### 4.3. Reglas de Responsive Design y Dispositivos de Trabajo
* **Tablets y Laptops de Mostrador (1024px+):** Vista dividida o Kanban en 4 columnas simultáneas horizontales.
* **Smartphones (Mobile):** Kanban colapsable por pestañas de estado (`Pendientes (2)`, `Preparando (1)`, `En Camino (0)`), para facilitar el manejo con una mano mientras se atiende en mostrador.
* **Control de Errores y Confirmaciones:** Modales de confirmación con doble verificación antes de eliminar productos o cancelar pedidos pagados.
