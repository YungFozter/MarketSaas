import * as XLSX from 'xlsx';

/**
 * Limpia y normaliza cadenas de moneda o números con comas/puntos de forma robusta
 */
export const cleanNumericValue = (val) => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;

  let str = String(val).trim();
  if (!/\d/.test(str)) return null;

  // Quitar símbolos y nombres de moneda comunes evitando truncar decimales
  str = str
    .replace(/bs\.?/gi, '')
    .replace(/bob\.?/gi, '')
    .replace(/usd\.?/gi, '')
    .replace(/[$€]/g, '')
    .trim();

  // Si tiene formato de miles con punto y decimal con coma: "1.234,50"
  if (/\d+\.\d{3},\d+/.test(str)) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (/\d+,\d{3}\.\d+/.test(str)) {
    // Si tiene formato "1,234.50"
    str = str.replace(/,/g, '');
  } else if (str.includes(',')) {
    // Si sólo tiene coma decimal: "5,5" -> "5.5"
    str = str.replace(',', '.');
  }

  // Quitar cualquier carácter residual que no sea dígito o punto
  str = str.replace(/[^\d.]/g, '');

  // Si quedaron múltiples puntos, conservar sólo el primero como separador decimal
  const parts = str.split('.');
  if (parts.length > 2) {
    str = `${parts[0]}.${parts.slice(1).join('')}`;
  }

  const num = parseFloat(str);
  return isNaN(num) ? null : num;
};

/**
 * Normaliza nombres de encabezados para mapeo flexible priorizando patrones específicos
 */
const findColumnValue = (row, patterns) => {
  const keys = Object.keys(row);
  const normalizedKeyMap = keys.map(key => ({
    originalKey: key,
    normalizedKey: key
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
  }));

  // Prioridad 1: Buscar coincidencia de patrones en orden (más específico primero) con valor no vacío
  for (const pattern of patterns) {
    const match = normalizedKeyMap.find(k => k.normalizedKey.includes(pattern));
    if (match && row[match.originalKey] !== undefined && row[match.originalKey] !== '') {
      return row[match.originalKey];
    }
  }

  // Prioridad 2: Si no hubo valor no vacío, retornar la clave que coincide con el patrón
  for (const pattern of patterns) {
    const match = normalizedKeyMap.find(k => k.normalizedKey.includes(pattern));
    if (match && row[match.originalKey] !== undefined) {
      return row[match.originalKey];
    }
  }

  return undefined;
};

/**
 * Procesa un archivo Excel (.xlsx / .xls) o .csv cargado en el navegador
 */
