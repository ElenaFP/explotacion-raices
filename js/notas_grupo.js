// Logic for Group Results (Resultados por Grupo)

let globalStudents = {};
let globalUnits = [];
let academicYear = '';
let currentStats = {}; // Store stats for download

document.addEventListener('DOMContentLoaded', () => {
    setupDragAndDrop('uploadSection', 'csvFile', processFile);
});

function switchTab(sectionId, btnElement) {
    document.querySelectorAll('.eval-section').forEach(el => el.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
}

function processFile(file) {
    globalStudents = {};
    globalUnits = [];
    academicYear = '';
    currentStats = {};

    const loader = document.getElementById('loader');
    const tableContainer = document.getElementById('results');
    const groupingContainer = document.getElementById('grouping-container');
    const uploadSection = document.getElementById('uploadSection');

    if(loader) loader.classList.add('active');
    if(tableContainer) tableContainer.style.display = 'none';
    if(groupingContainer) groupingContainer.style.display = 'none';
    
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            const csvData = event.target.result;
            parseData(csvData); 
            renderGroupingUI(); 
            
            // Show results immediately with default grouping
            calculateAndShowResults();
            if(loader) loader.classList.remove('active');
        } catch (error) {
            console.error(error);
            showError('Error al procesar el fichero: ' + error.message);
            if(loader) loader.classList.remove('active');
            if(uploadSection) uploadSection.style.display = 'block';
        }
    };
    reader.readAsText(file, 'UTF-8'); 
}

function parseData(csvText) {
    // Use common.js robust parser
    const lines = parseCSV(csvText);
    if (!lines || lines.length < 2) throw new Error('El archivo está vacío o no tiene cabecera');

    const headers = lines[0];
    const indices = {
        unidad: headers.indexOf('UNIDAD'),
        nia: headers.indexOf('NIA'),
        nota1: headers.indexOf('NOTA1EV'),
        nota2: headers.indexOf('NOTA2EV'),
        notaOrd: headers.indexOf('NOTAORD'),
        notaLomloe: headers.indexOf('EVFINAL(LOMLOE)'),
        notaExt: headers.indexOf('NOTAEXT'),
        estado: headers.indexOf('ESTADO'),
        materia: headers.indexOf('MATERIA_GENERAL'),
        anno: headers.indexOf('C_ANNO')
    };

    if (indices.unidad === -1 || indices.nia === -1 || indices.nota1 === -1) {
        throw new Error('Columnas requeridas no encontradas (UNIDAD, NIA, NOTA1EV). Verifique el formato del archivo.');
    }

    globalStudents = {};
    const unitsSet = new Set();
    academicYear = '';

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (row.length < headers.length) continue;

        const nia = row[indices.nia];
        const unidad = row[indices.unidad];
        const estado = indices.estado !== -1 ? row[indices.estado] : 'Matriculada';
        const materia = indices.materia !== -1 ? row[indices.materia] : '';
        
        if (!academicYear && indices.anno !== -1) academicYear = row[indices.anno];

        if (estado !== 'Matriculada') continue;

        unitsSet.add(unidad);

        if (!globalStudents[nia]) {
            globalStudents[nia] = {
                unidad: unidad,
                failures1ev: 0, hasGrade1ev: false,
                failures2ev: 0, hasGrade2ev: false,
                failuresOrd: 0, hasGradeOrd: false,
                failuresExt: 0, hasExt: false,
                subjects: new Set()
            };
        }

        if (materia && globalStudents[nia].subjects.has(materia)) continue;
        if (materia) globalStudents[nia].subjects.add(materia);

        const processNota = (val) => {
            if (!val) return false;
            let cleanVal = val.replace(',', '.').toUpperCase();
            cleanVal = cleanVal.replace(/-M/g, '');
            const n = parseFloat(cleanVal);
            return (!isNaN(n) && n < 5);
        };

        const val1 = row[indices.nota1];
        if (val1 && val1.trim() !== '') {
            globalStudents[nia].hasGrade1ev = true;
            if (processNota(val1)) globalStudents[nia].failures1ev++;
        }

        const val2 = indices.nota2 !== -1 ? row[indices.nota2] : '';
        if (val2 && val2.trim() !== '') {
            globalStudents[nia].hasGrade2ev = true;
            if (processNota(val2)) globalStudents[nia].failures2ev++;
        }

        let valFinal = '';
        if (indices.notaOrd !== -1) valFinal = row[indices.notaOrd];
        if ((!valFinal || valFinal.trim() === '') && indices.notaLomloe !== -1) {
            valFinal = row[indices.notaLomloe];
        }
        if (valFinal && valFinal.trim() !== '') {
            globalStudents[nia].hasGradeOrd = true;
            if (processNota(valFinal)) globalStudents[nia].failuresOrd++;
        }

        if (indices.notaExt !== -1) {
            const valExt = row[indices.notaExt];
            if (valExt && valExt.trim() !== '') {
                globalStudents[nia].hasExt = true;
                if (processNota(valExt)) globalStudents[nia].failuresExt++;
            }
        }
    }

    globalUnits = Array.from(unitsSet).sort();
}

