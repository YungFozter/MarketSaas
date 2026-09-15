// Generador e Inventarios de Productos Deterministas para las 43 Tiendas de Santa Cruz
// DISTRIBUCIÓN: Entre el 1er Anillo y Máximo 6to Anillo.
// REGLA: Cada tienda tiene inventario propio variado (18-26 productos).
// Los productos esenciales se repiten con variaciones realistas de precio (±Bs. 0.50 - 1.00).

// --- POOL MAESTRO DE PRODUCTOS BOLIVIANOS REALISTAS ---
const MASTER_PRODUCTS = {
  // === ESENCIALES QUE SE REPITEN CON VARIACIÓN ===
  cocaCola2L: {
    baseName: 'Coca-Cola Sabor Original 2L',
    category: 'Bebidas & Refrescos',
    basePrice: 13.50,
    costPrice: 10.80,
    unit: 'Botella 2L',
    image: '/products/coca-cola-2l.png',
    description: 'Gaseosa Coca-Cola sabor original descartable de 2 Litros bien fría.',
    badge: 'Más Vendido',
    emoji: '🥤'
  },
  lechePil1L: {
    baseName: 'Leche Pil Natural Entera 1L',
    category: 'Lácteos & Huevos',
    basePrice: 6.50,
    costPrice: 5.50,
    unit: 'Bolsa 1L',
    image: '/products/leche-pil.png',
    description: 'Leche fluida pasteurizada entera Pil Andina, ideal para toda la familia.',
    badge: 'Básico del Día',
    emoji: '🥛'
  },
  huevosDocena: {
    baseName: 'Huevos Frescos de Granja (Docena)',
    category: 'Lácteos & Huevos',
    basePrice: 12.00,
    costPrice: 9.50,
    unit: 'Docena',
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80',
    description: 'Huevos frescos medianos seleccionados, yema dorada natural garantizada.',
    badge: 'Frescura Garantizada',
    emoji: '🥚'
  },
  panMarraqueta: {
    baseName: 'Pan Marraqueta Tradicional (x5 unidades)',
    category: 'Panadería & Desayuno',
    basePrice: 5.00,
    costPrice: 3.50,
    unit: 'Bolsa x5u',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    description: 'Pan marraqueta crujiente y caliente, horneado dos veces al día.',
    badge: 'Horneado Hoy',
    emoji: '🥖'
  },
  aguaVital2L: {
    baseName: 'Agua Mineral Vital Sin Gas 2L',
    category: 'Bebidas & Refrescos',
    basePrice: 7.00,
    costPrice: 5.20,
    unit: 'Botella 2L',
    image: '/products/agua-vital.jpg',
    description: 'Agua purificada sin gas Vital en botella de 2 Litros.',
    badge: 'Saludable',
    emoji: '💧'
  },
  aceiteFino: {
    baseName: 'Aceite Vegetal Fino Clásico 900ml',
    category: 'Despensa & Abarrotes',
    basePrice: 13.50,
    costPrice: 11.20,
    unit: 'Botella 900ml',
    image: '/products/aceite-fino-1800ml.png',
    description: 'Aceite comestible 100% puro de soya Fino, ideal para cocinar y freír.',
    badge: 'Esencial Cocina',
    emoji: '🍳'
  },
  azucarGuabira: {
    baseName: 'Azúcar Blanca Refinada Guabirá 1kg',
    category: 'Despensa & Abarrotes',
    basePrice: 6.50,
    costPrice: 5.20,
    unit: 'Bolsa 1kg',
    image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80',
    description: 'Azúcar blanca pura de caña industria boliviana Guabirá 1kg.',
    badge: 'Básico',
    emoji: '🍚'
  },
  arrozGranoOro: {
    baseName: 'Arroz Grano de Oro Grano Largo 1kg',
    category: 'Despensa & Abarrotes',
    basePrice: 8.50,
    costPrice: 6.80,
    unit: 'Bolsa 1kg',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    description: 'Arroz seleccionado Grano de Oro, cocción graneada perfecta.',
    badge: 'Favorito del Hogar',
    emoji: '🌾'
  },
  galletasMabels: {
    baseName: 'Galletas Mabel’s Cremositas Vainilla',
    category: 'Snacks & Golosinas',
    basePrice: 4.00,
    costPrice: 2.80,
    unit: 'Paquete 120g',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80',
    description: 'Galletas dulces rellenas con crema sabor vainilla Mabel’s.',
    badge: 'Merienda',
    emoji: '🍪'
  },
  papelScott: {
    baseName: 'Papel Higiénico Scott Rinde Más 4u',
    category: 'Limpieza & Hogar',
    basePrice: 11.50,
    costPrice: 8.90,
    unit: 'Pack 4 rollos',
    image: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=600&auto=format&fit=crop&q=80',
    description: 'Papel higiénico doble hoja suave y resistente Scott pack familiar de 4 rollos.',
    badge: 'Ahorro Pack',
    emoji: '🧻'
  },

  // === PRODUCTOS ZONA EQUIPETROL / SIRARI / AMBASSADOR / LAS BRISAS (PREMIUM / DELI) ===
  vinoCamposSolana: {
    baseName: 'Vino Tinto Campos de Solana Malbec 750ml',
    category: 'Bebidas & Refrescos',
    basePrice: 52.00,
    costPrice: 41.00,
    unit: 'Botella 750ml',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80',
    description: 'Vino boliviano de altura del valle de Tarija, notas frutales intensas.',
    badge: 'Vino de Altura',
    emoji: '🍷'
  },
  cervezaHuari: {
    baseName: 'Cerveza Huari Tradicional 330ml',
    category: 'Bebidas & Refrescos',
    basePrice: 12.00,
    costPrice: 9.20,
    unit: 'Botella 330ml',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&auto=format&fit=crop&q=80',
    description: 'Cerveza lager boliviana premium elaborada con agua pura de vertientes.',
    badge: 'Fría al Paso',
    emoji: '🍺'
  },
  cervezaCorona: {
    baseName: 'Cerveza Corona Extra 355ml',
    category: 'Bebidas & Refrescos',
    basePrice: 14.00,
    costPrice: 10.80,
    unit: 'Botella 355ml',
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&auto=format&fit=crop&q=80',
    description: 'Cerveza clara importada Corona Extra, servida bien helada.',
    badge: 'Importada',
    emoji: '🍻'
  },
  quesoGoudaMenorita: {
    baseName: 'Queso Menorita Gouda Holandés 400g',
    category: 'Lácteos & Huevos',
    basePrice: 32.00,
    costPrice: 25.50,
    unit: 'Pieza 400g',
    image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80',
    description: 'Queso madurado de colonia menonita, sabor suave y cremoso ideal para picadas.',
    badge: 'Artesanal',
    emoji: '🧀'
  },
  jamonSerranoSofia: {
    baseName: 'Jamón Serrano Curado Sofía 100g',
    category: 'Carnes & Embutidos',
    basePrice: 24.00,
    costPrice: 18.50,
    unit: 'Blíster 100g',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
    description: 'Finas lonchas de jamón curado nacional Sofía listo para servir.',
    badge: 'Gourmet',
    emoji: '🥩'
  },
  monsterEnergy: {
    baseName: 'Energizante Monster Energy Green 473ml',
    category: 'Bebidas & Refrescos',
    basePrice: 18.00,
    costPrice: 13.80,
    unit: 'Lata 473ml',
    image: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=600&auto=format&fit=crop&q=80',
    description: 'Bebida energizante Monster Energy original, máxima energía.',
    badge: 'Energía Total',
    emoji: '⚡'
  },
  pringlesOriginal: {
    baseName: 'Papas Pringles Original 137g',
    category: 'Snacks & Golosinas',
    basePrice: 22.00,
    costPrice: 17.50,
    unit: 'Tubo 137g',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
    description: 'Papas fritas en tubo Pringles Original crujientes.',
    badge: 'Snack Premium',
    emoji: '🥔'
  },
  chocolatesParaTi: {
    baseName: 'Chocolates Para Ti Surtido Sucre 150g',
    category: 'Snacks & Golosinas',
    basePrice: 28.00,
    costPrice: 21.00,
    unit: 'Caja 150g',
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80',
    description: 'Bombones y tabletas de chocolate fino artesanal boliviano Para Ti Sucre.',
    badge: 'Dulce Tradición',
    emoji: '🍫'
  },
  hieloRolito: {
    baseName: 'Bolsa de Hielo Rolito Cristalino 3kg',
    category: 'Bebidas & Refrescos',
    basePrice: 10.00,
    costPrice: 6.50,
    unit: 'Bolsa 3kg',
    image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=600&auto=format&fit=crop&q=80',
    description: 'Hielo en cubos cilíndricos purificado para refrescos y bebidas.',
    badge: 'Esencial Fin de Semana',
    emoji: '🧊'
  },

  // === PRODUCTOS ZONA CENTRO / CASCO VIEJO / MONSEÑOR RIVERO / BUSCH ===
  cafeNescafe50g: {
    baseName: 'Café Nescafé Clásico Frasco 50g',
    category: 'Panadería & Desayuno',
    basePrice: 16.00,
    costPrice: 12.80,
    unit: 'Frasco 50g',
    image: '/products/cafe-nescafe-160g.png',
    description: 'Café instantáneo 100% puro sabor intenso y aroma inconfundible Nescafé.',
    badge: 'Desayuno Clásico',
    emoji: '☕'
  },
  teWindsorClasico: {
    baseName: 'Té Windsor Negro Clásico 20 sobres',
    category: 'Panadería & Desayuno',
    basePrice: 7.50,
    costPrice: 5.50,
    unit: 'Caja 20 sobres',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    description: 'Té negro boliviano tradicional Windsor aroma reconfortante.',
    badge: 'Té Caliente',
    emoji: '🍵'
  },
  empanadasSantaClara: {
    baseName: 'Empanadas Santa Clara de Pollo (x2 unidades)',
    category: 'Panadería & Desayuno',
    basePrice: 12.00,
    costPrice: 8.50,
    unit: 'Porción x2',
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80',
    description: 'Empanadas cruceñas horneadas con relleno jugoso de pollo y verduras.',
    badge: 'Horneado al Minuto',
    emoji: '🥟'
  },
  cunapeTradicional: {
    baseName: 'Cuñapés Tradicionales Cruceños (x5 unidades)',
    category: 'Panadería & Desayuno',
    basePrice: 10.00,
    costPrice: 6.80,
    unit: 'Bolsa x5u',
    image: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=600&auto=format&fit=crop&q=80',
    description: 'Típico cuñapé almidón y abundante queso chaqueño derretido.',
    badge: 'Típico Camba',
    emoji: '🧀'
  },
  cocaColaPersonal: {
    baseName: 'Coca-Cola Personal 500ml Fría',
    category: 'Bebidas & Refrescos',
    basePrice: 6.00,
    costPrice: 4.20,
    unit: 'Botella 500ml',
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&auto=format&fit=crop&q=80',
    description: 'Botella personal Coca-Cola retornable o descartable helada para beber al paso.',
    badge: 'Bebida al Paso',
    emoji: '🥤'
  },
  yogurtPilFrutilla: {
    baseName: 'Yogurt Bebible Pil Frutilla 1L',
    category: 'Lácteos & Huevos',
    basePrice: 11.50,
    costPrice: 9.00,
    unit: 'Botella 1L',
    image: 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=600&auto=format&fit=crop&q=80',
    description: 'Yogurt natural bebible sabor frutilla enriquecido con vitaminas.',
    badge: 'Fresco',
    emoji: '🍓'
  },
  galletasOreo: {
    baseName: 'Galletas Oreo Chocolate Tubo 117g',
    category: 'Snacks & Golosinas',
    basePrice: 7.00,
    costPrice: 5.20,
    unit: 'Tubo 117g',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&auto=format&fit=crop&q=80',
    description: 'Galletas de cacao rellenas con crema de vainilla Oreo.',
    badge: 'Favorito',
    emoji: '🍪'
  },
  cervezaPacena710: {
    baseName: 'Cerveza Paceña Pilsener 710ml',
    category: 'Bebidas & Refrescos',
    basePrice: 14.00,
    costPrice: 10.80,
    unit: 'Botella 710ml',
    image: 'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?w=600&auto=format&fit=crop&q=80',
    description: 'Cerveza Paceña rubia tradicional 710ml bien fría de heladera.',
    badge: 'Tradición',
    emoji: '🍺'
  },
  redBull250: {
    baseName: 'Bebida Energizante Red Bull 250ml',
    category: 'Bebidas & Refrescos',
    basePrice: 17.00,
    costPrice: 13.00,
    unit: 'Lata 250ml',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    description: 'Red Bull vitaliza cuerpo y mente en lata personal 250ml fría.',
    badge: 'Energizante',
    emoji: '⚡'
  },
  atunVanCamps: {
    baseName: 'Atún en Lomitos en Aceite Van Camp’s 170g',
    category: 'Despensa & Abarrotes',
    basePrice: 12.50,
    costPrice: 9.80,
    unit: 'Lata 170g',
    image: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=600&auto=format&fit=crop&q=80',
    description: 'Lomitos selectos de atún en aceite vegetal Van Camp’s abrefácil.',
    badge: 'Proteína Fácil',
    emoji: '🐟'
  },

  // === PRODUCTOS ZONA URBARI / LAS PALMAS / HAMACAS / 3ER ANILLO (PARRILLA / FAMILIA) ===
  carbonQuebracho: {
    baseName: 'Carbón Vegetal de Quebracho Blanco 3kg',
    category: 'Limpieza & Hogar',
    basePrice: 20.00,
    costPrice: 14.00,
    unit: 'Bolsa 3kg',
    image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80',
    description: 'Carbón vegetal de encendido rápido y brasa duradera para churrasco cruceño.',
    badge: 'Fin de Semana',
    emoji: '🔥'
  },
  chorizoParrilleroSofia: {
    baseName: 'Chorizo Parrillero Ahumado Sofía 500g',
    category: 'Carnes & Embutidos',
    basePrice: 24.00,
    costPrice: 18.50,
    unit: 'Paquete 500g',
    image: 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=600&auto=format&fit=crop&q=80',
    description: 'Chorizos parrilleros de cerdo condimentados y ahumados listos para asar.',
    badge: 'Churrasco Sofía',
    emoji: '🌭'
  },
  salsaBarbacoaKris: {
    baseName: 'Salsa Barbacoa Kris Doypack 200g',
    category: 'Despensa & Abarrotes',
    basePrice: 8.50,
    costPrice: 6.20,
    unit: 'Doypack 200g',
    image: 'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=600&auto=format&fit=crop&q=80',
    description: 'Salsa BBQ dulce y ahumada Kris para carnes a la parrilla y costillas.',
    badge: 'Condimento',
    emoji: '🥫'
  },
  quesoChaquenoAsar: {
    baseName: 'Queso Criollo Chaqueño para Asar 500g',
    category: 'Lácteos & Huevos',
    basePrice: 22.00,
    costPrice: 16.50,
    unit: 'Pieza 500g',
    image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=600&auto=format&fit=crop&q=80',
    description: 'Queso criollo de campo cruceño que no se desmorona en las brasas.',
    badge: 'Típico Chaqueño',
    emoji: '🧀'
  },
  mantequillaRegia: {
    baseName: 'Mantequilla Regia con Sal Pote 200g',
    category: 'Lácteos & Huevos',
    basePrice: 14.50,
    costPrice: 11.50,
    unit: 'Pote 200g',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80',
    description: 'Mantequilla pura de vaca con un toque de sal para tostadas y repostería.',
    badge: 'Desayuno',
    emoji: '🧈'
  },
  jugoDelValleDurazno: {
    baseName: 'Néctar Del Valle Durazno Tetra 1L',
    category: 'Bebidas & Refrescos',
    basePrice: 9.50,
    costPrice: 7.20,
    unit: 'Caja 1L',
    image: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=600&auto=format&fit=crop&q=80',
    description: 'Jugo natural de fruta Del Valle enriquecido con pulpa de durazno.',
    badge: 'Refrescante',
    emoji: '🍑'
  },
  lecheDeslactosadaPil: {
    baseName: 'Leche Pil Deslactosada Light 1L',
    category: 'Lácteos & Huevos',
    basePrice: 7.00,
    costPrice: 5.80,
    unit: 'Bolsa 1L',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80',
    description: 'Leche deslactosada de digestión ligera Pil Andina en sachet de 1 Litro.',
    badge: 'Digestión Fácil',
    emoji: '🥛'
  },
  salchichasPielSofia: {
    baseName: 'Salchichas con Piel Sofía Paquete 500g',
    category: 'Carnes & Embutidos',
    basePrice: 18.50,
    costPrice: 14.20,
    unit: 'Paquete 500g',
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80',
    description: 'Salchichas clásicas con piel Sofía para hot dogs y salchipapas familiares.',
    badge: 'Sofía Calidad',
    emoji: '🌭'
  },
  mayonesaKris: {
    baseName: 'Mayonesa Kris Cremosa Doypack 200g',
    category: 'Despensa & Abarrotes',
    basePrice: 6.50,
    costPrice: 4.80,
    unit: 'Doypack 200g',
    image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=600&auto=format&fit=crop&q=80',
    description: 'Mayonesa nacional Kris textura suave y toque de limón.',
    badge: 'Aderezo',
    emoji: '🍟'
  },
  limpiapisosPoett: {
    baseName: 'Limpiapisos Desinfectante Poett Lavanda 900ml',
    category: 'Limpieza & Hogar',
    basePrice: 11.50,
    costPrice: 8.50,
    unit: 'Botella 900ml',
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80',
    description: 'Limpiador líquido aromático desinfectante con fragancia prolongada de lavanda.',
    badge: 'Aroma Fresco',
    emoji: '🧹'
  },
  detergenteOmo: {
    baseName: 'Detergente en Polvo Omo Multiacción 800g',
    category: 'Limpieza & Hogar',
    basePrice: 14.00,
    costPrice: 10.80,
    unit: 'Bolsa 800g',
    image: '/products/omo-limon-1.8k.png',
    description: 'Detergente concentrado remueve manchas difíciles en ropa blanca y de color.',
    badge: 'Limpieza Total',
    emoji: '🧺'
  },

  // === PRODUCTOS ZONA 4TO, 5TO Y 6TO ANILLO (DESPENSA FAMILIAR / POPULAR) ===
  harinaBlancaflor: {
    baseName: 'Harina de Trigo 000 Blancaflor 1kg',
    category: 'Despensa & Abarrotes',
    basePrice: 8.00,
    costPrice: 6.20,
    unit: 'Bolsa 1kg',
    image: 'https://images.unsplash.com/photo-1627485937980-221c88ac04f9?w=600&auto=format&fit=crop&q=80',
    description: 'Harina de trigo leudante o 000 Blancaflor para queques y masas.',
    badge: 'Repostería',
    emoji: '🌾'
  },
  fideoFamosaEspagueti: {
    baseName: 'Fideo Espagueti Famosa Paquete 400g',
    category: 'Despensa & Abarrotes',
    basePrice: 5.50,
    costPrice: 4.10,
    unit: 'Paquete 400g',
    image: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&auto=format&fit=crop&q=80',
    description: 'Pasta de sémola de trigo duro Famosa industria boliviana.',
    badge: 'Almuerzo Rápido',
    emoji: '🍝'
  },
  mapleHuevos30: {
    baseName: 'Maple de Huevos Frescos (30 unidades)',
    category: 'Lácteos & Huevos',
    basePrice: 28.00,
    costPrice: 22.50,
    unit: 'Maple 30u',
    image: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=600&auto=format&fit=crop&q=80',
    description: 'Bandeja completa de 30 huevos de granja frescos para el mes.',
    badge: 'Ahorro Familiar',
    emoji: '🥚'
  },
  mortadelaSofia: {
    baseName: 'Mortadela Primavera Sofía 250g',
    category: 'Carnes & Embutidos',
    basePrice: 9.50,
    costPrice: 7.20,
    unit: 'Pieza 250g',
    image: 'https://images.unsplash.com/photo-1524438418049-ab2acb7aa48f?w=600&auto=format&fit=crop&q=80',
    description: 'Embutido cocido con vegetales y especias Sofía para sándwiches escolares.',
    badge: 'Merienda Escolar',
    emoji: '🥪'
  },
  hamburguesasSofia4u: {
    baseName: 'Hamburguesas de Carne Sofía Caja 4u',
    category: 'Carnes & Embutidos',
    basePrice: 16.00,
    costPrice: 12.50,
    unit: 'Caja 4 unidades',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    description: 'Medallones de carne vacuna sazonados congelados listos para sartén.',
    badge: 'Cena Rápida',
    emoji: '🍔'
  },
  nuggetsSofia: {
    baseName: 'Nuggets de Pollo Crocantes Sofía 400g',
    category: 'Carnes & Embutidos',
    basePrice: 21.50,
    costPrice: 16.80,
    unit: 'Bolsa 400g',
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80',
    description: 'Bocaditos de pechuga de pollo empanizados y crujientes Sofía.',
    badge: 'Favorito Niños',
    emoji: '🍗'
  },
  salsaTomateKris: {
    baseName: 'Salsa de Tomate Tradicional Kris 200g',
    category: 'Despensa & Abarrotes',
    basePrice: 4.50,
    costPrice: 3.20,
    unit: 'Doypack 200g',
    image: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=600&auto=format&fit=crop&q=80',
    description: 'Salsa de tomate condimentada con laurel y orégano para guisos y fideos.',
    badge: 'Cocina Práctica',
    emoji: '🍅'
  },
  salLobos: {
    baseName: 'Sal Marina Yodada y Fluorada Lobos 1kg',
    category: 'Despensa & Abarrotes',
    basePrice: 3.50,
    costPrice: 2.30,
    unit: 'Bolsa 1kg',
    image: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop&q=80',
    description: 'Sal pura fina para mesa y cocina Lobos de alta pureza.',
    badge: 'Básico',
    emoji: '🧂'
  },
  jabonBolivarBlanco: {
    baseName: 'Jabón en Barra Bolívar Blanco Puro 200g',
    category: 'Limpieza & Hogar',
    basePrice: 5.00,
    costPrice: 3.80,
    unit: 'Barra 200g',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    description: 'Jabón neutro blanco para lavado de ropa a mano y prendas delicadas.',
    badge: 'Lavado Tradicional',
    emoji: '🧼'
  },
  lavavajillasSapolio: {
    baseName: 'Lavavajillas Líquido Sapolio Limón 500ml',
    category: 'Limpieza & Hogar',
    basePrice: 9.00,
    costPrice: 6.80,
    unit: 'Botella 500ml',
    image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&auto=format&fit=crop&q=80',
    description: 'Detergente lavavajillas antigrasa concentrado con fresco aroma a limón.',
    badge: 'Antigrasa',
    emoji: '🍽️'
  },
  lavandinaClorox: {
    baseName: 'Lavandina Desinfectante Clorox Clásica 1L',
    category: 'Limpieza & Hogar',
    basePrice: 6.50,
    costPrice: 4.80,
    unit: 'Botella 1L',
    image: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=600&auto=format&fit=crop&q=80',
    description: 'Cloro líquido desinfectante de pisos, baños y blanqueador de telas.',
    badge: 'Desinfección',
    emoji: '🧴'
  },
  cremaColgate: {
    baseName: 'Crema Dental Colgate Triple Acción 75ml',
    category: 'Cuidado Personal',
    basePrice: 9.00,
    costPrice: 6.80,
    unit: 'Tubo 75ml',
    image: 'https://images.unsplash.com/photo-1570784332176-fdd73da66f03?w=600&auto=format&fit=crop&q=80',
    description: 'Protección anticaries, dientes blancos y aliento fresco con flúor.',
    badge: 'Higiene Diaria',
    emoji: '🪥'
  },
  jabonRexona: {
    baseName: 'Jabón de Tocador Rexona Antibacterial 90g',
    category: 'Cuidado Personal',
    basePrice: 5.00,
    costPrice: 3.70,
    unit: 'Pastilla 90g',
    image: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=600&auto=format&fit=crop&q=80',
    description: 'Jabón corporal refrescante con protección antibacterial prolongada.',
    badge: 'Cuidado Diario',
    emoji: '🧼'
  },
  avenaQuaker: {
    baseName: 'Avena Tradicional en Hojuelas Quaker 400g',
    category: 'Panadería & Desayuno',
    basePrice: 9.50,
    costPrice: 7.20,
    unit: 'Funda 400g',
    image: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=600&auto=format&fit=crop&q=80',
    description: 'Avena 100% integral en hojuelas ricas en fibra natural Quaker.',
    badge: 'Saludable',
    emoji: '🥣'
  }
};