export const parseProductExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('El archivo no contiene ninguna hoja de datos.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('El archivo Excel está vacío o no contiene filas con datos.');
        }

        const validProducts = [];
        const errors = [];
        const warnings = [];
        const seenCodes = new Map(); // code -> index in validProducts
        const seenNames = new Map(); // name.toLowerCase() -> index in validProducts

        rawRows.forEach((row, index) => {
          const rowNum = index + 2; // Considerando cabecera en fila 1

          // Mapeo flexible de columnas con búsqueda de patrones por especificidad
          const rawName = findColumnValue(row, ['nombre', 'producto', 'articulo', 'item', 'titulo']);
          const rawPrice = findColumnValue(row, ['precioventa', 'preciodeventa', 'pventa', 'pvp', 'venta', 'precio']);
          const rawCost = findColumnValue(row, ['costocompra', 'costodecompra', 'preciocompra', 'preciodecompra', 'pcompra', 'costo', 'compra']);
          const rawNormalPrice = findColumnValue(row, ['precionormal', 'preciotachado', 'precioregular', 'pnormal', 'normal', 'original', 'tachado', 'regular']);
          const rawCategory = findColumnValue(row, ['categoria', 'rubro', 'familia', 'seccion', 'grupo']);
          const rawCode = findColumnValue(row, ['codigo', 'sku', 'barra', 'ean', 'cod']);
          const rawStock = findColumnValue(row, ['stockactual', 'stock', 'cantidad', 'cant', 'existencia']);
          const rawMinStock = findColumnValue(row, ['alertastockminimo', 'alertastock', 'stockminimo', 'minimo', 'minstock', 'alerta']);
          const rawUnit = findColumnValue(row, ['unidad', 'formato', 'medida', 'peso', 'presentacion']);
          const rawImage = findColumnValue(row, ['foto', 'imagen', 'image', 'url', 'img']);
          const rawDescription = findColumnValue(row, ['descripcion', 'detalle', 'nota']);

          // Validación de Nombre
          const cleanName = rawName ? String(rawName).trim() : '';
          if (!cleanName) {
            errors.push({
              row: rowNum,
              reason: 'Fila omitida: falta el "Nombre del Producto".'
            });
            return;
          }

          // Validación de Precio de Venta
          const parsedPrice = cleanNumericValue(rawPrice);
          if (parsedPrice === null || parsedPrice <= 0) {
            errors.push({
              row: rowNum,
              product: cleanName,
              reason: `Fila ${rowNum} ("${cleanName}") omitida: el "Precio Venta" debe ser un número válido mayor a 0.`
            });
            return;
          }

          // Reglas de Fallback solicitadas por el usuario:
          // 1. Categoría: "Sin definir" si está vacía
          const category = rawCategory && String(rawCategory).trim() ? String(rawCategory).trim() : 'Sin definir';

          // 2. Costo Compra: "Sin definir" si está vacío
          const parsedCost = cleanNumericValue(rawCost);
          const costPrice = parsedCost !== null ? parsedCost : 'Sin definir';

          // 3. Precio Normal: igual a Precio Venta si está vacío
          const parsedNormalPrice = cleanNumericValue(rawNormalPrice);
          const originalPrice = parsedNormalPrice !== null && parsedNormalPrice > 0 ? parsedNormalPrice : parsedPrice;

          // 4. Código / SKU: auto-generado si está vacío
          const code = rawCode && String(rawCode).trim() 
            ? String(rawCode).trim() 
            : `780${Math.floor(10000000 + Math.random() * 90000000)}`;

          // 5. Stock Actual: "Sin definir" si está vacío
          const parsedStock = cleanNumericValue(rawStock);
          const stock = parsedStock !== null ? Math.max(0, Math.floor(parsedStock)) : 'Sin definir';

          // 6. Alerta Stock Mínimo: "Sin definir" si está vacío
          const parsedMinStock = cleanNumericValue(rawMinStock);
          const minStock = parsedMinStock !== null ? Math.max(0, Math.floor(parsedMinStock)) : 'Sin definir';

          // 7. Unidad / Formato: "Sin definir" si está vacío
          const unit = rawUnit && String(rawUnit).trim() ? String(rawUnit).trim() : 'Sin definir';

          // 8. Foto / Imagen: Caja con Interrogante si está vacía
          const image = rawImage && String(rawImage).trim().startsWith('http') 
            ? String(rawImage).trim() 
            : '/products/producto-sin-imagen.png';

          // 9. Descripción: "Sin definir" si está vacía
          const description = rawDescription && String(rawDescription).trim() 
            ? String(rawDescription).trim() 
            : 'Sin definir';

          const productObj = {
            name: cleanName,
            category,
            code,
            costPrice,
            cost_price: costPrice,
            price: parsedPrice,
            originalPrice,
            original_price: originalPrice,
            stock,
            minStock,
            min_stock: minStock,
            unit,
            image,
            description,
            badge: '',
            isPopular: false
          };

          // Detección de duplicados internos dentro del mismo archivo Excel
          const nameKey = cleanName.toLowerCase();
          const codeKey = code ? code.trim() : null;

          let existingIndex = -1;
          let duplicateReason = '';

          if (codeKey && seenCodes.has(codeKey)) {
            existingIndex = seenCodes.get(codeKey);
            duplicateReason = `mismo código SKU ("${codeKey}")`;
          } else if (seenNames.has(nameKey)) {
            existingIndex = seenNames.get(nameKey);
            duplicateReason = `mismo nombre de producto ("${cleanName}")`;
          }

          if (existingIndex >= 0) {
            // Unificar: actualizar con los datos de la fila más reciente
            validProducts[existingIndex] = {
              ...validProducts[existingIndex],
              ...productObj
            };
            warnings.push({
              row: rowNum,
              product: cleanName,
              message: `Fila ${rowNum} ("${cleanName}"): tiene ${duplicateReason} que una fila anterior. Se unificó con la información más reciente.`
            });
          } else {
            const newIndex = validProducts.length;
            validProducts.push(productObj);
            if (codeKey) seenCodes.set(codeKey, newIndex);
            seenNames.set(nameKey, newIndex);
          }
        });

        resolve({ validProducts, errors, warnings, totalRows: rawRows.length });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo en el navegador.'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Genera y descarga automáticamente la plantilla oficial de Excel
 */
export const downloadProductTemplate = () => {
  const templateData = [
    {
      'Nombre del Producto': 'Leche Entera Selección 1L',
      'Categoría': 'Lácteos & Huevos',
      'Código / SKU': '78012345678',
      'Costo Compra (Bs.)': 5.50,
      'Precio Venta (Bs.)': 7.50,
      'Precio Normal (Bs.)': 7.50,
      'Stock Actual (u)': 40,
      'Alerta Stock Mínimo': 8,
      'Unidad / Formato': 'Bolsa 1 Litro',
      'Descripción': 'Leche pasteurizada enriquecida con calcio y vitaminas',
      'Foto / URL': ''
    },
    {
      'Nombre del Producto': 'Pan Marraqueta Artesanal (Unidad)',
      'Categoría': '',
      'Código / SKU': '',
      'Costo Compra (Bs.)': '',
      'Precio Venta (Bs.)': 0.80,
      'Precio Normal (Bs.)': '',
      'Stock Actual (u)': '',
      'Alerta Stock Mínimo': '',
      'Unidad / Formato': '',
      'Descripción': '',
      'Foto / URL': ''
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);

  // Ajuste automático del ancho de columnas para legibilidad
  ws['!cols'] = [
    { wch: 35 }, // Nombre
    { wch: 20 }, // Categoría
    { wch: 18 }, // Código / SKU
    { wch: 18 }, // Costo Compra
    { wch: 18 }, // Precio Venta
    { wch: 18 }, // Precio Normal
    { wch: 16 }, // Stock Actual
    { wch: 20 }, // Alerta Stock Mínimo
    { wch: 20 }, // Unidad / Formato
    { wch: 45 }, // Descripción
    { wch: 30 }  // Foto / URL
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');

  XLSX.writeFile(wb, 'Plantilla_Productos_MarketSaaS.xlsx');
};