function renderGroupingUI() {
    const groupListEl = document.getElementById('group-list');
    if(!groupListEl) return;
    groupListEl.innerHTML = '';
    
    globalUnits.forEach(unit => {
        const div = document.createElement('div');
        div.className = 'group-item';
        div.setAttribute('draggable', true);
        div.dataset.unit = unit;
        
        div.addEventListener('dragstart', handleDragStart);
        div.addEventListener('dragover', handleDragOver);
        div.addEventListener('dragleave', handleDragLeave);
        div.addEventListener('drop', handleDrop);
        div.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox') return;
            const cb = div.querySelector('.unit-checkbox');
            cb.checked = !cb.checked;
        });

        div.innerHTML = `
            <input type="checkbox" class="unit-checkbox" value="${unit}">
            <span class="original-name" style="pointer-events: none;">${unit}</span>
            <span class="arrow-icon">➜</span>
            <input type="text" class="mapped-name-input" data-original="${unit}" value="${unit}" readonly>
        `;
        groupListEl.appendChild(div);
    });
}

// Drag & Drop for Grouping (Internal Logic)
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', this.dataset.unit);
    this.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault(); 
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    const sourceUnit = e.dataTransfer.getData('text/plain');
    const targetUnit = this.dataset.unit;
    
    if (sourceUnit === targetUnit) return;
    
    document.querySelectorAll('.group-item').forEach(el => el.classList.remove('dragging'));

    const sourceInput = document.querySelector(`.mapped-name-input[data-original="${sourceUnit}"]`);
    const targetInput = document.querySelector(`.mapped-name-input[data-original="${targetUnit}"]`);
    
    const currentSourceGroup = sourceInput.value;
    const currentTargetGroup = targetInput.value;

    const affectedInputs = [];
    const allOriginalNames = [];

    document.querySelectorAll('.mapped-name-input').forEach(input => {
        if (input.value === currentSourceGroup || input.value === currentTargetGroup) {
            affectedInputs.push(input);
            allOriginalNames.push(input.dataset.original);
        }
    });

    let commonName = getCommonPrefixArray(allOriginalNames);
    if (commonName.length < 1) return;

    affectedInputs.forEach(input => {
        input.value = commonName;
        input.style.backgroundColor = '#dbeafe';
        setTimeout(() => input.style.backgroundColor = '#f8fafc', 500);
    });
}

function getCommonPrefixArray(strings) {
    if (!strings || strings.length === 0) return "";
    let prefix = strings[0];
    for (let i = 1; i < strings.length; i++) {
        while (strings[i].indexOf(prefix) !== 0) {
            prefix = prefix.substring(0, prefix.length - 1);
            if (prefix === "") return "";
        }
    }
    return prefix;
}

