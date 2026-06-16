// Logic for Attendance Analysis

let processedData = {};
let annoCurso = '';

document.addEventListener('DOMContentLoaded', () => {
    setupDragAndDrop('uploadSection', 'csvFile', processFile);
});

function switchTab(sectionId, btnElement) {
    // Hide all sections
    document.querySelectorAll('.evaluation-section').forEach(el => el.classList.remove('active'));
    // Show target
    document.getElementById(sectionId).classList.add('active');
    
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
}

function processFile(file) {
    // Reset state
    processedData = {};
    annoCurso = '';

    // Reset UI
    document.getElementById('subtitle').textContent = 'Arrastra tu fichero CSV para analizar la asistencia por nivel';
    document.getElementById('title1ev').textContent = '1ª Evaluación';
    document.getElementById('title2ev').textContent = '2ª Evaluación';
    document.getElementById('title3ev').textContent = '3ª Evaluación';
    document.getElementById('titletotal').textContent = 'Total del Curso';

    // Clear tables
    document.getElementById('table1ev').innerHTML = '';
    document.getElementById('table2ev').innerHTML = '';
    document.getElementById('table3ev').innerHTML = '';
    document.getElementById('tabletotal').innerHTML = '';

    // UI Feedback
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const results = document.getElementById('results');

    if(loading) loading.classList.add('active');
    if(error) error.classList.remove('active');
    if(results) results.style.display = 'none';

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const csvContent = event.target.result;
            processCSV(csvContent);
            if(loading) loading.classList.remove('active');
            if(results) results.style.display = 'block';
            
            // Reset to first tab
            const firstTabBtn = document.querySelector('.tab-btn');
            if(firstTabBtn) switchTab('section-1ev', firstTabBtn);

        } catch (err) {
            console.error(err);
            showError('Error al procesar el archivo: ' + err.message);
            if(loading) loading.classList.remove('active');
        }
    };
    reader.readAsText(file, 'UTF-8');
}

