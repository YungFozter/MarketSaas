import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  Sparkles, 
  BookOpen, 
  Compass, 
  Search, 
  CheckCircle2, 
  ArrowRight, 
  LayoutDashboard, 
  Store, 
  Receipt, 
  Package, 
  Truck, 
  Clock, 
  KeyRound, 
  Settings, 
  MessageCircle, 
  Printer, 
  Power, 
  DollarSign, 
  ChevronRight, 
  ChevronDown, 
  Zap, 
  ShieldCheck, 
  Lightbulb, 
  Smartphone, 
  Monitor, 
  AlertTriangle,
  QrCode,
  ExternalLink,
  Info
} from 'lucide-react';

export const StoreUserGuide = ({ onNavigateTab }) => {
  // Modo de visualización: 'simple' (Sencillo, breve y paso a paso) o 'detailed' (Detallado y exhaustivo)
  const [guideMode, setGuideMode] = useState('simple');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState('kanban');

  // Filtro de búsqueda
  const q = searchQuery.toLowerCase().trim();

  // Secciones del Modo Sencillo
  const simpleGuides = [
    {
      id: 'atender-pedido',
      title: '¿Cómo atender un pedido que envió un vecino desde su celular?',
      badge: 'Flujo Principal',
      badgeColor: 'emerald',
      icon: LayoutDashboard,
      targetTab: 'kanban',
      steps: [
        {
          step: 1,
          action: 'Escucha la campana y mira el Tablero Kanban',
          desc: 'Cuando un vecino realiza un pedido, sonará una campana y en la columna izquierda "Pendientes por Aceptar" aparecerá una tarjeta naranja con el nombre del cliente y los productos que pidió.'
        },
        {
          step: 2,
          action: 'Presiona el botón verde "Aceptar Pedido"',
          desc: 'Al tocarlo, la tarjeta se moverá al centro a la columna "En Preparación". El vecino verá en su celular que ya estás alistando sus productos.'
        },
        {
          step: 3,
          action: 'Almacena en bolsa y pulsa "Listo para Despacho" o "Entregar"',
          desc: 'Junta los productos en la bolsa del local. Si es con envío al departamento, presiona el botón verde con moto "Listo para Despacho". Si viene a recogerlo al mostrador, toca "Entregar Pedido".'
        },
        {
          step: 4,
          action: 'En la columna "Entregados", presiona "Cobrar / Finalizar"',
          desc: 'Al presionar este botón, el pedido se archiva con éxito, el dinero se suma a tu facturación del día y el stock queda descontado.'
        }
      ],
      tip: 'Si tienes dudas sobre un producto o sabor, en la misma tarjeta hay un botón verde con el ícono de WhatsApp. Tócalo para abrir una conversación directa con el vecino con un saludo ya escrito.'
    },
    {
      id: 'venta-rapida',
      title: '¿Cómo hacer una venta rápida a un cliente que está en el mostrador?',
      badge: 'Cobro Express',
      badgeColor: 'amber',
      icon: Store,
      targetTab: 'pos',
      steps: [
        {
          step: 1,
          action: 'Presiona el botón verde "Venta Rápida" arriba a la derecha (o tecla F10)',
          desc: 'No necesitas salir de donde estás. El botón verde de la barra superior abrirá una ventana de cobro inmediato en pantalla.'
        },
        {
          step: 2,
          action: 'Escribe el nombre del producto en el buscador o toca su foto',
          desc: 'Por ejemplo, teclea "leche" o "coca" y haz clic sobre el producto. Si compra más de una unidad, pulsa varias veces o usa el botón [+].'
        },
        {
          step: 3,
          action: 'Elige el método de pago en el lado derecho',
          desc: 'Si te paga en Efectivo, haz clic en el billete que te entregó (ej. Bs. 50) y el sistema te calculará el cambio/vuelto exacto en segundos. Si paga con QR, presiona "QR" para mostrar tu código.'
        },
        {
          step: 4,
          action: 'Presiona el botón verde "Cobrar y Finalizar"',
          desc: 'La venta se guardará de inmediato y la ventana se cerrará sola para que sigas atendiendo.'
        }
      ],
      tip: 'Puedes conectar una lectora de código de barras USB a tu computadora y pasar los productos directamente sin tocar el teclado.'
    },
    {
      id: 'abrir-cerrar',
      title: '¿Cómo poner mi tienda en ABIERTO o CERRADO en 1 segundo?',
      badge: 'Control en Vivo',
      badgeColor: 'rose',
      icon: Power,
      targetTab: 'schedule',
      steps: [
        {
          step: 1,
          action: 'Ubica el botón "ABIERTO" en la barra superior fija',
          desc: 'En la parte superior de tu pantalla verás un botón con una luz verde parpadeando que dice "ABIERTO".'
        },
        {
          step: 2,
          action: 'Haz un solo clic sobre el botón',
          desc: 'El botón cambiará inmediatamente a color rojo y mostrará el texto "CERRADO".'
        },
        {
          step: 3,
          action: 'Persistencia automática en la nube',
          desc: 'Al instante, todos los clientes verán en sus celulares que la tienda está cerrada y el sistema pausará la recepción de pedidos sin alterar tus horarios semanales.'
        },
        {
          step: 4,
          action: 'Para reabrir, vuelve a presionar el botón rojo',
          desc: 'Cambiará a verde de nuevo y tu catálogo volverá a recibir pedidos de inmediato.'
        }
      ],
      tip: 'También puedes usar los dos botones [ABIERTO] y [CERRADO] que están en la parte superior del panel lateral izquierdo.'
    },
    {
      id: 'anotar-fiado',
      title: '¿Cómo anotar un fiado a un vecino de confianza (Don Carlos / Torre B)?',
      badge: 'Cuentas Claras',
      badgeColor: 'sky',
      icon: BookOpen,
      targetTab: 'credits',
      steps: [
        {
          step: 1,
          action: 'En el menú lateral izquierdo, haz clic en "Libreta de Deudas"',
          desc: 'Tiene un ícono de libro azul. Aquí se guardan todas las cuentas fiadas de tu condominio o barrio.'
        },
        {
          step: 2,
          action: 'Si el cliente es nuevo, presiona "Nuevo Cliente Deudor"',
          desc: 'Escribe el nombre del vecino (ej. "Don Carlos"), su torre/departamento y su teléfono de WhatsApp.'
        },
        {
          step: 3,
          action: 'Dentro de su tarjeta, presiona "Anotar Fiado"',
          desc: 'Escribe el monto en bolivianos o selecciona los productos que se está llevando y presiona "Guardar".'
        },
        {
          step: 4,
          action: 'Cuando venga a pagar, presiona "Abonar"',
          desc: 'Escribe cuánto dinero te está entregando y el saldo se restará automáticamente. También puedes presionar "Cobrar por WhatsApp" para enviarle un recordatorio respetuoso con tu QR de cobro.'
        }
      ],
      tip: 'La libreta te avisa con un número rojo en el menú lateral cuántos vecinos tienen cuentas pendientes por pagar para que nunca se te pase ningún cobro.'
    },
    {
      id: 'modificar-stock-precios',
      title: '¿Cómo cambiar el precio de un producto o aumentar stock cuando llega mercadería?',
      badge: 'Inventario Ágil',
      badgeColor: 'violet',
      icon: Package,
      targetTab: 'inventory',
      steps: [
        {
          step: 1,
          action: 'En el menú lateral izquierdo, haz clic en "Inventario"',
          desc: 'Tiene un ícono de caja. Verás la lista de todos los productos que tienes a la venta.'
        },
        {
          step: 2,
          action: 'Busca el producto en la barra superior',
          desc: 'Escribe por ejemplo "aceite" o "coca cola" para encontrarlo al instante.'
        },
        {
          step: 3,
          action: 'Para ajustar stock: usa los botones [+] y [-]',
          desc: 'Pulsa el botón [+] para sumar las unidades que te dejó el distribuidor o haz clic en el número de stock y escribe la cifra exacta.'
        },
        {
          step: 4,
          action: 'Para cambiar el precio: haz clic sobre el precio actual',
          desc: 'Escribe el nuevo precio en bolivianos y presiona la tecla Enter. Se actualiza al instante en la tienda de los vecinos.'
        }
      ],
      tip: 'Si quieres agregar un producto que no existe en tu lista, presiona el botón verde "+ Nuevo Producto" arriba a la derecha y llena su nombre, foto, precio y stock.'
    },
    {
      id: 'configurar-horario-semanal',
      title: '¿Cómo programar mi horario para que la tienda abra y cierre sola?',
      badge: 'Automatización',
      badgeColor: 'emerald',
      icon: Clock,
      targetTab: 'schedule',
      steps: [
        {
          step: 1,
          action: 'En el menú lateral izquierdo, haz clic en "Horario"',
          desc: 'Tiene un ícono de reloj. Verás el Bento Hero con la hora oficial de Bolivia (UTC-4) y el calendario semanal.'
        },
        {
          step: 2,
          action: 'Asegúrate de que el modo esté en "Automático por Horario"',
          desc: 'Es la primera tarjeta de opciones. Esto le dice al sistema que obedezca el cronograma de lunes a domingo.'
        },
        {
          step: 3,
          action: 'En cada día de la semana, define si abre y sus horas',
          desc: 'Toca el botón "Abre / Cierra" para encender el día en verde. Luego ajusta la hora de apertura (ej. 08:00) y de cierre (ej. 22:00).'
        },
        {
          step: 4,
          action: 'Presiona el botón azul "Guardar Horarios Semanales"',
          desc: 'Al guardar, el sistema abrirá y cerrará automáticamente la tienda en la nube según la hora exacta boliviana.'
        }
      ],
      tip: 'Si necesitas cerrar antes por un imprevisto sin desconfigurar tus horas semanales, usa el modo "Siempre Cerrado (Manual)".'
    }
  ];

  // Secciones del Modo Detallado
  const detailedSections = [
    {
      id: 'header',
      title: '1. Encabezado Superior (Header Fijo & Barra de Estado)',
      subtitle: 'Control global visible en todo momento arriba de la pantalla',
      icon: LayoutDashboard,
      color: 'emerald',
      items: [
        {
          name: 'Selector de Vistas Globales (Arriba a la izquierda/centro)',
          desc: 'Permite alternar entre los 3 entornos de la plataforma: "INFO PLATAFORMA" (página de presentación del servicio), "PANTALLA VECINO" (vista del cliente para probar la experiencia de compra) y "PANTALLA DUEÑO" (tu centro de control privado).'
        },
        {
          name: 'Botón Menú Hamburguesa (Móviles)',
          desc: 'Ubicado en la esquina superior izquierda en pantallas pequeñas. Al presionarlo despliega la barra lateral completa con los 11 módulos de trabajo.'
        },
        {
          name: 'Nombre de la Tienda y Enlaces de Difusión',
          desc: 'Muestra el nombre de tu minimarket. A su lado cuenta con dos botones clave: el botón de [Copiar Enlace] (para pegar en grupos de vecinos) y el botón de [Compartir WhatsApp] (que redacta una invitación directa).'
        },
        {
          name: 'Insignia de Suscripción con Temporizador',
          desc: 'Chip redondeado que muestra si estás en período de Prueba o Plan Activo, con un reloj regresivo exacto. Al hacer clic te traslada directamente al módulo de renovación de suscripción.'
        },
        {
          name: 'Interruptor Central ABIERTO / CERRADO (Luz en Vivo)',
          desc: 'Botón de alta visibilidad con indicador luminoso pulsante. En verde indica que la tienda está recibiendo pedidos. En rojo indica tienda cerrada. Sincroniza al instante en Supabase para todos los clientes sin recargar la página.'
        },
        {
          name: 'Botón "Venta Rápida" (F10 / POS Express)',
          desc: 'Botón verde esmeralda con ícono de rayo/carrito. Al presionarlo se despliega una ventana modal de cobro inmediato en mostrador para registrar ventas físicas en 3 segundos sin salir del tablero de pedidos.'
        },
        {
          name: 'Interruptor de Sonido de Pedidos (Campanita)',
          desc: 'Controla la reproducción del audio "Notificación de orden de compra". Permite silenciar el timbre si estás en una llamada o activarlo para que ningún pedido pase desapercibido.'
        }
      ]
    },
    {
      id: 'sidebar',
      title: '2. Panel Lateral (Sidebar de Navegación Izquierdo)',
      subtitle: 'Acceso directo a los 11 módulos, estado operativo y perfil',
      icon: Monitor,
      color: 'slate',
      items: [
        {
          name: 'Tarjeta de Identidad del Minimarket',
          desc: 'Avatar circular con el logo de tu negocio, nombre de la tienda y slug único (ej. minimarket-ian).'
        },
        {
          name: 'Control Dual de Apertura Rápida',
          desc: 'Caja gris con dos botones directos: botón verde [ABIERTO] y botón rojo [CERRADO] para conmutar el estado del local con 1 solo toque.'
        },
        {
          name: 'Control de Alerta Sonora del Local',
          desc: 'Botón rápido para activar o silenciar las campanas del sistema de pedidos.'
        },
        {
          name: 'Navegación por los 11 Módulos Especializados',
          desc: 'Menú vertical con contadores numéricos y badges inteligentes en tiempo real que te avisan de pedidos pendientes, productos por agotarse, deudas por cobrar o proveedores que visitan hoy la tienda.'
        },
        {
          name: 'Botón "Cerrar Sesión" (Pie del panel)',
          desc: 'Botón rojo con ícono de salida para cerrar tu sesión de forma segura y proteger la cuenta si compartes el equipo con empleados o familiares.'
        }
      ]
    },
    {
      id: 'kanban',
      title: '3. Tablero Kanban de Pedidos (Cockpit Operativo Principal)',
      subtitle: 'Flujo de preparación y despacho de pedidos web en 3 columnas',
      icon: LayoutDashboard,
      color: 'amber',
      targetTab: 'kanban',
      items: [
        {
          name: 'Filtro Temporal y Métricas Bento Superiores',
          desc: 'Tres botones para filtrar pedidos: [Hoy], [Últimas 24 Horas] y [Todos]. Incluye tarjetas de resumen con ventas en bolivianos, cantidad de órdenes y ticket promedio.'
        },
        {
          name: 'Columna 1: Pendientes por Aceptar (Naranja / Ámbar)',
          desc: 'Muestra los pedidos recién emitidos por los vecinos. Cada tarjeta incluye número de orden, hora, nombre, dirección/torre, teléfono, método de pago y lista detallada de productos.'
        },
        {
          name: 'Botón [Aceptar Pedido]',
          desc: 'Mueve el pedido a preparación y actualiza en tiempo real la pantalla de seguimiento del vecino indicándole que su compra fue aceptada.'
        },
        {
          name: 'Botón [WhatsApp Directo]',
          desc: 'Abre un chat directo con el cliente con un mensaje de confirmación pre-redactado para consultar detalles o enviar foto de productos sustitutos.'
        },
        {
          name: 'Botón [Imprimir Comanda Térmica]',
          desc: 'Genera el ticket formateado para pegarlo en la bolsa del pedido, compatible con impresoras de 58mm y 80mm.'
        },
        {
          name: 'Botón [Rechazar Pedido]',
          desc: 'Permite desestimar un pedido en caso de falta de stock o fuerza mayor, liberando la reserva de productos.'
        },
        {
          name: 'Columna 2: En Preparación (Azul Cielo)',
          desc: 'Contiene las órdenes que estás armando en tus estantes. Incluye el botón verde [Listo para Despacho] con ícono de moto para alertar que el pedido ya sale a entrega.'
        },
        {
          name: 'Columna 3: Entregados / Completados (Verde Esmeralda)',
          desc: 'Pedidos finalizados con éxito. Al pulsar [Cobrar / Finalizar] el pedido queda archivado en el Historial de Ventas.'
        }
      ]
    },
    {
      id: 'pos',
      title: '4. Punto de Venta (POS Mostrador & Terminal de Caja)',
      subtitle: 'Cobro ágil a clientes presenciales con cálculo de vuelto y QR',
      icon: Store,
      color: 'emerald',
      targetTab: 'pos',
      items: [
        {
          name: 'Buscador Instantáneo & Lector de Códigos',
          desc: 'Barra de texto para escribir el nombre de cualquier producto o recibir lecturas automáticas desde un escáner de código de barras.'
        },
        {
          name: 'Cuadrícula Visual de Productos y Filtro de Categorías',
          desc: 'Botones de categorías (Bebidas, Lácteos, Abarrotes, Limpieza, etc.) y tarjetas con fotos y precios. Un toque agrega una unidad al ticket.'
        },
        {
          name: 'Panel Lateral de Ticket de Venta',
          desc: 'Visualización clara de los ítems agregados, botones [+] y [-] para ajustar cantidades, botón de papelera y subtotal acumulado en Bs.'
        },
        {
          name: 'Método de Cobro: Efectivo con Calculadora de Vuelto',
          desc: 'Casillas de billetes bolivianos sugeridos (Bs. 10, 20, 50, 100, 200). Al hacer clic en un billete, el sistema calcula de inmediato el cambio a devolver.'
        },
        {
          name: 'Método de Cobro: Pago QR',
          desc: 'Muestra el código QR bancario de tu tienda en pantalla para que el cliente lo escanee con su aplicación bancaria móvil.'
        },
        {
          name: 'Método de Cobro: Al Fiado (Cargar a Deuda)',
          desc: 'Permite seleccionar a un vecino de la Libreta de Deudas para entregarle los productos a cuenta sin exigir dinero en ese momento.'
        },
        {
          name: 'Botón [Cobrar Venta (F10)]',
          desc: 'Finaliza la transacción, descuenta las existencias del inventario y opcionalmente imprime el comprobante térmico.'
        }
      ]
    },
    {
      id: 'sales',
      title: '5. Historial de Ventas (Auditoría Financiera y Reportes)',
      subtitle: 'Registro cronológico de todas las ventas cobradas o anuladas',
      icon: Receipt,
      color: 'sky',
      targetTab: 'sales',
      items: [
        {
          name: 'Tarjetas de Facturación Acumulada',
          desc: 'Muestra el total recaudado en el período, desglosado entre cobros en efectivo y cobros digitales (QR/Transferencia).'
        },
        {
          name: 'Buscador de Recibos y Filtros de Fecha',
          desc: 'Permite buscar por número de ticket, cajero o cliente, con filtros rápidos por día, semana o mes.'
        },
        {
          name: 'Tabla Detallada de Transacciones',
          desc: 'Listado completo con fecha, hora exacta, método de pago, ítems comercializados, importe en Bs. y estado de la orden.'
        },
        {
          name: 'Reimpresión y Anulación de Ventas',
          desc: 'Botón de impresora para reimprimir cualquier ticket anterior y botón de anular venta para restaurar el stock si el cliente devolvió la compra.'
        },
        {
          name: 'Botón [Exportar a Excel / CSV]',
          desc: 'Descarga un archivo con todas las transacciones para control contable o declaraciones tributarias.'
        }
      ]
    },
    {
      id: 'credits',
      title: '6. Libreta de Deudas (Gestión de Fiados Vecinales)',
      subtitle: 'Control estricto de créditos de confianza sin papeles ni pérdidas',
      icon: BookOpen,
      color: 'rose',
      targetTab: 'credits',
      items: [
        {
          name: 'Métricas de Cartera de Crédito',
          desc: 'Muestra en letras rojas grandes el Saldo Total por Cobrar en la comunidad y la cantidad de vecinos con deudas activas.'
        },
        {
          name: 'Botón [+ Nuevo Cliente Deudor]',
          desc: 'Registra a un vecino con su nombre completo, condominio/torre/casa, celular de WhatsApp y límite de crédito autorizado.'
        },
        {
          name: 'Ficha Individual de Cada Vecino',
          desc: 'Tarjeta con foto/avatar, saldo deudor actual y fecha de su último consumo fiado.'
        },
        {
          name: 'Botón [Anotar Fiado]',
          desc: 'Permite sumar una nueva deuda ingresando el monto directamente o seleccionando los productos que se llevó.'
        },
        {
          name: 'Botón [Abonar Pago]',
          desc: 'Registra pagos parciales o liquidación total en efectivo o QR, restando la deuda en tiempo real.'
        },
        {
          name: 'Botón [Cobrar por WhatsApp]',
          desc: 'Genera un mensaje formal, educado y automático con el desglose exacto de lo adeudado y el QR de tu tienda para que te transfiera desde su hogar.'
        }
      ]
    },
    {
      id: 'inventory',
      title: '7. Inventario y Catálogo de Productos',
      subtitle: 'Control de existencias, precios de compra y venta y alertas de stock',
      icon: Package,
      color: 'violet',
      targetTab: 'inventory',
      items: [
        {
          name: 'Contadores de Salud de Stock',
          desc: 'Muestra tres métricas clave: Total de productos activos, Productos con stock bajo (en amarillo) y Productos agotados (en rojo).'
        },
        {
          name: 'Buscador y Selector de Categorías',
          desc: 'Permite filtrar por familia de productos para encontrar rápidamente cualquier artículo del catálogo.'
        },
        {
          name: 'Botón [+ Nuevo Producto]',
          desc: 'Abre el formulario para subir foto (o seleccionar del banco oficial), ingresar nombre, código de barras, categoría, costo, precio de venta, stock inicial y stock mínimo de alarma.'
        },
        {
          name: 'Edición en Línea de Precios y Stock',
          desc: 'No necesitas abrir menús engorrosos: haz clic sobre el precio para modificarlo y pulsa [+] o [-] en el stock para actualizar existencias al instante.'
        },
        {
          name: 'Control de Visibilidad y Eliminación',
          desc: 'Permite pausar un producto para que no aparezca temporalmente en la web o eliminarlo definitivamente.'
        }
      ]
    },
    {
      id: 'suppliers',
      title: '8. Proveedores & Calendario de Preventistas',
      subtitle: 'Organización de pedidos a distribuidores oficiales y días de visita',
      icon: Truck,
      color: 'amber',
      targetTab: 'suppliers',
      items: [
        {
          name: 'Alerta Inteligente "Visitas de Hoy"',
          desc: 'Banner que te notifica automáticamente cuáles distribuidores (ej. PIL, Coca-Cola, Sofía) visitan tu tienda el día de hoy según el día de la semana.'
        },
        {
          name: 'Directorio de Empresas Proveedoras',
          desc: 'Fichas de distribuidores con nombre de la compañía, nombre del preventista, contacto telefónico, monto de pedido mínimo y días fijos de visita.'
        },
        {
          name: 'Botón [+ Agregar Proveedor]',
          desc: 'Registra un nuevo proveedor o distribuidor con sus días de atención para mantener tu tienda siempre abastecida.'
        }
      ]
    },
    {
      id: 'requests',
      title: '9. Buzón de Vecinos (Peticiones Especiales de Clientes)',
      subtitle: 'Descubre qué productos buscan tus clientes y amplía tus ventas',
      icon: Sparkles,
      color: 'sky',
      targetTab: 'requests',
      items: [
        {
          name: 'Listado de Solicitudes Vecinales',
          desc: 'Muestra los productos que los clientes buscaron en la web y no encontraron, o que sugirieron expresamente a través del botón "Pedir un producto".'
        },
        {
          name: 'Contador de Votos y Demanda',
          desc: 'Indica cuántos vecinos distintos han solicitado ese mismo producto para priorizar su abastecimiento.'
        },
        {
          name: 'Botón [Incorporar al Inventario]',
          desc: 'Convierte la petición del vecino en un producto oficial de tu inventario en 1 solo clic para que empieces a venderlo de inmediato.'
        }
      ]
    },
    {
      id: 'schedule',
      title: '10. Horario de Atención Semanal (Hora Oficial Bolivia UTC-4)',
      subtitle: 'Configuración de apertura y cierre automático y control manual',
      icon: Clock,
      color: 'emerald',
      targetTab: 'schedule',
      items: [
        {
          name: 'Bento Hero Card con Reloj Oficial de Bolivia',
          desc: 'Muestra la hora oficial boliviana en tiempo real (UTC-4) con indicación visual de si la tienda figura abierta o cerrada.'
        },
        {
          name: 'Selector de Modos Operativos (3 opciones)',
          desc: '1. "Automático por Horario" (la tienda abre y cierra sola según el cronograma semanal). 2. "Siempre Abierto" (atención continua 24/7 o días de fiesta). 3. "Siempre Cerrado" (pausa temporal o emergencia sin borrar los horarios configurados).'
        },
        {
          name: 'Grilla de Días de la Semana (Lunes a Domingo)',
          desc: 'Cada día cuenta con interruptor "Abre / Cierra" y selectores de hora de inicio y hora de fin.'
        },
        {
          name: 'Mensaje de Cierre Personalizado',
          desc: 'Casilla para escribir una nota que verán los vecinos cuando la tienda esté cerrada (ej. "Volvemos a las 15:00 hrs tras el almuerzo").'
        },
        {
          name: 'Botón [Guardar Horarios Semanales]',
          desc: 'Guarda la configuración con persistencia permanente en la nube de Supabase.'
        }
      ]
    },
    {
      id: 'subscription',
      title: '11. Mi Suscripción (Vigencia y Renovación)',
      subtitle: 'Gestión del plan de servicio MarketSaaS y pago mediante QR',
      icon: KeyRound,
      color: 'violet',
      targetTab: 'subscription',
      items: [
        {
          name: 'Panel de Estado del Plan',
          desc: 'Indica si tu cuenta está activa, la fecha exacta de expiración y el tiempo restante.'
        },
        {
          name: 'Renovación Rápida con QR Bancario',
          desc: 'Muestra el código QR oficial de MarketSaaS para transferir el costo del servicio desde cualquier aplicación bancaria.'
        },
        {
          name: 'Activación Inmediata',
          desc: 'Garantiza el funcionamiento ininterrumpido del Punto de Venta, pedidos web y control de inventario.'
        }
      ]
    },
    {
      id: 'settings',
      title: '12. Configuración General de la Tienda',
      subtitle: 'Personalización de marca, ubicación, métodos de cobro y entregas',
      icon: Settings,
      color: 'slate',
      targetTab: 'settings',
      items: [
        {
          name: 'Identidad Comercial',
          desc: 'Nombre oficial del minimarket, eslogan llamativo y teléfonos de contacto para llamadas y WhatsApp de pedidos.'
        },
        {
          name: 'Ubicación y Condominios Asignados',
          desc: 'Dirección física del local, zona de cobertura, condominios autorizados para entregas y coordenadas en el mapa.'
        },
        {
          name: 'Métodos de Pago & Subida de Código QR',
          desc: 'Permite subir la foto de tu propio código QR de cobro bancario (Banco Unión, BCP, BNB, etc.) y tus datos de cuenta para que los clientes te transfieran directamente a ti.'
        },
        {
          name: 'Banners de Portada y Logo',
          desc: 'Personalización de la imagen de portada y fotografía principal de tu minimarket en el catálogo vecinal.'
        }
      ]
    }
  ];

  // Filtro de guías según búsqueda
  const filteredSimpleGuides = useMemo(() => {
    if (!q) return simpleGuides;
    return simpleGuides.filter(g => 
      g.title.toLowerCase().includes(q) ||
      g.desc?.toLowerCase().includes(q) ||
      g.badge.toLowerCase().includes(q) ||
      g.steps.some(s => s.action.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q))
    );
  }, [q, simpleGuides]);

  const filteredDetailedSections = useMemo(() => {
    if (!q) return detailedSections;
    return detailedSections.filter(s => 
      s.title.toLowerCase().includes(q) ||
      s.subtitle.toLowerCase().includes(q) ||
      s.items.some(i => i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q))
    );
  }, [q, detailedSections]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-24 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER DE LA GUÍA                                                 */}
      {/* ========================================================================= */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 overflow-hidden">
        {/* Luces decorativas ambient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>Manual de Operación Oficial del Dueño</span>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Sistema MarketSaaS • Versión Dueño
            </div>
          </div>

          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              ¿Cómo Usar la Pantalla de Dueño?
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Aprende a dominar cada rincón de tu minimarket: desde recibir y preparar pedidos de tus vecinos, registrar ventas rápidas en mostrador, controlar fiados hasta programar tus horarios automáticos.
            </p>
          </div>

          {/* Selector de Modo Sencillo vs Detallado */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800/80">
            {/* Toggle Segmentado */}
            <div className="inline-flex bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80 shadow-inner">
              <button
                type="button"
                onClick={() => setGuideMode('simple')}
                className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  guideMode === 'simple'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/25 scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Zap className="w-4 h-4 shrink-0" />
                <span>Modo Sencillo (Paso a Paso)</span>
              </button>

              <button
                type="button"
                onClick={() => setGuideMode('detailed')}
                className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  guideMode === 'detailed'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-400/25 scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Modo Detallado (Manual Maestro)</span>
              </button>
            </div>

            {/* Buscador Rápido de Ayuda */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar duda, botón o función..."
                className="w-full bg-slate-950/80 border border-slate-700/90 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTENIDO MODO SENCILLO                                                */}
      {/* ========================================================================= */}
      {guideMode === 'simple' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Banner explicativo modo sencillo */}
          <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div className="text-xs sm:text-sm text-emerald-950 space-y-1">
              <p className="font-extrabold">
                Guía Rápida para el Día a Día:
              </p>
              <p className="text-emerald-800 leading-relaxed font-medium">
                Aquí encuentras soluciones directas a las tareas más frecuentes que realizas en tu tienda, explicadas paso a paso con los nombres exactos de los botones que debes presionar.
              </p>
            </div>
          </div>

          {/* Lista de Tarjetas Paso a Paso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredSimpleGuides.map((guide, idx) => {
              const Icon = guide.icon;
              return (
                <div 
                  key={guide.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header de la tarjeta */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
                        <Icon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide border ${
                        guide.badgeColor === 'emerald' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        guide.badgeColor === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        guide.badgeColor === 'rose' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                        guide.badgeColor === 'sky' ? 'bg-sky-50 text-sky-800 border-sky-200' :
                        'bg-violet-50 text-violet-800 border-violet-200'
                      }`}>
                        {guide.badge}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      {guide.title}
                    </h3>

                    {/* Pasos numerados */}
                    <div className="space-y-3 pt-1">
                      {guide.steps.map((st) => (
                        <div key={st.step} className="flex items-start gap-3 text-xs sm:text-sm">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            {st.step}
                          </span>
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-900 block">
                              {st.action}
                            </span>
                            <span className="text-slate-600 font-medium text-xs leading-relaxed block">
                              {st.desc}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tip destacado */}
                    {guide.tip && (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-700 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="font-medium leading-relaxed">
                          <strong className="text-slate-900 font-bold">Consejo útil:</strong> {guide.tip}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botón directo a la sección */}
                  {guide.targetTab && onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab(guide.targetTab)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200/80 hover:border-emerald-300"
                    >
                      <span>Abrir esta sección en la pantalla</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {filteredSimpleGuides.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
              <Search className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-800">No encontramos pasos relacionados con "{searchQuery}"</p>
              <p className="text-xs text-slate-500">Prueba con palabras como "pedido", "venta", "horario", "stock" o "fiado".</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CONTENIDO MODO DETALLADO                                               */}
      {/* ========================================================================= */}
      {guideMode === 'detailed' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Banner explicativo modo detallado */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-xs sm:text-sm text-amber-950 space-y-1">
              <p className="font-extrabold">
                Manual Maestro Completo (Sin omitir nada):
              </p>
              <p className="text-amber-900 leading-relaxed font-medium">
                Esta guía detalla de forma exhaustiva la ubicación exacta, funcionalidad, botones y diseño de cada sección del sistema en la Pantalla Dueño para que no quede ninguna duda operativa.
              </p>
            </div>
          </div>

          {/* Menú de acceso rápido a las secciones detalladas */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
              Índice de Secciones del Sistema:
            </span>
            <div className="flex flex-wrap gap-2">
              {detailedSections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setExpandedSection(sec.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    expandedSection === sec.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {sec.title.split('.')[1] || sec.title}
                </button>
              ))}
            </div>
          </div>

          {/* Secciones detalladas acordeón */}
          <div className="space-y-4">
            {filteredDetailedSections.map((sec) => {
              const isExpanded = expandedSection === sec.id;
              const Icon = sec.icon;

              return (
                <div 
                  key={sec.id}
                  className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                    isExpanded 
                      ? 'border-slate-300 shadow-md ring-2 ring-slate-900/5' 
                      : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  {/* Encabezado del módulo */}
                  <div 
                    onClick={() => setExpandedSection(isExpanded ? '' : sec.id)}
                    className="p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Icon className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900">
                          {sec.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium">
                          {sec.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {sec.targetTab && onNavigateTab && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateTab(sec.targetTab);
                          }}
                          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200/80 transition-colors cursor-pointer"
                        >
                          <span>Ir al Módulo</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="w-8 h-8 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-700">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Contenido detallado desplegable */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 pt-2 border-t border-slate-100 space-y-4 animate-fadeIn">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sec.items.map((item, i) => (
                          <div 
                            key={i} 
                            className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 space-y-1.5 hover:bg-white hover:shadow-xs transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                                {item.name}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-normal pl-4">
                              {item.desc}
                            </p>
                          </div>
                        ))}
                      </div>

                      {sec.targetTab && onNavigateTab && (
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => onNavigateTab(sec.targetTab)}
                            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                          >
                            <span>Abrir {sec.title.split('.')[1] || sec.title} en Vivo</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredDetailedSections.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
              <Search className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-800">No encontramos secciones para "{searchQuery}"</p>
              <p className="text-xs text-slate-500">Prueba con palabras como "header", "kanban", "pos", "horario" o "inventario".</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FOOTER DE SOPORTE & ASISTENCIA                                         */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>¿Tienes alguna consulta adicional o caso especial?</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            El equipo de soporte de MarketSaaS está disponible para ayudarte a configurar tus impresoras, sincronizar inventarios o personalizar tu catálogo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const phone = '59172125280';
            const msg = encodeURIComponent('Hola equipo de MarketSaaS, requiero asistencia con la Pantalla Dueño de mi minimarket.');
            window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
          }}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Contactar Soporte WhatsApp</span>
        </button>
      </div>
    </div>
  );
};
