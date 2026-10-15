# Guía Integral de la Vista Dueño y Propuesta de Valor · MarketSaaS

> **Documento Oficial de Producto & Propuesta Comercial**  
> **Plataforma:** MarketSaaS — Sistema Operativo y Comercio Hiperlocal para Minimarkets, Tiendas de Barrio y Condominios  
> **Destinatarios:** Propietarios de tiendas, administradores de minimarkets, equipo comercial y soporte  

---

## 1. Visión General: ¿Qué es la Vista Dueño?

La **Vista Dueño** (Panel de Control de Comerciante) es el centro de mando operativo, financiero y comercial de **MarketSaaS**. Ha sido diseñada específicamente para la realidad de los micromercados, pulperías y tiendas de barrio en condominios residenciales y urbanizaciones de Bolivia y Latinoamérica.

A diferencia de los sistemas contables genéricos o las aplicaciones de delivery masivas (que cobran comisiones asfixiantes y son lentas), la Vista Dueño combina en una sola interfaz táctil y ultrarrápida:
1. **Atención física veloz** (Punto de Venta POS de mostrador con lector de código de barras y cobro QR).
2. **Despacho digital sin intermediarios** (Recepción organizada de pedidos web y WhatsApp con comanda térmica y alertas sonoras).
3. **Control total del dinero y stock** (Inventario en tiempo real, arqueo de caja diario y libreta digital de fiados).

---

## 2. Recorrido Detallado Pantalla por Pantalla

A continuación se detalla cada pantalla, submódulo y herramienta disponible en la Vista Dueño, explicando su objetivo operativo, qué funciones ofrece y el beneficio directo para el negocio.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CABECERA OPERATIVA EN VIVO                      │
│   [🟢 ABIERTO / 🔴 CERRADO]  •  [🔔 SONIDO ALERTA]  •  [👁️ VISTA VECINO]  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴──────────────────────────────┐
    │                                                              │