function processCSV(csvContent) {
    // Use common.js parseCSV
    const lines = parseCSV(csvContent);
    if (!lines || lines.length < 2) throw new Error('El archivo está vacío o no tiene cabecera');

    const headers = lines[0];

    const indices = {
        anno: headers.indexOf('C_ANNO'),
        curso: headers.indexOf('CURSO'),
        nia: headers.indexOf('NIA'),
        estado: headers.indexOf('ESTADO'),
        materiaGeneral: headers.indexOf('MATERIA_GENERAL'),
        faltas1: headers.indexOf('FALTAS_ASISTENCIA_1EV'),
        retrasos1: headers.indexOf('RETRASOS_ASISTENCIA_1EV'),
        faltas2: headers.indexOf('FALTAS_ASISTENCIA_2EV'),
        retrasos2: headers.indexOf('RETRASOS_ASISTENCIA_2EV'),
        faltas3: headers.indexOf('FALTAS_ASISTENCIA_3EV'),
        retrasos3: headers.indexOf('RETRASOS_ASISTENCIA_3EV')
    };

    const data1ev = {};
    const data2ev = {};
    const data3ev = {};
    const niasPorCurso = {};
    const niaMateriasProcesadas = new Set();

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (row.length < headers.length) continue;

        const estado = (row[indices.estado] || '').trim().toLowerCase();
        if (estado === 'pendiente') continue;

        const nia = row[indices.nia];
        const materiaGeneral = row[indices.materiaGeneral] || '';
        const niaMateriaKey = `${nia}|${materiaGeneral}`;

        if (niaMateriasProcesadas.has(niaMateriaKey)) continue;
        niaMateriasProcesadas.add(niaMateriaKey);

        if (!annoCurso && indices.anno !== -1) {
            annoCurso = row[indices.anno];
        }

        let curso = row[indices.curso];
        if (!curso) continue;

        // Groupings
        if (curso.startsWith('1º de Bachillerato')) {
            curso = '1º de Bachillerato';
        } else if (curso.startsWith('2º de Bachillerato')) {
            curso = '2º de Bachillerato';
        } else if (curso.startsWith('1º de E.S.O.')) {
            curso = '1º de E.S.O.';
        } else if (curso.startsWith('2º de E.S.O.')) {
            curso = '2º de E.S.O.';
        } else if (curso.startsWith('3º de E.S.O.') || curso.includes('1º Programa de Diversificación')) {
            curso = '3º de E.S.O.';
        } else if (curso.startsWith('4º de E.S.O.') || curso.includes('2º Programa de Diversificación')) {
            curso = '4º de E.S.O.';
        }

        if (!data1ev[curso]) {
            data1ev[curso] = { faltas: 0, retrasos: 0 };
            data2ev[curso] = { faltas: 0, retrasos: 0 };
            data3ev[curso] = { faltas: 0, retrasos: 0 };
            niasPorCurso[curso] = new Set();
        }

        data1ev[curso].faltas += parseInt(row[indices.faltas1]) || 0;
        data1ev[curso].retrasos += parseInt(row[indices.retrasos1]) || 0;
        data2ev[curso].faltas += parseInt(row[indices.faltas2]) || 0;
        data2ev[curso].retrasos += parseInt(row[indices.retrasos2]) || 0;
        data3ev[curso].faltas += parseInt(row[indices.faltas3]) || 0;
        data3ev[curso].retrasos += parseInt(row[indices.retrasos3]) || 0;

        niasPorCurso[curso].add(nia);
    }

    // Totals
    const dataTotal = {};
    for (const curso in data1ev) {
        dataTotal[curso] = {
            faltas: data1ev[curso].faltas + data2ev[curso].faltas + data3ev[curso].faltas,
            retrasos: data1ev[curso].retrasos + data2ev[curso].retrasos + data3ev[curso].retrasos
        };
    }

    processedData = {
        '1ev': { data: data1ev, nias: niasPorCurso },
        '2ev': { data: data2ev, nias: niasPorCurso },
        '3ev': { data: data3ev, nias: niasPorCurso },
        'total': { data: dataTotal, nias: niasPorCurso }
    };

    if (annoCurso) {
        document.getElementById('subtitle').textContent = `Análisis de asistencia por evaluaciones - Curso ${annoCurso}`;
        document.getElementById('title1ev').textContent = `1ª Evaluación (Curso ${annoCurso})`;
        document.getElementById('title2ev').textContent = `2ª Evaluación (Curso ${annoCurso})`;
        document.getElementById('title3ev').textContent = `3ª Evaluación (Curso ${annoCurso})`;
        document.getElementById('titletotal').textContent = `Total del Curso (Curso ${annoCurso})`;
    }

    renderTable('1ev', document.getElementById('table1ev'));
    renderTable('2ev', document.getElementById('table2ev'));
    renderTable('3ev', document.getElementById('table3ev'));
    renderTable('total', document.getElementById('tabletotal'));
    initChartSection();
}

function ordenCurso(curso) {
    const orden = {
        '1º de E.S.O.': 1,
        '2º de E.S.O.': 2,
        '3º de E.S.O.': 3,
        '4º de E.S.O.': 4,
        '1º de Bachillerato': 5,
        '2º de Bachillerato': 6
    };
    return orden[curso] || 99;
}