// Generador de número seudo-aleatorio determinista basado en el slug de la tienda
const getHashFromString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

// Determina el tipo de zona de Santa Cruz según el slug o nombre de la tienda
export const getZoneCategory = (slug = '') => {
  const s = slug.toLowerCase();
  if (s.includes('equipetrol') || s.includes('sirari') || s.includes('tajibos') || s.includes('ambassador') || s.includes('brisas')) {
    return 'premium_norte';
  }
  if (s.includes('casco') || s.includes('pascana') || s.includes('sucre') || s.includes('lorenzo') || s.includes('libertad') || s.includes('canoto') || s.includes('rivero') || s.includes('busch')) {
    return 'centro_historico';
  }
  if (s.includes('urbari') || s.includes('palmas') || s.includes('hamacas') || s.includes('trompillo') || s.includes('isuto') || s.includes('parque-urbano') || s.includes('americas')) {
    return 'residencial_tradicional';
  }
  return 'barrial_familiar';
};

// Calcula pequeña variación de precio realista (±Bs. 0.50 o 1.00) según zona y tienda
const calculateVaryingPrice = (basePrice, zoneType, hashOffset) => {
  let variation = 0;
  if (zoneType === 'premium_norte') {
    variation = (hashOffset % 2 === 0) ? 0.50 : 1.00;
  } else if (zoneType === 'barrial_familiar') {
    variation = (hashOffset % 3 === 0) ? -0.50 : 0.00;
  } else {
    variation = (hashOffset % 2 === 0) ? 0.50 : 0.00;
  }

  const finalPrice = Math.max(1.0, basePrice + variation);
  return Number(finalPrice.toFixed(2));
};