function bulkGroup() {
    const inputName = document.getElementById('bulk-group-name');
    const newName = inputName.value.trim();
    if (!newName) return alert('Escribe un nombre para el grupo.');
    
    const checkboxes = document.querySelectorAll('.unit-checkbox:checked');
    if (checkboxes.length === 0) return alert('Selecciona al menos una unidad.');

    checkboxes.forEach(cb => {
        const originalUnit = cb.value;
        const input = document.querySelector(`.mapped-name-input[data-original="${originalUnit}"]`);
        if (input) input.value = newName;
        cb.checked = false; 
    });
    
    inputName.value = ''; 
}

function showGroupingUI() {
    document.getElementById('results').style.display = 'none';
    document.getElementById('grouping-container').style.display = 'block';
}

function calculateAndShowResults() {
    const mapping = {};
    document.querySelectorAll('.mapped-name-input').forEach(input => {
        mapping[input.dataset.original] = input.value.trim() || input.dataset.original;
    });

    currentStats = {
        '1ev': analyzeGradesWithMapping(mapping, 'failures1ev', 'hasGrade1ev'),
        '2ev': analyzeGradesWithMapping(mapping, 'failures2ev', 'hasGrade2ev'),
        'ord': analyzeGradesWithMapping(mapping, 'failuresOrd', 'hasGradeOrd'),
        'ext': analyzeGradesWithMapping(mapping, 'failuresExt', 'hasExt')
    };
    
    renderTable('table-1ev', currentStats['1ev']);
    renderTable('table-2ev', currentStats['2ev']);
    renderTable('table-ord', currentStats['ord']);
    renderTable('table-ext', currentStats['ext']); 
    
    const tabExt = document.getElementById('tab-ext');
    if (currentStats['ext'].length > 0) {
        tabExt.style.display = 'block';
    } else {
        tabExt.style.display = 'none';
        if (document.getElementById('section-ext').classList.contains('active')) {
            switchTab('section-1ev', document.querySelector('.tab-btn'));
        }
    }
    
    const yearTitle = document.getElementById('year-title');
    if (academicYear) yearTitle.innerText = `Resultados - Curso ${academicYear}`;
    
    document.getElementById('grouping-container').style.display = 'none';
    document.getElementById('results').style.display = 'block';
    initChartSection();
}

function analyzeGradesWithMapping(unitMapping, failureKey, requiredKey = null) {
    const groups = {}; 

    Object.values(globalStudents).forEach(student => {
        if (requiredKey && !student[requiredKey]) return;

        const rawUnit = student.unidad;
        const mappedGroup = unitMapping[rawUnit] || rawUnit;

        if (!groups[mappedGroup]) {
            groups[mappedGroup] = { total: 0, pass: 0, f1: 0, f2: 0, f3: 0, f4p: 0 };
        }

        groups[mappedGroup].total++;

        const f = student[failureKey];
        if (f === 0) groups[mappedGroup].pass++;
        else if (f === 1) groups[mappedGroup].f1++;
        else if (f === 2) groups[mappedGroup].f2++;
        else if (f === 3) groups[mappedGroup].f3++;
        else groups[mappedGroup].f4p++;
    });

    return Object.keys(groups).sort().map(grpName => ({
        name: grpName,
        ...groups[grpName]
    }));
}

