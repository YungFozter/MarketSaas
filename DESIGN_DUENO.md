# Vista Dueño / Panel MiniMarket — Guía y Especificación de Diseño (DESIGN.md)

Este documento contiene la especificación completa, diseño visual, arquitectura de componentes, flujos operativos, secciones y recursos necesarios para el **Panel de Control del Dueño de Tienda / Minimarket** en MarketSaaS.

El archivo de especificación detallada con tokens de diseño, colores y tipografía se encuentra disponible en:
📁 [Stitch/stitch_marketsaas_pantallaDueno/DESIGN.md](file:///e:/Proyectos/MarketSaaS/Stitch/stitch_marketsaas_pantallaDueno/DESIGN.md)

---

## Resumen Ejecutivo de Módulos para el Dueño

1. **Header Operativo Pegajoso:**
   - Switch en vivo `[ 🟢 ABIERTO ]` / `[ 🔴 CERRADO ]`
   - Alerta acústica con audio MP3 (`Notificacion de orden de compra.mp3`)
   - Previsualización rápida como vecino `[ 👁️ Vista Vecino ]`

2. **Módulo 1: Dashboard de Métricas:**
   - Ventas del día (Bs.), ticket promedio, pedidos activos y alertas de stock crítico.
   - Gráfico de horas pico de demanda.

3. **Módulo 2: Tablero Kanban de Pedidos en Vivo:**
   - Flujo de 4 etapas reactivas: `Pendientes` 🟡, `En Preparación` 🔵, `En Camino` 🟣, `Entregados` 🟢.
   - Checklist interactivo de empaque ítem por ítem.
   - Conexión directa a WhatsApp con mensajes contextuales pre-armados.
   - Impresión de comanda térmica para mostrador (58mm / 80mm).

4. **Módulo 3: Punto de Venta de Mostrador (POS Terminal):**
   - Lector de código de barras USB/Bluetooth con detección automática.
   - Cuadrícula táctil de favoritos de alta rotación (Pan, Bebidas, Lácteos).
   - Calculador de cambio con botones rápidos de billetes en Bolivianos (10, 20, 50, 100, 200 Bs.).

5. **Módulo 4: Gestor de Inventario:**
   - Edición rápida de stock inline (`+` / `-`).
   - Modal completo de alta de productos con código de barras, fotos, precio de costo y venta.

6. **Módulo 5: Buzón de Solicitudes de Vecinos:**
   - Concentrador de productos agotados o solicitados por vecinos.
   - Creación de producto a partir de la sugerencia en 1 clic.

7. **Módulo 6: Configuración del Comercio:**
   - Datos de la tienda, número de WhatsApp para pedidos.
   - Condominios y torres asignadas.
   - Tarifas y pedido mínimo para delivery (`minOrder`).
   - Imagen de código QR de cobro (Simple QR) y datos de transferencia bancaria.
   - Reglas del Club de VeciPuntos.