┌───▼──────────────────────────┐    ┌──────────────────────────────▼───┐
│     OPERACIÓN Y PEDIDOS      │    │      CONTROL Y ADMINISTRACIÓN     │
├──────────────────────────────┤    ├──────────────────────────────────┤
│ 1. Tablero Kanban de Pedidos │    │ 5. Gestor de Inventario & Stock  │
│ 2. Punto de Venta (POS)      │    │ 6. Libreta Digital de Fiados     │
│ 3. Historial de Ventas       │    │ 7. Arqueo y Cierre de Caja       │
│ 4. Buzón de Pedidos Vecinos  │    │ 8. Directorio de Proveedores     │
│                              │    │ 9. Reportes Financieros & Excel  │
│                              │    │ 10. Resumen Semanal de Métricas  │
│                              │    │ 11. Configuración & Cobros QR    │
│                              │    │ 12. Horarios de Apertura         │
│                              │    │ 13. Kit de Impresión POP         │
│                              │    │ 14. Mi Suscripción               │
└──────────────────────────────┘    └──────────────────────────────────┘
```

---

### Pantalla 0: Cabecera Operativa En Vivo (Sticky Top Bar)

*Disponible permanentemente en la parte superior del panel.*

* **Objetivo:** Brindar control instantáneo sobre el estado de la tienda sin necesidad de entrar a menús profundos.
* **Funcionalidades:**
  * **Switch Maestro `[ 🟢 ABIERTO ]` / `[ 🔴 CERRADO ]`:** Con un solo clic, la tienda abre o cierra sus puertas digitales. Si está cerrado, los vecinos ven un aviso claro con el horario de reapertura sin poder enviar pedidos fuera de hora.
  * **Alerta Acústica de Pedidos Nuevos (`Sonido: ACTIVO / SILENCIADO`):** Dispara un timbre sonoro de alta audibilidad (`Notificacion de orden de compra.mp3`) cada vez que ingresa un pedido digital, asegurando que el tendero no lo pase por alto aunque esté ordenando estantes o atendiendo a otro cliente.
  * **Botón `[ 👁️ Vista Vecino ]`:** Permite alternar en un segundo a la vista de cliente para comprobar cómo ven los vecinos los productos, ofertas y precios en ese instante.
  * **Botón `[ 📲 Compartir Tienda ]`:** Despliega el enlace corto oficial y código QR para compartir en los grupos de WhatsApp del condominio o barrio con un solo toque.

---

### Pantalla 1: Tablero Kanban de Pedidos en Vivo (`activeTab = 'kanban'`)

* **Objetivo:** Eliminar el caos de comandas de papel y mensajes dispersos de WhatsApp, centralizando todos los pedidos en una cadena de preparación visual.
* **Para qué sirve:**
  * Organiza los pedidos en **4 columnas reactivas en tiempo real**:
    1. **Pendientes 🟡:** Pedidos recién enviados por vecinos que requieren confirmación y revisión de stock.
    2. **En Preparación 🔵:** Pedidos confirmados en proceso de empaque en mostrador.
    3. **En Camino 🟣:** Pedidos en tránsito hacia la torre, departamento o puerta del vecino (o listos para ser retirados en mostrador).
    4. **Entregados 🟢:** Pedidos finalizados y cobrados con éxito.
  * **Checklist Interactivo de Empaque:** Dentro de cada tarjeta de pedido, el tendero marca producto por producto conforme los coloca en la bolsa. Esto elimina en un 100% las quejas por "olvidos de productos".
  * **Impresión de Comanda Térmica (58mm / 80mm):** Imprime con un solo clic el ticket térmico con el detalle del pedido, dirección, método de pago y teléfono del cliente para pegar en la bolsa.
  * **Conexión Directa con WhatsApp:** Botones con mensajes pre-redactados para avisar al vecino: *"Tu pedido ya está en camino a Torre B Depto 402"* o *"Ya puedes pasar a retirar tu pedido"*.
  * **Filtros Rápidos:** Segmentación por pedidos de Delivery vs. Retiro en Mostrador.

---

### Pantalla 2: Punto de Venta de Mostrador (`activeTab = 'pos'`)

* **Objetivo:** Atender a los clientes presenciales en la caja con la máxima velocidad, sustituyendo la calculadora tradicional.
* **Para qué sirve:**
  * **Lector de Código de Barras USB, Bluetooth y Cámara Móvil:** Escanea productos a gran velocidad con detección de códigos duplicados y suma automática al carrito.
  * **Cuadrícula Táctil de Favoritos:** Botones grandes de un toque para los artículos de mayor rotación matutina y diaria (Pan marraqueta/sarnita, leche en bolsa, gaseosas, botellones de agua, huevos).
  * **Calculadora Inteligente de Cambio en Bolivianos:** Teclado táctil con botones rápidos de billetes nacionales (**Bs. 10, 20, 50, 100 y 200**) que calcula de inmediato el cambio exacto a devolver al cliente, evitando equivocaciones de caja en horas pico.
  * **Opciones Multicobro:** Permite cerrar la venta en:
    * **Efectivo** (con cálculo de vuelto).
    * **QR Simple** (muestra el código QR de cobro en pantalla para que el cliente escanee desde su app bancaria).
    * **Fiado / Crédito** (asigna la cuenta a la ficha del vecino sin necesidad de anotar en papel).
  * **Emisión de Comprobante:** Imprime el ticket de venta o lo envía directo al WhatsApp del cliente si lo solicita.

---

### Pantalla 3: Gestor Integral de Inventario & Catálogo (`activeTab = 'inventory'`)

* **Objetivo:** Mantener el stock y los precios siempre al día con el menor esfuerzo posible.
* **Para qué sirve:**
  * **Semáforo de Stock en Tiempo Real:** Alertas visuales automáticas cuando un artículo está en **Stock Crítico** (rojo) o **Stock Bajo** (amarillo) según el umbral mínimo definido por el dueño.
  * **Ajuste Rápido Inline (`+` / `-`):** Modificación del inventario físico en un clic (+1, -1, +5 unidades) directo desde la tabla, ideal cuando entra mercadería en medio del día.
  * **Alta Completa de Productos:**
    * Código de barras (tipeado o escaneado).
    * Nombre, descripción y categoría.
    * Precio de costo y precio de venta (con cálculo automático del porcentaje de margen de ganancia).
    * Stock actual y stock mínimo de seguridad.
    * Foto del producto (subida desde galería o captura directa con la cámara del celular mediante `ProductCameraModal`).
    * Multiplicador de **VeciPuntos** y etiqueta de oferta/descuento.
  * **Catálogo Semilla Boliviano (`SeedCatalogModal`):** Base de datos precargada con cientos de productos típicos de minimarkets en Bolivia (PIL, Arcor, Coca-Cola, Cervecería Boliviana Nacional, Sofía, Fagal, etc.). Permite activar productos populares en 1 solo clic con fotos y descripciones listas, sin tener que crearlos desde cero.
  * **Rendimiento Individual (`ProductPerformanceModal`):** Muestra el margen real, total de unidades vendidas y nivel de rotación de cada ítem, detectando productos "hueso" (dinero estancado) y productos estrella.

---

### Pantalla 4: Libreta Digital de Fiados / Gestión de Crédito (`activeTab = 'credits'`)

* **Objetivo:** Reemplazar el tradicional "cuaderno de fiados" que se pierde, se desgasta, genera tachaduras y provoca discusiones con los clientes.
* **Para qué sirve:**
  * **Fichas Individuales de Vecinos de Confianza:** Búsqueda rápida por nombre, teléfono o ubicación (ej. *Torre Los Ceibos - Dpto 502*).
  * **Límite de Crédito Personalizado:** Permite establecer un tope máximo de deuda (ej. Bs. 200). Si el cliente intenta superar el límite, el sistema emite una alerta.
  * **Historial Detallado de Consumo:** Cada producto fiado queda registrado con fecha, hora exacta, cantidad y valor unitario.
  * **Registro Transparente de Abonos:** Registra pagos parciales o cancelaciones totales en efectivo o QR, recalculando el saldo al instante.
  * **Cobro Amistoso por WhatsApp en 1 Clic:** Envía un mensaje formal, educado y transparente al WhatsApp del vecino con el desglose exacto de lo consumido y la imagen del código QR bancario de la tienda para que pague desde el sofá sin excusas.

---

### Pantalla 5: Arqueo y Cierre de Caja Diario (`CashRegisterModal`)

* **Objetivo:** Garantizar que todo el dinero que ingresa y sale durante el turno cuadre al centavo.
* **Para qué sirve:**
  * **Apertura de Caja:** Registro del monto inicial de sencillo en caja (cambio base).
  * **Registro de Gastos Menores y Retiros:** Anotación de salidas de dinero durante el turno (pago al proveedor del pan, compra de hielo, retiro de ganancias personales).
  * **Arqueo Ciego / Supervisado:** Al finalizar el turno o jornada, el sistema compara el dinero físico contado contra las ventas registradas discriminadas por:
    * Total Cobrado en Efectivo.
    * Total Cobrado por QR Simple.
    * Total Fiado / En Cuenta Corriente.
  * **Detección de Descuadres:** Alerta automática en caso de sobrante o faltante en caja.
  * **Cierre Definitivo e Impresión:** Genera un ticket de resumen del día listo para archivar o enviar por PDF.

---

### Pantalla 6: Historial de Ventas & Analíticas (`activeTab = 'sales'`)

* **Objetivo:** Llevar un registro histórico completo y auditable de todas las operaciones realizadas.
* **Para qué sirve:**
  * Visualización cronológica de cada ticket emitido (canal de origen: Mostrador POS vs. Catálogo Web/WhatsApp).
  * Filtros por rango de fechas, estado de pago y modalidad de entrega.
  * **Re-impresión de Comprobantes Térmicos:** Reemisión de tickets en caso de extravío.
  * **Anulaciones Controladas:** Opción de anular ventas erróneas con restitución inmediata y automática de las unidades al inventario.

---

### Pantalla 7: Exportación de Reportes de Ventas (`ExportSalesReportModal`)

* **Objetivo:** Facilitar la contabilidad, cálculo de impuestos o control personal del comerciante.
* **Para qué sirve:**
  * Exporta los datos de ventas e inventario a formatos universales: **Excel (.xlsx)**, **CSV** y **PDF**.
  * Permite descargar cierres mensuales para el contador o balance semanal para socios familiares.

---

### Pantalla 8: Resumen Semanal de Desempeño (`WeeklySummaryModal`)

* **Objetivo:** Entregar inteligencia de negocio visual al dueño para tomar mejores decisiones comerciales.
* **Para qué sirve:**
  * Gráficos de tendencias de ventas semanales.
  * Identificación de los **días de mayor facturación** y las **horas pico** de mayor concurrencia.
  * Ranking de los **10 productos más vendidos** de la semana.
  * Evolución del ticket promedio (cuánto gasta un vecino en promedio por compra).

---

### Pantalla 9: Gestor de Proveedores & Reposición (`activeTab = 'suppliers'`)

* **Objetivo:** Evitar quedarse sin mercadería clave por olvidar los días de visita de los distribuidores.
* **Para qué sirve:**
  * **Directorio de Marcas y Preventistas:** Registro de empresas (PIL Andina, Embol Coca-Cola, Arcor, Sofía, etc.), contactos directos de los preventistas y condiciones de entrega.
  * **Planificador de Visitas:** Calendario semanal que indica qué preventista visita la tienda hoy (con badge destacado *"Hoy"* en el menú lateral).
  * **Generador Automático de Pedido Sugerido:** Analiza los productos con stock bajo asignados a ese proveedor y genera automáticamente una lista de compra lista para enviar por WhatsApp al preventista en 2 clics.

---

### Pantalla 10: Buzón de Solicitudes de Vecinos (`activeTab = 'requests'`)

* **Objetivo:** Convertir el desabastecimiento en oportunidades de venta directa.
* **Para qué sirve:**
  * En la vista de catálogo, cuando un vecino busca un producto y no lo encuentra, puede pulsar: *"¿No encontraste lo que buscabas? Pídelo aquí"*.
  * Esas solicitudes llegan de inmediato a este buzón en la Vista Dueño.
  * El dueño ve cuántos vecinos están pidiendo ese producto en particular y cuenta con un botón para **"Crear Producto en Inventario"** con un solo toque, avisando al cliente cuando la mercadería esté en tienda.

---

### Pantalla 11: Horarios de Atención (`activeTab = 'schedule'`)

* **Objetivo:** Informar con exactitud a la comunidad los momentos de servicio y programar aperturas automatizadas.
* **Para qué sirve:**
  * Configuración de horarios por turnos (ej. Turno Mañana: 07:30 a 13:00 / Turno Tarde: 16:30 a 22:30).
  * Asignación de días laborables y días de descanso (domingos o feriados).
  * Estado automático del comercio que cambia a "Cerrado" al cumplirse la hora, mostrando al cliente cuánto falta para la próxima apertura.

---

### Pantalla 12: Configuración del Comercio & Cobros QR (`activeTab = 'settings'`)

* **Objetivo:** Personalizar la identidad, alcance geográfico y métodos de cobro de la tienda.
* **Para qué sirve:**
  * **Identidad de Marca:** Nombre comercial, slogan, logo y número oficial de WhatsApp para despacho.
  * **Configuración de Cobro QR Simple Bancario:** Subida de la imagen del código QR de la cuenta bancaria del dueño (Banco Unión, BCP, BNB, Mercantil Santa Cruz, etc.). Los vecinos pagan directamente a la cuenta del dueño sin intermediarios.
  * **Asignación de Cobertura y Condominios:** Selección de las torres, bloques o radio de entrega atendidos.
  * **Tarifas de Delivery y Pedido Mínimo (`AdminDeliveryRatesModal`):** Definición de costo de envío (ej. Entrega gratis en la misma torre, Bs. 3 a torres adyacentes, o envío gratis en compras mayores a Bs. 50).
  * **Club de Fidelización "VeciPuntos":** Ajuste de las reglas de puntos (ej. 1 VeciPunto por cada Bs. 5 de compra) y catálogo de recompensas que canjean los vecinos.

---

### Pantalla 13: Kit de Impresión POP (`StorePrintKitModal`)

* **Objetivo:** Atraer a los vecinos hacia la tienda digital sin gastar en diseñadores ni agencias publicitarias.
* **Para qué sirve:**
  * Genera con 1 clic materiales gráficos listos para imprimir en tamaño carta o sticker:
    * **Afiche para Ascensor y Portería:** *"¡Haz tus compras desde tu departamento! Escanea y recibe en 10 minutos"*.
    * **Cartel de Mostrador y Vitrina con QR Grande:** Para que los clientes presenciales guarden la tienda en sus teléfonos.
    * **Stickers de Delivery:** Con el logo y contacto para pegar en las bolsas de entrega.

---

### Pantalla 14: Guía de Usuario Interactiva (`activeTab = 'guide'`)

* **Objetivo:** Facilitar la curva de aprendizaje de cualquier persona que atienda el negocio.
* **Para qué sirve:**
  * Manual práctico con capturas y explicaciones sencillas para capacitar a familiares, dependientes o nuevos cajeros en menos de 15 minutos sin requerir conocimientos técnicos previos.

---

### Pantalla 15: Mi Suscripción (`activeTab = 'subscription'`)

* **Objetivo:** Mantener claridad sobre la vigencia del servicio, métodos de pago de la plataforma y canales directos de soporte técnico.

---

## 3. ¿Por qué un Minimarket o Tienda de Barrio DEBERÍA SUSCRIBIRSE a MarketSaaS?

El éxito de una tienda de barrio o minimarket en condominio depende de su capacidad de retener a sus vecinos y operar con agilidad. A continuación se presentan las razones contundentes por las cuales suscribirse a **MarketSaaS** es la mejor decisión comercial para el comerciante:

---

### 1. 0% de Comisión por Venta: Todo el Dinero va a tu Bolsillo

* **El problema de las apps tradicionales (Rappi, PedidosYa):** Cobran entre un **18% y 25% de comisión** sobre cada venta. En un minimarket, donde el margen de ganancia promedio en abarrotes y bebidas ronda el 15% al 25%, utilizar esas aplicaciones significa **trabajar gratis o a pérdida**.
* **La ventaja de MarketSaaS:** MarketSaaS cobra una suscripción mensual fija y accesible. **0% de comisión por producto vendido.** Si vendes Bs. 5.000 o Bs. 50.000 en el mes, pagas exactamente la misma suscripción fija.

---

### 2. Recuperación Inmediata de la Inversión (ROI en 2 Días)

| Plan | Inversión Mensual | Costo Diario Aproximado | Equivalencia en la Vida Real |
| :--- | :---: | :---: | :--- |
| **Plan Básico** | **Bs. 75 / mes** | **≈ Bs. 2,50 al día** | Menos de lo que cuesta una soda de 2 litros a la semana o un paquete de galletas. |
| **Plan Pro** | **Bs. 129 / mes** | **≈ Bs. 4,30 al día** | Menos de un café o una empanada al día. |

> 💡 **La regla de las 2 ventas:** Con solo **2 pedidos recuperados al mes** que antes se perdían porque el vecino no bajó al minimarket o porque la tienda estaba con la reja cerrada, **la suscripción del mes completo queda 100% pagada**. Todo pedido adicional es ganancia neta para el negocio.

---

### 3. Vendes Mientras Otros Duermen o Cierran la Reja (+35% de Incremento en Ventas)

* Cuando el vecino llega tarde del trabajo, llueve torrencialmente o está en pijama un domingo por la noche, no baja a la calle. Si tu tienda tiene MarketSaaS:
  * El vecino abre tu catálogo desde su celular sin instalar ninguna aplicación pesada.
  * Arma su pedido con precios actualizados y paga con QR en 30 segundos.
  * Tu tienda recibe el pedido ordenado y listo para entregar.
* **Estadística comprobada:** Los comercios que incorporan catálogo digital y pedidos por WhatsApp registran en promedio un **+35% de incremento en su facturación mensual**.

---

### 4. Adiós al Desorden de WhatsApp: De 10 Minutos a 30 Segundos por Pedido

* **Sin MarketSaaS:**
  * El vecino escribe: *«¿Tienes leche blanca?»*
  * El tendero responde 5 minutos después: *«Sí, tengo PIL en bolsa y botella»*
  * El vecino: *«¿A cuánto está? ¿Y tienes pan?»*
  * Resultado: 10 a 15 minutos de mensajes de ida y vuelta para una venta de Bs. 15, saturando la atención de los clientes presentes en el mostrador.
* **Con MarketSaaS:**
  * El vecino entra a tu enlace, ve las fotos, stock y precios exactos, añade los productos a la cesta y te envía el pedido estructurado con total calculado y comprobante QR adjunto.
  * El tendero solo revisa el Kanban, empaca y despacha en menos de 2 minutos.

---

### 5. Recuperación del Dinero de Fiados Olvidados

* Los cuadernos de papel tradicionales tienen tres grandes problemas: hojas arrancadas, letra ilegible y la incomodidad de cobrar en persona.
* Con la **Libreta Digital de Fiados**:
  * Todo saldo está respaldado producto por producto.
  * El botón de cobro por WhatsApp genera un mensaje cordial con el saldo exacto y el código QR de cobro de tu banco.
  * El vecino puede pagar al instante desde su banca móvil a cualquier hora, disminuyendo la cartera morosa en más de un **80%**.

---

### 6. Mucho Más Barato y Eficiente que un Empleado Adicional

* Contratar a un ayudante para mostrador y pedidos representa:
  * Salario básico mensual: **Bs. 2.750+**
  * Aportes, refrigerios y contingencias: **~Bs. 450**
  * Costo total: **Más de Bs. 3.200 al mes** (cubriendo únicamente 8 horas al día).
* **MarketSaaS cuesta solo Bs. 75 al mes**, opera **24 horas al día, 7 días a la semana**, no comete errores al sumar y te ahorra más de **Bs. 37.500 al año**.

---

### 7. Fidelización Vecinal con VeciPuntos

* Los supermercados grandes usan tarjetas de puntos para retener clientes. Con MarketSaaS, el minimarket de barrio compite de igual a igual:
  * Cada compra suma **VeciPuntos** para el departamento del vecino.
  * Los vecinos prefieren comprar en el minimarket de su propio edificio o cuadra para acumular beneficios antes que ir al supermercado distante.

---

### 8. Cero Riesgo: Prueba Gratuita y Sin Contratos de Permanencia

* **15 Días de Prueba 100% Gratis:** El dueño puede poner a funcionar su tienda, probar las alertas sonoras y recibir pedidos reales antes de pagar un solo centavo.
* **Sin Contratos Forzosos:** Se cancela en cualquier momento si el comerciante así lo decide, sin penalizaciones ni letras chicas.
* **Puesta en Marcha en 15 Minutos:** Gracias al Catálogo Semilla Boliviano, no se requiere ser experto en computación para tener la tienda en línea el mismo día.

---

## 4. Tabla Comparativa Resumen: El Cuaderno Tradicional vs. MarketSaaS

| Característica / Situación | Manejo Tradicional (Cuaderno / Teléfono) | Con MarketSaaS (Vista Dueño) |
| :--- | :--- | :--- |
| **Disponibilidad para vender** | Solo cuando la reja está abierta físicamente. | 24/7 mediante catálogo web interactivo. |
| **Cobro de cuentas fiadas** | Discusiones, cuentas dudosas y papel arrugado. | Estado de cuenta digital transparente con QR por WhatsApp. |
| **Control de inventario** | Desconocimiento del stock hasta que el producto falta. | Semáforo en vivo de stock crítico y alertas mínimas. |
| **Cambios de precios** | Errores constantes por vender barato mercadería nueva. | Actualización en 2 clics reflejada en todo el sistema. |
| **Atención en caja** | Sumas a mano o calculadora tradicional con errores. | POS táctil con billetes bolivianos y lector de barras. |
| **Comisión por delivery** | Hasta 25% en apps de intermediación. | **0% comisión.** Todo el dinero va a tu cuenta. |
| **Cierre diario de turno** | Horas contando billetes y deduciendo gastos. | Arqueo automático discriminado por Efectivo, QR y Fiado. |
| **Imagen ante la comunidad** | Tienda tradicional con demoras y fricción. | Minimarket moderno, formal, veloz y tecnológico. |

---

## 5. Conclusión

La **Vista Dueño de MarketSaaS** no es simplemente un catálogo de productos: es el **sistema operativo integral para el minimarket moderno**. Otorga al comerciante independiente las mismas ventajas tecnológicas de las grandes cadenas minoristas internacionales, pero preservando la calidez, confianza y rentabilidad de la tienda de barrio.

Suscribirse a MarketSaaS no representa un gasto, sino la **inversión de mayor retorno financiero y tranquilidad operativa** que un comerciante puede hacer en su negocio.