export const getStoreCatalog = (storeSlug = 'default') => {
  if (storeSlug === 'default') {
    return [];
  }

  const seedHash = getHashFromString(storeSlug);
  const zone = getZoneCategory(storeSlug);

  const essentialKeys = [
    'cocaCola2L',
    'lechePil1L',
    'huevosDocena',
    'panMarraqueta',
    'aguaVital2L',
    'aceiteFino',
    'azucarGuabira',
    'arrozGranoOro',
    'galletasMabels',
    'papelScott'
  ];

  let specialtyKeys = [];
  if (zone === 'premium_norte') {
    specialtyKeys = [
      'vinoCamposSolana',
      'cervezaHuari',
      'cervezaCorona',
      'quesoGoudaMenorita',
      'jamonSerranoSofia',
      'monsterEnergy',
      'pringlesOriginal',
      'chocolatesParaTi',
      'hieloRolito',
      'lecheDeslactosadaPil',
      'chorizoParrilleroSofia',
      'galletasOreo'
    ];
  } else if (zone === 'centro_historico') {
    specialtyKeys = [
      'cafeNescafe50g',
      'teWindsorClasico',
      'empanadasSantaClara',
      'cunapeTradicional',
      'cocaColaPersonal',
      'yogurtPilFrutilla',
      'galletasOreo',
      'cervezaPacena710',
      'redBull250',
      'atunVanCamps',
      'mantequillaRegia',
      'cremaColgate'
    ];
  } else if (zone === 'residencial_tradicional') {
    specialtyKeys = [
      'carbonQuebracho',
      'chorizoParrilleroSofia',
      'salsaBarbacoaKris',
      'quesoChaquenoAsar',
      'mantequillaRegia',
      'jugoDelValleDurazno',
      'lecheDeslactosadaPil',
      'salchichasPielSofia',
      'mayonesaKris',
      'limpiapisosPoett',
      'detergenteOmo',
      'cunapeTradicional'
    ];
  } else {
    specialtyKeys = [
      'harinaBlancaflor',
      'fideoFamosaEspagueti',
      'mapleHuevos30',
      'mortadelaSofia',
      'hamburguesasSofia4u',
      'nuggetsSofia',
      'salsaTomateKris',
      'salLobos',
      'jabonBolivarBlanco',
      'lavavajillasSapolio',
      'lavandinaClorox',
      'cremaColgate',
      'jabonRexona',
      'avenaQuaker'
    ];
  }

  const allSpecialtyPool = Object.keys(MASTER_PRODUCTS).filter(
    k => !essentialKeys.includes(k) && !specialtyKeys.includes(k)
  );

  const extraCount = (seedHash % 3) + 1;
  for (let i = 0; i < extraCount; i++) {
    const pickIndex = (seedHash + i * 7) % allSpecialtyPool.length;
    const pickedKey = allSpecialtyPool[pickIndex];
    if (pickedKey && !specialtyKeys.includes(pickedKey)) {
      specialtyKeys.push(pickedKey);
    }
  }

  const finalKeys = [...essentialKeys, ...specialtyKeys];

  return finalKeys.map((key, index) => {
    const item = MASTER_PRODUCTS[key];
    if (!item) return null;

    const hashOffset = (seedHash + index * 13) % 100;
    const finalPrice = calculateVaryingPrice(item.basePrice, zone, hashOffset);
    const originalPrice = (hashOffset % 3 === 0) ? Number((finalPrice * 1.1).toFixed(2)) : finalPrice;
    const calculatedStock = 10 + ((seedHash + index * 9) % 35);

    return {
      id: `${storeSlug}-prod-${index + 1}`,
      code: `780${((seedHash % 900) + 100)}${String(index + 1).padStart(3, '0')}`,
      name: item.baseName,
      category: item.category,
      price: finalPrice,
      originalPrice: originalPrice,
      original_price: originalPrice,
      costPrice: item.costPrice,
      cost_price: item.costPrice,
      stock: calculatedStock,
      minStock: 4,
      min_stock: 4,
      unit: item.unit,
      image: item.image,
      description: item.description,
      badge: item.badge,
      isPopular: index < 5 || item.badge === 'Más Vendido' || (hashOffset % 4 === 0),
      tenant_id: storeSlug
    };
  }).filter(Boolean);
};

