# 📊 Explotación de Datos Raíces

Suite de herramientas web unificada para analizar datos académicos exportados desde la plataforma **Raíces** (Comunidad de Madrid).

Esta suite integra tres herramientas especializadas en una sola interfaz moderna y fácil de usar, permitiendo a los docentes y equipos directivos extraer información valiosa de los archivos CSV de "Alumnos con materia y notas".

## 🔗 Acceso a la aplicación

Puedes acceder a la herramienta directamente desde el siguiente enlace:
👉 **[https://elenafp.github.io/explotacion-raices/](https://elenafp.github.io/explotacion-raices/)**

## 🚀 Herramientas Incluidas

### 1. 📅 Análisis de Asistencia
Analiza el absentismo escolar por evaluaciones.
- **Métricas:** Faltas y retrasos totales y medios por alumno.
- **Desglose:** Por evaluaciones (1ª, 2ª, 3ª) y total del curso.
- **Agrupaciones:** Consolida grupos de Bachillerato y Diversificación automáticamente.
- **Nomenclatura Simplificada:** Nombres de cursos limpios (ej. "1º de E.S.O.").
- **Gráficos Exportables:** Nueva pestaña con visualización gráfica de la media de faltas o retrasos:
    - **Selector de métrica:** Media de Faltas o Media de Retrasos.
    - **Selector de evaluaciones:** elige qué evaluaciones incluir en el gráfico.
    - **Dos modos de agrupación:** *Por Evaluación* (eje X = evaluaciones, barras = niveles) o *Por Nivel* (eje X = niveles, barras = evaluaciones).
    - **Conjuntos múltiples:** define varios conjuntos de niveles para generar varios gráficos a la vez.
    - **Descarga PNG** por gráfico con fondo blanco.
    - **Texto optimizado para presentaciones:** fuentes ampliadas en títulos, etiquetas de ejes, leyenda y valores sobre las barras, pensado para proyección en pantalla o PowerPoint.

### 2. 👥 Resultados por Grupo
Visión general del rendimiento académico por grupos de alumnos.
- **Estadísticas Detalladas:** Muestra el número de alumnos y el **porcentaje** correspondiente para:
    - Todo aprobado.
    - 1, 2, 3, o 4+ suspensos.
- **Gestión de Grupos:** Permite agrupar unidades (ej. 1ºA, 1ºB -> 1º ESO) mediante una interfaz visual de arrastrar y soltar. Clic en cualquier parte de la fila para seleccionar.
- **Evaluaciones:** Soporte para evaluaciones trimestrales, final ordinaria y extraordinaria. Solo se muestran las evaluaciones con notas reales introducidas.
- **Gráficos Exportables:** Nueva pestaña con visualización gráfica de los resultados:
    - **Columnas apiladas:** compara agrupaciones y evaluaciones en una sola imagen. Cada segmento muestra el porcentaje directamente sobre la barra.
    - **Circular (Pie):** una tarta por cada combinación de agrupación y evaluación, con porcentaje sobre cada sector y leyenda única por conjunto.
    - **Conjuntos múltiples:** define varios conjuntos de agrupaciones para generar varios gráficos independientes a la vez.
    - **Selector de evaluaciones:** elige qué evaluaciones incluir en los gráficos.
    - **Descarga como imagen PNG:** gráfico de barras descargable individualmente; tartas descargables como una única imagen por conjunto, con número de columnas configurable.

### 3. 📚 Aprobados por Materia
Análisis detallado de los resultados por asignatura.
- **Porcentajes de Aprobados:** Cálculo automático por materia y evaluación.
- **Dos modos de visualización:**
    - **Por Nivel:** Selección de curso mediante pestañas organizadas por etapa (ESO / Bachillerato). Muestra el porcentaje de aprobados de todo el nivel.
    - **Por Grupo:** Permite configurar agrupaciones de unidades (ej. 1ºA + 1ºB → 1º ESO) con la misma interfaz de arrastrar y soltar que *Resultados por Grupo*. Las pestañas muestran los grupos configurados en lugar de los niveles. Incluye botón *Reconfigurar Grupos* para ajustar la configuración en cualquier momento.
- **Visualización clara del año académico** en curso.
- **Lógica Inteligente:**
    - **Columnas Dinámicas:** La columna de la 3ª Evaluación se oculta automáticamente si no contiene datos.
    - **Filtrado por Etapa:** Muestra columnas "Final" para ESO y "Ord/Ext" para Bachillerato.
- **Agrupaciones Especiales:**
    - **Inglés Global:** Combina todas las materias de inglés.
    - **Matemáticas (Total):** Genera automáticamente una fila de resumen si detecta múltiples asignaturas de matemáticas en 4º ESO o Bachillerato.
- **Resaltado Visual:** Identificación rápida de materias troncales (Lengua, Matemáticas, Geografía) y filas de totales.
- **Descarga CSV:** Exporta los resultados en formato CSV con punto y coma como separador, compatible con Excel en español (apertura directa sin pasos de importación).

## 🔒 Privacidad y Seguridad

**Tus datos nunca salen de tu ordenador.**

Esta aplicación es una **Single Page Application (SPA)** estática que se ejecuta íntegramente en el navegador del usuario (Client-Side).
- ❌ No hay servidor backend.
- ❌ No se suben archivos a la nube.
- ❌ No se almacenan datos personales.
- ✅ Funciona sin conexión a internet una vez cargada.

## 💻 Cómo Usar

1. **Exportar Datos:**
   Desde Raíces, ve a *Explotación de datos* > *Evaluación* > *Alumnos con materia y notas* y descarga el CSV.

2. **Cargar Archivo:**
   Arrastra el archivo `DescargaExpGesExpDat_....CSV` a la zona de carga de cualquiera de las herramientas.

3. **Analizar y Descargar:**
   Visualiza las tablas interactivas y utiliza los botones de descarga para obtener informes en formato CSV compatibles con Excel.

## 🛠️ Tecnologías

- **HTML5 / CSS3:** Diseño moderno, responsive y limpio.
- **JavaScript (Vanilla):** Lógica de procesamiento de datos optimizada y sin dependencias externas pesadas.
- **Chart.js 4 + chartjs-plugin-datalabels:** Visualización gráfica en Resultados por Grupo (cargados vía CDN).
- **CSS Grid/Flexbox:** Para la maquetación de la interfaz unificada.

## 📂 Estructura del Proyecto

```
explotacion-raices/
├── index.html          # Portal de inicio
├── asistencia.html     # Herramienta de asistencia
├── resultados_grupo.html   # Herramienta de resultados por grupo
├── aprobados_materia.html  # Herramienta de aprobados por materia
├── css/
│   └── style.css       # Estilos compartidos
└── js/
    ├── common.js       # Utilidades comunes (parser CSV, Drag&Drop)
    ├── asistencia.js   # Lógica específica de asistencia
    ├── notas_grupo.js  # Lógica específica de grupos
    └── notas_materia.js # Lógica específica de materias
```

## Licencia 📜
Este proyecto está bajo la licencia **PolyForm Noncommercial 1.0.0**. 
Se permite el uso personal, educativo y de investigación, pero **está prohibida su venta o uso para fines comerciales**.