function renderTable(evaluation, container) {
    if (!processedData[evaluation]) return;
    const { data, nias } = processedData[evaluation];
    const sortedCursos = Object.keys(data).sort((a, b) => ordenCurso(a) - ordenCurso(b));

    let html = '<table class="asistencia-table"><thead><tr>';
    html += '<th>CURSO</th>';
    html += '<th class="number">ALUMNOS</th>';
    html += '<th class="number">FALTAS</th>';
    html += '<th class="number">RETRASOS</th>';
    html += '<th class="number">MEDIA FALTAS</th>';
    html += '<th class="number">MEDIA RETRASOS</th>';
    html += '</tr></thead><tbody>';

    let totalFaltas = 0;
    let totalRetrasos = 0;
    let totalAlumnos = new Set();

    for (const curso of sortedCursos) {
        const numAlumnos = nias[curso].size;
        const faltas = data[curso].faltas;
        const retrasos = data[curso].retrasos;
        const mediaFaltas = numAlumnos > 0 ? (faltas / numAlumnos).toFixed(2) : '0.00';
        const mediaRetrasos = numAlumnos > 0 ? (retrasos / numAlumnos).toFixed(2) : '0.00';

        html += '<tr>';
        html += `<td>${curso}</td>`;
        html += `<td class="number">${numAlumnos}</td>`;
        html += `<td class="number">${faltas}</td>`;
        html += `<td class="number">${retrasos}</td>`;
        html += `<td class="number">${mediaFaltas}</td>`;
        html += `<td class="number">${mediaRetrasos}</td>`;
        html += '</tr>';

        totalFaltas += faltas;
        totalRetrasos += retrasos;
        nias[curso].forEach(nia => totalAlumnos.add(nia));
    }

    const numTotalAlumnos = totalAlumnos.size;
    const mediaGeneralFaltas = numTotalAlumnos > 0 ? (totalFaltas / numTotalAlumnos).toFixed(2) : '0.00';
    const mediaGeneralRetrasos = numTotalAlumnos > 0 ? (totalRetrasos / numTotalAlumnos).toFixed(2) : '0.00';

    html += '<tr>';
    html += '<td><strong>TOTAL GENERAL</strong></td>';
    html += `<td class="number"><strong>${numTotalAlumnos}</strong></td>`;
    html += `<td class="number"><strong>${totalFaltas}</strong></td>`;
    html += `<td class="number"><strong>${totalRetrasos}</strong></td>`;
    html += `<td class="number"><strong>${mediaGeneralFaltas}</strong></td>`;
    html += `<td class="number"><strong>${mediaGeneralRetrasos}</strong></td>`;
    html += '</tr>';

    html += '</tbody></table>';
    container.innerHTML = html;
}

function downloadCSV(evaluation) {
    if(!processedData[evaluation]) return;
    const { data, nias } = processedData[evaluation];
    const sortedCursos = Object.keys(data).sort((a, b) => ordenCurso(a) - ordenCurso(b));

    let csv = 'CURSO,ALUMNOS,FALTAS,RETRASOS,MEDIA_FALTAS,MEDIA_RETRASOS\n';

    let totalFaltas = 0;
    let totalRetrasos = 0;
    let totalAlumnos = new Set();

    for (const curso of sortedCursos) {
        const numAlumnos = nias[curso].size;
        const faltas = data[curso].faltas;
        const retrasos = data[curso].retrasos;
        const mediaFaltas = numAlumnos > 0 ? (faltas / numAlumnos).toFixed(2) : '0.00';
        const mediaRetrasos = numAlumnos > 0 ? (retrasos / numAlumnos).toFixed(2) : '0.00';

        csv += `"${curso}",${numAlumnos},${faltas},${retrasos},${mediaFaltas},${mediaRetrasos}\n`;

        totalFaltas += faltas;
        totalRetrasos += retrasos;
        nias[curso].forEach(nia => totalAlumnos.add(nia));
    }

    const numTotalAlumnos = totalAlumnos.size;
    const mediaGeneralFaltas = numTotalAlumnos > 0 ? (totalFaltas / numTotalAlumnos).toFixed(2) : '0.00';
    const mediaGeneralRetrasos = numTotalAlumnos > 0 ? (totalRetrasos / numTotalAlumnos).toFixed(2) : '0.00';

    csv += `"TOTAL GENERAL",${numTotalAlumnos},${totalFaltas},${totalRetrasos},${mediaGeneralFaltas},${mediaGeneralRetrasos}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fileName = evaluation === 'total' ?
        `${annoCurso}_TOTAL.csv` :
        `${annoCurso}_${evaluation.toUpperCase()}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===== GRÁFICOS =====

const CHART_EVAL_DEFS = [
    { key: '1ev',   label: '1ª Ev' },
    { key: '2ev',   label: '2ª Ev' },
    { key: '3ev',   label: '3ª Ev' },
    { key: 'total', label: 'Total' }
];

// Colors per nivel (agrupación por evaluación) and per eval (agrupación por nivel)
const NIVEL_COLORS = ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];
const EVAL_COLORS  = ['#667eea', '#f59e0b', '#10b981', '#ef4444'];

