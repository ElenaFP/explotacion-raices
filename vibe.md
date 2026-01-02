# Contexto Técnico del Proyecto

**Nombre:** Explotación de Datos Raíces
**Fecha:** 2 de Enero de 2026
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
    -   **Notas por Grupo (`notas_grupo.html`, `js/notas_grupo.js`):** Enfocado en el rendimiento del alumno. Incluye lógica compleja de agrupación dinámica de unidades (UI de mapeo de grupos).
        -   *Mejora:* Cálculo y visualización de porcentajes junto a los valores absolutos.
    -   **Notas por Materia (`notas_materia.html`, `js/notas_materia.js`):** Enfocado en el rendimiento por asignatura.
        -   *UX Refactorizada:* Se reemplazó el desplegable (`<select>`) por un sistema de pestañas (`buttons`) organizado en dos filas (ESO / Bachillerato).
        -   *Visualización:* El año académico se muestra explícitamente sobre la tabla de resultados.
        -   *Lógica de Negocio:* Incluye agregaciones curriculares (Matemáticas A+B, Inglés Total) y filtrado de columnas por etapa educativa (ESO vs Bach).
        -   *Agrupación Dinámica:* Detección automática de múltiples asignaturas de Matemáticas para generar una fila de "Total" resaltada.
        -   *Columnas Dinámicas:* Ocultación automática de la columna 3ª Evaluación si no contiene datos.

### Decisiones de Diseño Clave

-   **Vanilla JS:** Se ha eliminado cualquier dependencia de frameworks (React, Vue) para garantizar la máxima portabilidad (solo se necesita un navegador), rendimiento instantáneo y facilidad de despliegue (simples archivos estáticos).
-   **Procesamiento Local:** Prioridad absoluta a la privacidad. El procesamiento de CSV se realiza en memoria del cliente usando `FileReader` API.
-   **Modularidad de Archivos:** A pesar de ser una web estática, se ha separado el HTML, CSS y JS para facilitar el mantenimiento. Cada herramienta tiene su propio archivo JS de lógica específica para evitar conflictos de nombres y mantener el código limpio.

## Historial de Refactorización

1.  **Unificación:** Se crearon los archivos HTML base para cada herramienta partiendo de los proyectos originales.
2.  **Extracción de Comunes:** Se identificaron patrones repetidos (parsing CSV, estilos) y se movieron a archivos compartidos.
3.  **Corrección de Conflictos:** Se solucionaron problemas de colisión de nombres (ej. función `parseCSV` global vs local) que causaban recursión infinita.
4.  **Optimización UI:** Se mejoró la navegación cruzada entre herramientas y se unificó el diseño visual (banners, botones, loaders).
5.  **Mejora de UX en Notas por Materia (v4):** 
    -   Cambio de control de selección de dropdown a pestañas organizadas.
    -   Lógica dinámica para Matemáticas (Total).
    -   Ocultación condicional de columnas vacías.
6.  **Mejora Visual en Notas por Grupo:** Inclusión de porcentajes.

## Estado Actual

El proyecto es totalmente funcional, estable y listo para despliegue. Las tres herramientas operan correctamente sin errores de consola ni condiciones de carrera en la carga de archivos.
