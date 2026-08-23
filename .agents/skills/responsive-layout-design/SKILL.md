---
name: responsive-layout-design
description: Guía integral y conjunto de reglas para estructurar diseños web responsivos limpios, con espaciados proporcionales, cuadrículas fluidas, vistas móviles optimizadas, modales adaptables y control de desbordamientos.
---

# Responsive Layout & Spacing Skill

Esta skill proporciona principios, convenciones y patrones visuales para garantizar que cualquier interfaz sea 100% responsiva, limpia, accesible y adaptada a todas las pantallas (smartphones pequeños 320px, teléfonos 375px-430px, tablets 768px-1024px y monitores de escritorio 1280px+).

---

## 1. Principios de Espaciado y Escala Proporcional

- **Contenedores Max-Width**:
  - Utilizar `max-w-7xl` o `max-w-6xl` centrado con `mx-auto`.
  - Padding lateral dinámico: `px-3 sm:px-6 lg:px-8` para evitar que el contenido toque los bordes del dispositivo.

- **Espaciado Interno y Márgenes (Paddings & Gaps)**:
  - Móvil (<640px): `gap-3`, `p-3`, `py-4`.
  - Tablet (640px-1024px): `gap-4`, `p-5`, `py-6`.
  - Escritorio (>1024px): `gap-6`, `p-6`, `py-8`.

---

## 2. Tipografía Fluida y Áreas Táctiles

- **Escala de Texto**:
  - Títulos principales: `text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight`.
  - Subtítulos: `text-sm sm:text-base font-semibold`.
  - Texto descriptivo y secundario: `text-xs sm:text-sm text-slate-500`.
  - Badges / Micro-etiquetas: `text-[10px] sm:text-xs font-bold`.

- **Áreas Táctiles Mínimas (Touch Targets)**:
  - Los botones interactivos y enlaces en móvil deben tener un tamaño mínimo de **44px x 44px** (o padding mínimo `px-4 py-2.5`) para evitar toques erróneos.

---

## 3. Cuadrículas Fluidas y Layouts Flexibles

- **Grid de Productos / Tarjetas**:
  - `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6`
  - En móviles ultra pequeños (<360px), asegurar que los textos y botones no desborden la tarjeta usando `truncate` o `line-clamp-2`.

- **Formularios y Secciones de Entrada**:
  - En móvil: 1 sola columna (`grid-cols-1`).
  - En tablet y escritorio: 2 o más columnas (`sm:grid-cols-2 lg:grid-cols-3`).

---

## 4. Modales, Drawers y Control de Desbordamiento (Overflow)

- **Modales Flotantes**:
  - Ajustar a `w-full max-w-lg mx-3 sm:mx-auto`.
  - Limitar la altura máxima: `max-h-[90vh]` o `max-h-[85dvh]`.
  - Hacer la sección de contenido interno desplazable: `overflow-y-auto`.
  - Mantener encabezados y botones de acción pegados (*sticky*) si el contenido es extenso.

- **Paneles Laterales (Drawers / Carritos)**:
  - Móvil (<640px): Ocupar el 100% del ancho (`w-full`).
  - Escritorio: Ancho fijo como `w-full max-w-md` o `max-w-lg`.

---

## 5. Tablas y Kanban en Móvil

- **Tablas de Datos**:
  - Envolver la tabla en un contenedor con `overflow-x-auto w-full -mx-4 px-4 sm:mx-0 sm:px-0`.
  - Alternativamente, transformar filas de tabla en tarjetas móviles (`block sm:table-row`).

- **Tableros Kanban (Ej. Pedidos en Vivo)**:
  - En lugar de 4 columnas apretadas en pantallas móviles, implementar un selector de pestañas (*Tabs*) en móvil (`block lg:hidden`) y mantener la vista multicolumna en escritorio (`hidden lg:grid`).

---

## 6. Prompt Recomendado para Reutilizar la Skill

```text
Aplica la skill responsive-layout-design para revisar, estructurar y ajustar los espaciados, paddings, tamaños tipográficos, cuadrículas fluidas, modales y navegación táctil de esta interfaz con el objetivo de lograr un diseño responsive limpio, ordenado e impecable en móviles, tablets y escritorio.
```