let currentMetric   = 'faltas';
let currentGrouping = 'by-eval'; // 'by-eval' | 'by-nivel'
let chartInstances  = [];

function initChartSection() {
    chartInstances.forEach(c => c.destroy());
    chartInstances = [];
    const output = document.getElementById('charts-output');
    if (output) output.innerHTML = '';
    const container = document.getElementById('chart-sets-container');
    if (!container) return;
    container.innerHTML = '';
    initEvalSelectorAsist();
    addChartSet();
}

function setMetric(metric, btn) {
    currentMetric = metric;
    btn.closest('.chart-type-group').querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function setGrouping(grouping, btn) {
    currentGrouping = grouping;
    btn.closest('.chart-type-group').querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function getAvailableNiveles() {
    const niveles = new Set();
    Object.values(processedData).forEach(ev => Object.keys(ev.data).forEach(c => niveles.add(c)));
    return Array.from(niveles).sort((a, b) => ordenCurso(a) - ordenCurso(b));
}

function getAvailableEvalsAsist() {
    return CHART_EVAL_DEFS.filter(({ key }) => {
        const ev = processedData[key];
        return ev && Object.values(ev.data).some(d => d.faltas > 0 || d.retrasos > 0);
    });
}

function initEvalSelectorAsist() {
    const container = document.getElementById('eval-selector-container-asist');
    if (!container) return;
    container.innerHTML = '<span class="chart-control-label">Evaluaciones:</span>';
    getAvailableEvalsAsist().forEach(ev => {
        const label = document.createElement('label');
        label.className = 'chart-group-label';
        label.innerHTML = `<input type="checkbox" value="${ev.key}" checked> ${ev.label}`;
        container.appendChild(label);
    });
}

function getSelectedEvalsAsist() {
    const checked = new Set(
        Array.from(document.querySelectorAll('#eval-selector-container-asist input:checked')).map(cb => cb.value)
    );
    return getAvailableEvalsAsist().filter(ev => checked.has(ev.key));
}

function getMediaValue(evalKey, curso) {
    const ev = processedData[evalKey];
    if (!ev || !ev.data[curso]) return 0;
    const n = ev.nias[curso] ? ev.nias[curso].size : 0;
    if (n === 0) return 0;
    return (currentMetric === 'faltas' ? ev.data[curso].faltas : ev.data[curso].retrasos) / n;
}

function addChartSet() {
    const container = document.getElementById('chart-sets-container');
    if (!container) return;

    const niveles = getAvailableNiveles();
    const setId = 'chart-set-' + Date.now();
    const div = document.createElement('div');
    div.className = 'chart-set';
    div.id = setId;

    const header = document.createElement('div');
    header.className = 'chart-set-header';
    header.innerHTML = `<span class="chart-set-title">Conjunto de niveles</span>
        <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary" style="padding:4px 10px;font-size:0.8em;" onclick="toggleAllNiveles('${setId}', this)">Deseleccionar todo</button>
            <button class="btn btn-secondary" style="padding:4px 10px;font-size:0.8em;" onclick="removeChartSet('${setId}')">✕ Eliminar</button>
        </div>`;

    const groupsDiv = document.createElement('div');
    groupsDiv.className = 'chart-set-groups';
    niveles.forEach(nivel => {
        const label = document.createElement('label');
        label.className = 'chart-group-label';
        label.innerHTML = `<input type="checkbox" value="${nivel}" checked> ${nivel}`;
        groupsDiv.appendChild(label);
    });

    div.appendChild(header);
    div.appendChild(groupsDiv);
    container.appendChild(div);
}

function removeChartSet(setId) {
    document.getElementById(setId)?.remove();
}

function toggleAllNiveles(setId, btn) {
    const checkboxes = Array.from(document.querySelectorAll(`#${setId} input[type=checkbox]`));
    const allChecked = checkboxes.every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    btn.textContent = allChecked ? 'Seleccionar todo' : 'Deseleccionar todo';
}

function generateCharts() {
    chartInstances.forEach(c => c.destroy());
    chartInstances = [];

    const output = document.getElementById('charts-output');
    output.innerHTML = '';

    const selectedEvals = getSelectedEvalsAsist();
    if (selectedEvals.length === 0) {
        output.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">Selecciona al menos una evaluación.</p>';
        return;
    }

    const allNiveles = getAvailableNiveles();
    const sets = document.querySelectorAll('.chart-set');
    let chartIndex = 0;

    sets.forEach(set => {
        const selectedNiveles = Array.from(set.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);
        if (selectedNiveles.length === 0) return;

        chartIndex++;
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-wrapper';

        const title = document.createElement('h3');
        title.className = 'chart-section-title';
        title.textContent = selectedNiveles.join(' · ');
        wrapper.appendChild(title);

        const canvasWrap = document.createElement('div');
        canvasWrap.className = 'canvas-container';
        const canvas = document.createElement('canvas');
        canvasWrap.appendChild(canvas);
        wrapper.appendChild(canvasWrap);

        const dlBtn = document.createElement('button');
        dlBtn.className = 'download-btn';
        dlBtn.style.marginTop = '12px';
        dlBtn.innerHTML = '⬇️ Descargar imagen';
        dlBtn.onclick = () => downloadChartImage(canvas, `asistencia_${chartIndex}`);
        wrapper.appendChild(dlBtn);

        output.appendChild(wrapper);
        const chart = buildGroupedChart(canvas, selectedNiveles, allNiveles, selectedEvals);
        if (chart) chartInstances.push(chart);
    });

    if (output.innerHTML === '') {
        output.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">Selecciona al menos un nivel en cada conjunto.</p>';
    }
}

function buildGroupedChart(canvas, selectedNiveles, allNiveles, selectedEvals) {
    const metricLabel = currentMetric === 'faltas' ? 'Media de Faltas' : 'Media de Retrasos';

    let labels, datasets;

    if (currentGrouping === 'by-eval') {
        // X = evaluaciones, una barra por nivel
        labels = selectedEvals.map(e => e.label);
        datasets = selectedNiveles.map(nivel => {
            const ci = allNiveles.indexOf(nivel) % NIVEL_COLORS.length;
            return {
                label: nivel,
                data: selectedEvals.map(ev => parseFloat(getMediaValue(ev.key, nivel).toFixed(2))),
                backgroundColor: NIVEL_COLORS[ci] + 'cc',
                borderColor: NIVEL_COLORS[ci],
                borderWidth: 1, borderRadius: 4,
            };
        });
    } else {
        // X = niveles, una barra por evaluación
        labels = selectedNiveles;
        datasets = selectedEvals.map((ev, i) => ({
            label: ev.label,
            data: selectedNiveles.map(nivel => parseFloat(getMediaValue(ev.key, nivel).toFixed(2))),
            backgroundColor: EVAL_COLORS[i % EVAL_COLORS.length] + 'cc',
            borderColor: EVAL_COLORS[i % EVAL_COLORS.length],
            borderWidth: 1, borderRadius: 4,
        }));
    }

    return new Chart(canvas, {
        type: 'bar',
        plugins: [ChartDataLabels],
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 20 } },
            plugins: {
                title: {
                    display: true,
                    text: metricLabel,
                    font: { size: 22, weight: 'bold' },
                    color: '#333',
                    padding: { bottom: 16 }
                },
                legend: { position: 'bottom', labels: { padding: 20, font: { size: 16 } } },
                tooltip: {
                    callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(2)}` }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    color: '#475569',
                    font: { size: 15, weight: 'bold' },
                    formatter: value => value > 0 ? value.toFixed(1) : ''
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 16 } } },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.06)' },
                    ticks: { font: { size: 15 } },
                    title: { display: true, text: metricLabel, font: { size: 15 }, color: '#64748b' }
                }
            }
        }
    });
}

function downloadChartImage(canvas, filename) {
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);
    const link = document.createElement('a');
    link.download = filename + '.png';
    link.href = offscreen.toDataURL('image/png');
    link.click();
}