function downloadCSV(evalKey) {
    const stats = currentStats[evalKey];
    if (!stats || stats.length === 0) return alert('No hay datos para descargar en esta evaluación.');

    let csv = 'GRUPO,ALUMNOS,TODO_APROBADO,1_SUSPENSO,2_SUSPENSOS,3_SUSPENSOS,4_O_MAS_SUSPENSOS\n';

    stats.forEach(grp => {
        csv += `"${grp.name}",${grp.total},${grp.pass},${grp.f1},${grp.f2},${grp.f3},${grp.f4p}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const suffixMap = { '1ev': '1EV', '2ev': '2EV', 'ord': 'FINAL', 'ext': 'EXTRA' };
    const suffix = suffixMap[evalKey] || 'STATS';
    const fileName = `${academicYear}_${suffix}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===== GRÁFICOS =====

const CHART_COLORS = ['#16a34a', '#4ade80', '#86efac', '#f97316', '#ef4444'];
const CHART_LABELS_CAT = ['0 suspensos', '1 suspenso', '2 suspensos', '3 suspensos', '4+ suspensos'];
const CHART_KEYS_CAT = ['pass', 'f1', 'f2', 'f3', 'f4p'];
const EVAL_DEFS = [
    { key: '1ev',  label: '1ª Ev' },
    { key: '2ev',  label: '2ª Ev' },
    { key: 'ord',  label: 'Ordinaria' },
    { key: 'ext',  label: 'Extraordinaria' }
];

let currentChartType = 'stacked';
let chartInstances = [];

function initChartSection() {
    chartInstances.forEach(c => c.destroy());
    chartInstances = [];
    const output = document.getElementById('charts-output');
    if (output) output.innerHTML = '';
    const container = document.getElementById('chart-sets-container');
    if (!container) return;
    container.innerHTML = '';
    initEvalSelector();
    addChartSet();
}

function initEvalSelector() {
    const container = document.getElementById('eval-selector-container');
    if (!container) return;
    container.innerHTML = '<span class="chart-control-label">Evaluaciones:</span>';
    getAvailableEvals().forEach(ev => {
        const label = document.createElement('label');
        label.className = 'chart-group-label';
        label.innerHTML = `<input type="checkbox" value="${ev.key}" checked> ${ev.label}`;
        container.appendChild(label);
    });
}

function getSelectedEvals() {
    const checked = new Set(
        Array.from(document.querySelectorAll('#eval-selector-container input:checked')).map(cb => cb.value)
    );
    return getAvailableEvals().filter(ev => checked.has(ev.key));
}

function setChartType(type, btn) {
    currentChartType = type;
    document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('pie-cols-control').style.display = type === 'pie' ? 'flex' : 'none';
}

function getAvailableGroups() {
    const groups = new Set();
    EVAL_DEFS.forEach(({ key }) => {
        if (currentStats[key]) currentStats[key].forEach(g => groups.add(g.name));
    });
    return Array.from(groups).sort();
}

function getAvailableEvals() {
    return EVAL_DEFS.filter(({ key }) => currentStats[key] && currentStats[key].length > 0);
}

function addChartSet() {
    const container = document.getElementById('chart-sets-container');
    if (!container) return;

    const groups = getAvailableGroups();
    const setId = 'chart-set-' + Date.now();
    const div = document.createElement('div');
    div.className = 'chart-set';
    div.id = setId;

    const header = document.createElement('div');
    header.className = 'chart-set-header';
    header.innerHTML = `<span class="chart-set-title">Conjunto de agrupaciones</span>
        <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary" style="padding:4px 10px;font-size:0.8em;" onclick="toggleAllGroups('${setId}', this)">Deseleccionar todo</button>
            <button class="btn btn-secondary" style="padding:4px 10px;font-size:0.8em;" onclick="removeChartSet('${setId}')">✕ Eliminar</button>
        </div>`;

    const groupsDiv = document.createElement('div');
    groupsDiv.className = 'chart-set-groups';
    groups.forEach(group => {
        const label = document.createElement('label');
        label.className = 'chart-group-label';
        label.innerHTML = `<input type="checkbox" value="${group}" checked> ${group}`;
        groupsDiv.appendChild(label);
    });

    div.appendChild(header);
    div.appendChild(groupsDiv);
    container.appendChild(div);
}

function removeChartSet(setId) {
    document.getElementById(setId)?.remove();
}

function toggleAllGroups(setId, btn) {
    const checkboxes = Array.from(document.querySelectorAll(`#${setId} input[type=checkbox]`));
    const allChecked = checkboxes.every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    btn.textContent = allChecked ? 'Seleccionar todo' : 'Deseleccionar todo';
}

function getGroupStats(group, evalKey) {
    if (!currentStats[evalKey]) return null;
    return currentStats[evalKey].find(g => g.name === group) || null;
}

function generateCharts() {
    chartInstances.forEach(c => c.destroy());
    chartInstances = [];

    const output = document.getElementById('charts-output');
    output.innerHTML = '';

    const selectedEvals = getSelectedEvals();
    if (selectedEvals.length === 0) {
        output.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">Selecciona al menos una evaluación.</p>';
        return;
    }

    const sets = document.querySelectorAll('.chart-set');
    let chartIndex = 0;

    sets.forEach(set => {
        const selectedGroups = Array.from(set.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);
        if (selectedGroups.length === 0) return;

        chartIndex++;
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-wrapper';

        const title = document.createElement('h3');
        title.className = 'chart-section-title';
        title.textContent = selectedGroups.join(' · ');
        wrapper.appendChild(title);

        if (currentChartType === 'stacked') {
            const canvasWrap = document.createElement('div');
            canvasWrap.className = 'canvas-container';
            const canvas = document.createElement('canvas');
            canvasWrap.appendChild(canvas);
            wrapper.appendChild(canvasWrap);

            const dlBtn = document.createElement('button');
            dlBtn.className = 'download-btn';
            dlBtn.style.marginTop = '12px';
            dlBtn.innerHTML = '⬇️ Descargar imagen';
            dlBtn.onclick = () => downloadChart(canvas, `grafico_barras_${chartIndex}`);
            wrapper.appendChild(dlBtn);

            output.appendChild(wrapper);
            const chart = buildStackedChart(canvas, selectedGroups, selectedEvals);
            if (chart) chartInstances.push(chart);

        } else {
            const pieCanvases = [];
            const grid = document.createElement('div');
            grid.className = 'pie-grid';
            wrapper.appendChild(grid);

            selectedGroups.forEach(group => {
                selectedEvals.forEach(ev => {
                    const gData = getGroupStats(group, ev.key);
                    if (!gData || gData.total === 0) return;

                    const canvas = document.createElement('canvas');
                    canvas.width = 280;
                    canvas.height = 300;
                    grid.appendChild(canvas);
                    pieCanvases.push(canvas);

                    const chart = buildPieChart(canvas, group, ev);
                    if (chart) chartInstances.push(chart);
                });
            });

            wrapper.appendChild(buildPieLegend());

            const dlBtn = document.createElement('button');
            dlBtn.className = 'download-btn';
            dlBtn.style.marginTop = '12px';
            dlBtn.innerHTML = '⬇️ Descargar conjunto';
            dlBtn.onclick = () => downloadPieSet(pieCanvases, `grafico_pie_${chartIndex}`);
            wrapper.appendChild(dlBtn);

            output.appendChild(wrapper);
        }
    });

    if (output.innerHTML === '') {
        output.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">Selecciona al menos una agrupación en cada conjunto.</p>';
    }
}

function buildStackedChart(canvas, groups, availableEvals) {
    const labels = [];
    const datasets = CHART_KEYS_CAT.map((key, i) => ({
        label: CHART_LABELS_CAT[i],
        data: [],
        backgroundColor: CHART_COLORS[i],
        borderColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
    }));

    groups.forEach((group, gi) => {
        if (gi > 0) {
            labels.push('');
            datasets.forEach(ds => ds.data.push(null));
        }
        availableEvals.forEach(ev => {
            labels.push([group, ev.label]);
            const gData = getGroupStats(group, ev.key);
            datasets.forEach((ds, i) => {
                ds.data.push(gData && gData.total > 0
                    ? (gData[CHART_KEYS_CAT[i]] / gData.total) * 100
                    : 0);
            });
        });
    });

    return new Chart(canvas, {
        type: 'bar',
        plugins: [ChartDataLabels],
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } },
                tooltip: {
                    callbacks: {
                        label: ctx => ctx.raw !== null ? `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%` : null
                    }
                },
                datalabels: {
                    color: 'white',
                    font: { weight: 'bold', size: 11 },
                    anchor: 'center',
                    align: 'center',
                    formatter: (value) => {
                        if (value === null || value < 5) return '';
                        return value.toFixed(1) + '%';
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { font: { size: 11 } }
                },
                y: {
                    stacked: true,
                    min: 0,
                    max: 100,
                    ticks: { callback: v => v + '%', font: { size: 11 } },
                    grid: { color: 'rgba(0,0,0,0.06)' }
                }
            }
        }
    });
}

