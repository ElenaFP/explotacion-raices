# Contexto Técnico del Proyecto

**Nombre:** Explotación de Datos Raíces
**Acceso:** [https://elenafp.github.io/explotacion-raices/](https://elenafp.github.io/explotacion-raices/)
**Fecha:** 27 de Marzo de 2026 (última actualización: modo Por Grupo en Aprobados por Materia)
**Objetivo:** Unificar tres herramientas de análisis de datos académicos en una suite web coherente, modular y fácil de mantener.

## Arquitectura

El proyecto se ha reestructurado desde tres repositorios independientes a una arquitectura monolítica modular en el lado del cliente (Frontend Monolith).

### Componentes Principales

1.  **Núcleo Común (`js/common.js`, `css/style.css`):**
    -   Centraliza la lógica reutilizable: parsing de CSV robusto (manejo de comillas y saltos de línea), gestión de eventos Drag & Drop, y utilidades de UI.
    -   Define la identidad visual: paleta de colores, tipografía, diseño de tarjetas y tablas.

2.  **Módulos Funcionales (Separación de Intereses):**
    -   **Asistencia (`asistencia.html`, `js/asistencia.js`):** Enfocado en métricas de absentismo. Lógica de agrupación por niveles educativos fijos.
        -   *Refactor:* Simplificación de nombres de cursos (eliminación de sufijos legales como LOMLOE).
        -   *Gráficos:* Nueva pestaña con Chart.js 4. Gráfico de columnas agrupadas configurable: métrica (faltas/retrasos), evaluaciones a incluir, modo de agrupación (por evaluación o por nivel) y conjuntos múltiples de niveles. Exportación PNG individual por gráfico.
    -   **Resultados por Grupo (`resultados_grupo.html`, `js/notas_grupo.js`):** Enfocado en el rendimiento del alumno. Incluye lógica compleja de agrupación dinámica de unidades (UI de mapeo de grupos).
        -   *Mejora:* Cálculo y visualización de porcentajes junto a los valores absolutos.
        -   *Corrección:* Los alumnos sin nota no se contabilizan como aprobados. Solo se muestran evaluaciones con notas reales.
        -   *Gráficos:* Nueva pestaña con Chart.js 4. Soporta columnas apiladas (con etiquetas de % sobre cada segmento vía chartjs-plugin-datalabels, fuentes ampliadas para presentaciones) y pie charts (con etiquetas de % sobre cada sector vía chartjs-plugin-datalabels). Permite múltiples conjuntos de agrupaciones, selector de evaluaciones a incluir, y exportación PNG (barras: imagen individual; tartas: composición de todo el conjunto con leyenda, columnas por fila configurables).
    -   **Aprobados por Materia (`aprobados_materia.html`, `js/notas_materia.js`):** Enfocado en el rendimiento por asignatura.
        -   *UX Refactorizada:* Se reemplazó el desplegable (`<select>`) por un sistema de pestañas (`buttons`) organizado en dos filas (ESO / Bachillerato).
        -   *Visualización:* El año académico se muestra explícitamente sobre la tabla de resultados.
        -   *Lógica de Negocio:* Incluye agregaciones curriculares (Matemáticas A+B, Inglés Total) y filtrado de columnas por etapa educativa (ESO vs Bach).
        -   *Agrupación Dinámica:* Detección automática de múltiples asignaturas de Matemáticas para generar una fila de "Total" resaltada.
        -   *Columnas Dinámicas:* Ocultación automática de la columna 3ª Evaluación si no contiene datos.
        -   *Modo Por Grupo:* Toggle "Por Nivel / Por Grupo" encima de las pestañas. En modo Por Grupo se muestra la UI de configuración de grupos (drag & drop, agrupación por nombre, idéntica a Resultados por Grupo). Las pestañas cambian a los grupos configurados; botón "Reconfigurar Grupos" disponible en todo momento. `processStatsByUnidades` filtra por UNIDAD en lugar de por CURSO y detecta automáticamente si el grupo es ESO o Bachillerato.

### Decisiones de Diseño Clave

-   **Vanilla JS:** Se ha eliminado cualquier dependencia de frameworks (React, Vue) para garantizar la máxima portabilidad (solo se necesita un navegador), rendimiento instantáneo y facilidad de despliegue (simples archivos estáticos).
-   **Chart.js vía CDN:** La funcionalidad de gráficos usa Chart.js 4 y chartjs-plugin-datalabels cargados desde jsDelivr. Requiere conexión a internet en la carga inicial (igual que el acceso desde GitHub Pages).
-   **Procesamiento Local:** Prioridad absoluta a la privacidad. El procesamiento de CSV se realiza en memoria del cliente usando `FileReader` API.
-   **Modularidad de Archivos:** A pesar de ser una web estática, se ha separado el HTML, CSS y JS para facilitar el mantenimiento. Cada herramienta tiene su propio archivo JS de lógica específica para evitar conflictos de nombres y mantener el código limpio.

## Historial de Refactorización

1.  **Unificación:** Se crearon los archivos HTML base para cada herramienta partiendo de los proyectos originales.
2.  **Extracción de Comunes:** Se identificaron patrones repetidos (parsing CSV, estilos) y se movieron a archivos compartidos.
3.  **Corrección de Conflictos:** Se solucionaron problemas de colisión de nombres (ej. función `parseCSV` global vs local) que causaban recursión infinita.
4.  **Optimización UI:** Se mejoró la navegación cruzada entre herramientas y se unificó el diseño visual (banners, botones, loaders).
5.  **Mejora de UX en Aprobados por Materia (v4):** 
    -   Cambio de control de selección de dropdown a pestañas organizadas.
    -   Lógica dinámica para Matemáticas (Total).
    -   Ocultación condicional de columnas vacías.
6.  **Mejora Visual en Resultados por Grupo:** Inclusión de porcentajes.
7.  **Corrección de datos en Resultados por Grupo:** Los alumnos sin nota ya no se contabilizan como aprobados. El parsing rastrea por alumno si tiene nota real (`hasGrade1ev`, `hasGrade2ev`, `hasGradeOrd`) y `analyzeGradesWithMapping` los excluye si no la tienen.
8.  **Gráficos en Resultados por Grupo:** Nueva pestaña con Chart.js. Columnas apiladas con etiquetas de porcentaje incrustadas, pie charts con título dentro del canvas, porcentaje sobre cada sector y leyenda única por conjunto, exportación PNG por conjunto, selector de evaluaciones y conjuntos múltiples configurables. Fuentes ampliadas en columnas apiladas (datalabels 15px, ejes 15-16px, leyenda 16px) para uso en presentaciones.
9.  **Gráficos en Análisis de Asistencia:** Nueva pestaña con columnas agrupadas. Selector de métrica (faltas/retrasos), selector de evaluaciones, toggle de agrupación (por evaluación / por nivel) y conjuntos múltiples de niveles.
10. **Renombrado de módulos:** "Notas por Grupo" → "Resultados por Grupo"; "Notas por Materia" → "Aprobados por Materia". Archivos HTML renombrados a `resultados_grupo.html` y `aprobados_materia.html`.
11. **Modo Por Grupo en Aprobados por Materia:** Toggle Por Nivel / Por Grupo. Configuración de grupos con drag & drop (igual que Resultados por Grupo). Las pestañas muestran grupos configurados. Botón "Reconfigurar Grupos" disponible tras ver resultados.

## Estado Actual

El proyecto es totalmente funcional, estable y listo para despliegue. Las tres herramientas operan correctamente sin errores de consola ni condiciones de carrera en la carga de archivos.