export const getStoreFeaturedProducts = (storeSlug = '') => {
  const catalog = getStoreCatalog(storeSlug);
  if (!catalog || catalog.length === 0) return [];

  // Seleccionar 3 productos atractivos y variados:
  // 1. Un esencial de alta rotación (Coca-Cola o Leche)
  const item1 = catalog.find(p => p.name.includes('Coca-Cola') || p.name.includes('Leche')) || catalog[0];
  // 2. Un producto fresco o de desayuno (Pan, Cuñapé, Huevos, Queso)
  const item2 = catalog.find(p => p.id !== item1?.id && (p.name.includes('Pan') || p.name.includes('Cuñapé') || p.name.includes('Huevos') || p.name.includes('Queso'))) || catalog[1];
  // 3. Una especialidad de la zona (Vino, Empanadas, Carbón, Cerveza, Maple, etc.)
  const item3 = catalog.slice(10).find(p => p.id !== item1?.id && p.id !== item2?.id) || catalog[2];

  const items = [item1, item2, item3].filter(Boolean);

  return items.map((p) => {
    let emoji = '📦';
    const n = p.name.toLowerCase();
    if (n.includes('coca') || n.includes('gaseosa') || n.includes('jugo') || n.includes('vital')) emoji = '🥤';
    else if (n.includes('leche') || n.includes('yogurt')) emoji = '🥛';
    else if (n.includes('huevo')) emoji = '🥚';
    else if (n.includes('pan') || n.includes('cuñape') || n.includes('empanada')) emoji = '🥐';
    else if (n.includes('vino')) emoji = '🍷';
    else if (n.includes('cerveza')) emoji = '🍺';
    else if (n.includes('queso')) emoji = '🧀';
    else if (n.includes('carne') || n.includes('chorizo') || n.includes('jamon') || n.includes('salchicha') || n.includes('hamburguesa')) emoji = '🥩';
    else if (n.includes('arroz') || n.includes('aceite') || n.includes('azucar') || n.includes('fideo') || n.includes('harina')) emoji = '🌾';
    else if (n.includes('galleta') || n.includes('snack') || n.includes('lays') || n.includes('pringles')) emoji = '🍪';
    else if (n.includes('carbon')) emoji = '🔥';
    else if (n.includes('cafe') || n.includes('te')) emoji = '☕';

    return {
      id: p.id,
      name: p.name.length > 24 ? p.name.substring(0, 22) + '...' : p.name,
      price: p.price,
      emoji: emoji
    };
  });
};
