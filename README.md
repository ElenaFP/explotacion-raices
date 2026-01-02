# 📊 Explotación de Datos Raíces

Suite de herramientas web unificada para analizar datos académicos exportados desde la plataforma **Raíces** (Comunidad de Madrid).

Esta suite integra tres herramientas especializadas en una sola interfaz moderna y fácil de usar, permitiendo a los docentes y equipos directivos extraer información valiosa de los archivos CSV de "Alumnos con materia y notas".

## 🚀 Herramientas Incluidas

### 1. 📅 Análisis de Asistencia
Analiza el absentismo escolar por evaluaciones.
- **Métricas:** Faltas y retrasos totales y medios por alumno.
- **Desglose:** Por evaluaciones (1ª, 2ª, 3ª) y total del curso.
- **Agrupaciones:** Consolida grupos de Bachillerato y Diversificación automáticamente.
- **Nomenclatura Simplificada:** Nombres de cursos limpios (ej. "1º de E.S.O.").

### 2. 👥 Notas por Grupo
Visión general del rendimiento académico por grupos de alumnos.
- **Estadísticas Detalladas:** Muestra el número de alumnos y el **porcentaje** correspondiente para:
    - Todo aprobado.
    - 1, 2, 3, o 4+ suspensos.
- **Gestión de Grupos:** Permite agrupar unidades (ej. 1ºA, 1ºB -> 1º ESO) mediante una interfaz visual de arrastrar y soltar.
- **Evaluaciones:** Soporte para evaluaciones trimestrales, final ordinaria y extraordinaria.

### 3. 📚 Notas por Materia
Análisis detallado de los resultados por asignatura.
- **Porcentajes de Aprobados:** Cálculo automático por materia y evaluación.
- **Interfaz Intuitiva:**
    - Selección de curso mediante **pestañas** organizadas por etapa (ESO / Bachillerato).
    - Visualización clara del **año académico** en curso.
- **Lógica Inteligente:**
    - **Columnas Dinámicas:** La columna de la 3ª Evaluación se oculta automáticamente si no contiene datos.
    - **Filtrado por Etapa:** Muestra columnas "Final" para ESO y "Ord/Ext" para Bachillerato.
- **Agrupaciones Especiales:** 
    - **Inglés Global:** Combina todas las materias de inglés.
    - **Matemáticas (Total):** Genera automáticamente una fila de resumen si detecta múltiples asignaturas de matemáticas en 4º ESO o Bachillerato.
- **Resaltado Visual:** Identificación rápida de materias troncales (Lengua, Matemáticas, Geografía) y filas de totales.

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
- **CSS Grid/Flexbox:** Para la maquetación de la interfaz unificada.

## 📂 Estructura del Proyecto

```
explotacion-raices/
├── index.html          # Portal de inicio
├── asistencia.html     # Herramienta de asistencia
├── notas_grupo.html    # Herramienta de notas por grupo
├── notas_materia.html  # Herramienta de notas por materia
├── css/
│   └── style.css       # Estilos compartidos
└── js/
    ├── common.js       # Utilidades comunes (parser CSV, Drag&Drop)
    ├── asistencia.js   # Lógica específica de asistencia
    ├── notas_grupo.js  # Lógica específica de grupos
    └── notas_materia.js # Lógica específica de materias
```

## 📄 Licencia

Proyecto de código abierto desarrollado para facilitar la labor docente. Libre distribución y uso.