function buildPieChart(canvas, group, ev) {
    const gData = getGroupStats(group, ev.key);
    if (!gData || gData.total === 0) return null;

    return new Chart(canvas, {
        type: 'pie',
        data: {
            labels: CHART_LABELS_CAT,
            datasets: [{
                data: CHART_KEYS_CAT.map(key => (gData[key] / gData.total) * 100),
                backgroundColor: CHART_COLORS,
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: [group, ev.label],
                    color: '#333',
                    font: { size: 12, weight: 'bold' },
                    padding: { top: 8, bottom: 4 }
                },
                legend: { display: false },
                tooltip: {
                    callbacks: { label: ctx => `${ctx.label}: ${ctx.raw.toFixed(1)}%` }
                }
            }
        }
    });
}

function buildPieLegend() {
    const div = document.createElement('div');
    div.className = 'pie-legend';
    CHART_LABELS_CAT.forEach((label, i) => {
        const item = document.createElement('span');
        item.className = 'pie-legend-item';
        item.innerHTML = `<span class="pie-legend-dot" style="background:${CHART_COLORS[i]}"></span>${label}`;
        div.appendChild(item);
    });
    return div;
}

function downloadPieSet(canvases, filename) {
    if (canvases.length === 0) return;

    const cw = canvases[0].width;
    const ch = canvases[0].height;
    const colsInput = parseInt(document.getElementById('pie-cols-input')?.value) || 4;
    const cols = Math.min(canvases.length, Math.max(1, colsInput));
    const rows = Math.ceil(canvases.length / cols);
    const gap = 16;
    const margin = 20;
    const legendH = 40;

    const totalW = cols * cw + (cols - 1) * gap + 2 * margin;
    const totalH = rows * ch + (rows - 1) * gap + 2 * margin + gap + legendH;

    const offscreen = document.createElement('canvas');
    offscreen.width = totalW;
    offscreen.height = totalH;
    const ctx = offscreen.getContext('2d');

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, totalW, totalH);

    canvases.forEach((canvas, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        ctx.drawImage(canvas, margin + col * (cw + gap), margin + row * (ch + gap));
    });

    // Draw legend centred at the bottom
    ctx.font = 'bold 12px Segoe UI, Arial, sans-serif';
    const boxSize = 13;
    const itemPad = 20;
    const itemWidths = CHART_LABELS_CAT.map(l => boxSize + 6 + ctx.measureText(l).width);
    const totalLegendW = itemWidths.reduce((a, b) => a + b, 0) + itemPad * (CHART_LABELS_CAT.length - 1);
    let lx = (totalW - totalLegendW) / 2;
    const ly = totalH - margin - legendH / 2;

    CHART_LABELS_CAT.forEach((label, i) => {
        ctx.fillStyle = CHART_COLORS[i];
        ctx.fillRect(lx, ly - boxSize / 2, boxSize, boxSize);
        ctx.fillStyle = '#333';
        ctx.fillText(label, lx + boxSize + 6, ly + 5);
        lx += itemWidths[i] + itemPad;
    });

    const link = document.createElement('a');
    link.download = filename + '.png';
    link.href = offscreen.toDataURL('image/png');
    link.click();
}

function downloadChart(canvas, filename) {
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

// ===== FIN GRÁFICOS =====

function renderTable(tableId, stats) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if(!tbody) return;
    tbody.innerHTML = '';
    
    stats.forEach(grp => {
        const row = document.createElement('tr');
        
        const formatCell = (count, total) => {
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0.0%';
            return `${count} (${pct})`;
        };

        row.innerHTML = `
            <td><strong>${grp.name}</strong></td>
            <td>${grp.total}</td>
            <td class="good">${formatCell(grp.pass, grp.total)}</td>
            <td>${formatCell(grp.f1, grp.total)}</td>
            <td class="warning">${formatCell(grp.f2, grp.total)}</td>
            <td class="bad">${formatCell(grp.f3, grp.total)}</td>
            <td class="bad" style="font-weight:bold">${formatCell(grp.f4p, grp.total)}</td>
        `;
        tbody.appendChild(row);
    });
}