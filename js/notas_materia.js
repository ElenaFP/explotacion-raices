// Logic for Subject Pass Rates (Aprobados por Materia)

let rawData = [];
let currentStats = [];
let academicYear = '';
let currentCourse = '';
let currentIsBach = false;

// Group mode state
let viewMode = 'nivel'; // 'nivel' | 'grupo'
let mGlobalUnits = [];   // all distinct UNIDADs from rawData
let mGroupMapping = {};  // unidad → groupName (persists across reconfig)

document.addEventListener('DOMContentLoaded', () => {
    setupDragAndDrop('uploadSection', 'csvFile', processFile);
});

function processFile(file) {
    const loader = document.getElementById('loader');
    const tableContainer = document.getElementById('results');
    const courseTabs = document.getElementById('courseTabs');
    const viewModeToggle = document.getElementById('view-mode-toggle');
    const materiaGrouping = document.getElementById('materia-grouping-container');

    if(loader) loader.classList.add('active');
    if(tableContainer) tableContainer.style.display = 'none';
    if(courseTabs) courseTabs.style.display = 'none';
    if(viewModeToggle) viewModeToggle.style.display = 'none';
    if(materiaGrouping) materiaGrouping.style.display = 'none';
    academicYear = '';
    viewMode = 'nivel';

    // Reset view mode buttons to "Por Nivel"
    const nivelBtn = document.querySelector('#view-mode-toggle .chart-type-btn[data-mode="nivel"]');
    const grupoBtn = document.querySelector('#view-mode-toggle .chart-type-btn[data-mode="grupo"]');
    if(nivelBtn) { nivelBtn.classList.add('active'); }
    if(grupoBtn) { grupoBtn.classList.remove('active'); }

    const reader = new FileReader();

    reader.onload = function(event) {
        try {
            const csvData = event.target.result;
            rawData = processCSVData(csvData);

            const subtitle = document.getElementById('subtitle');
            if (academicYear && subtitle) {
                subtitle.textContent = `Análisis de resultados por materia - Curso ${academicYear}`;
            }

            const yearTitle = document.getElementById('year-title');
            if (yearTitle && academicYear) {
                yearTitle.textContent = `Resultados - Curso ${academicYear}`;
            }

            const courses = getUniqueCourses(rawData);
            createCourseTabs(courses);

            if (courses.length > 0) {
                switchCourse(courses[0]);
            }

            if(viewModeToggle) viewModeToggle.style.display = 'flex';
            if(loader) loader.classList.remove('active');
        } catch (err) {
            console.error(err);
            showError('Error al procesar el fichero: ' + err.message);
            if(loader) loader.classList.remove('active');
        }
    };
    reader.readAsText(file, 'UTF-8');
}

function processCSVData(csvText) {
    if (typeof parseCSV !== 'function') throw new Error('Función parseCSV no encontrada. Recarga la página.');

    const rows = parseCSV(csvText);
    if (!rows || rows.length < 2) throw new Error('El archivo está vacío o no tiene cabecera');

    const headers = rows[0];
    const mapHeader = (h) => {
        const clean = h.trim();
        if (clean === 'EVFINAL(LOMLOE)') return 'EVFINAL_LOMLOE';
        return clean;
    };

    const headerMap = {};
    headers.forEach((h, i) => headerMap[mapHeader(h)] = i);

    const data = [];
    const unidadSet = new Set();

    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (cols.length < headers.length) continue;

        const student = {};
        for (const [key, index] of Object.entries(headerMap)) {
            student[key] = cols[index];
        }

        if (!academicYear && student['C_ANNO']) academicYear = student['C_ANNO'];
        if (student['UNIDAD']) unidadSet.add(student['UNIDAD']);

        data.push(student);
    }

    mGlobalUnits = Array.from(unidadSet).sort();
    // Init identity mapping (each unit maps to itself)
    mGroupMapping = {};
    mGlobalUnits.forEach(u => mGroupMapping[u] = u);

    return data;
}

function getUniqueCourses(data) {
    const rawCourses = new Set(data.map(d => d.CURSO).filter(Boolean));
    const courseList = Array.from(rawCourses);

    const orden = {
        '1º de E.S.O.': 1,
        '2º de E.S.O.': 2,
        '3º de E.S.O.': 3,
        '4º de E.S.O.': 4,
        '1º de Bachillerato': 5,
        '2º de Bachillerato': 6
    };

    const result = [];

    if (courseList.some(c => c.startsWith('1º de E.S.O.'))) result.push('1º de E.S.O.');
    if (courseList.some(c => c.startsWith('2º de E.S.O.'))) result.push('2º de E.S.O.');
    if (courseList.some(c => c.startsWith('3º de E.S.O.') || c.includes('1º Programa de Diversificación'))) result.push('3º de E.S.O.');
    if (courseList.some(c => c.startsWith('4º de E.S.O.') || c.includes('2º Programa de Diversificación'))) result.push('4º de E.S.O.');
    if (courseList.some(c => c.startsWith('1º de Bachillerato'))) result.push('1º de Bachillerato');
    if (courseList.some(c => c.startsWith('2º de Bachillerato'))) result.push('2º de Bachillerato');

    return result.sort((a, b) => orden[a] - orden[b]);
}

function createCourseTabs(courses) {
    const tabsContainer = document.getElementById('courseTabs');
    if(!tabsContainer) return;
    tabsContainer.innerHTML = '';

    const esoRow = document.createElement('div');
    esoRow.className = 'tabs';
    esoRow.style.justifyContent = 'center';
    esoRow.style.marginBottom = '10px';

    const bachRow = document.createElement('div');
    bachRow.className = 'tabs';
    bachRow.style.justifyContent = 'center';

    courses.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.textContent = c;
        btn.onclick = () => switchCourse(c);

        if (c.includes('E.S.O.')) {
            esoRow.appendChild(btn);
        } else {
            bachRow.appendChild(btn);
        }
    });

    if (esoRow.children.length > 0) tabsContainer.appendChild(esoRow);
    if (bachRow.children.length > 0) tabsContainer.appendChild(bachRow);

    if(courses.length > 0) tabsContainer.style.display = 'block';
}

function switchCourse(courseName) {
    currentCourse = courseName;
    currentIsBach = courseName.toLowerCase().includes('bachillerato');

    document.querySelectorAll('#courseTabs .tab-btn').forEach(btn => {
        if(btn.textContent === courseName) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const is4esoBach = currentIsBach || courseName.includes('4º');
    currentStats = processStats(rawData, courseName);
    renderTable(currentStats, { isBach: currentIsBach, is4esoBach });

    const yearTitle = document.getElementById('year-title');
    if(yearTitle && academicYear) yearTitle.textContent = `Resultados - Curso ${academicYear}`;

    const resultsDiv = document.getElementById('results');
    if(resultsDiv) resultsDiv.style.display = 'block';
}

// ===== VIEW MODE =====

function setViewMode(mode, btn) {
    btn.closest('.chart-type-group').querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    viewMode = mode;

    const reconfigBtn = document.getElementById('btn-reconfig-grupos');

    if (mode === 'nivel') {
        document.getElementById('materia-grouping-container').style.display = 'none';
        if(reconfigBtn) reconfigBtn.style.display = 'none';
        const courses = getUniqueCourses(rawData);
        createCourseTabs(courses);
        if (courses.length > 0) switchCourse(courses[0]);
    } else {
        showMateriaGroupingUI();
    }
}

function showMateriaGroupingUI() {
    document.getElementById('courseTabs').style.display = 'none';
    document.getElementById('results').style.display = 'none';
    document.getElementById('materia-grouping-container').style.display = 'block';
    const reconfigBtn = document.getElementById('btn-reconfig-grupos');
    if(reconfigBtn) reconfigBtn.style.display = 'none';
    renderMateriaGroupingUI();
}

function renderMateriaGroupingUI() {
    const groupListEl = document.getElementById('materia-group-list');
    if(!groupListEl) return;
    groupListEl.innerHTML = '';

    mGlobalUnits.forEach(unit => {
        const div = document.createElement('div');
        div.className = 'group-item';
        div.setAttribute('draggable', true);
        div.dataset.unit = unit;

        div.addEventListener('dragstart', mHandleDragStart);
        div.addEventListener('dragover', mHandleDragOver);
        div.addEventListener('dragleave', mHandleDragLeave);
        div.addEventListener('drop', mHandleDrop);
        div.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox') return;
            const cb = div.querySelector('.unit-checkbox');
            cb.checked = !cb.checked;
        });

        const currentMappedName = mGroupMapping[unit] || unit;
        div.innerHTML = `
            <input type="checkbox" class="unit-checkbox" value="${unit}">
            <span class="original-name" style="pointer-events: none;">${unit}</span>
            <span class="arrow-icon">➜</span>
            <input type="text" class="mapped-name-input" data-original="${unit}" value="${currentMappedName}" readonly>
        `;
        groupListEl.appendChild(div);
    });
}

// ===== DRAG & DROP (grouping UI for materia) =====

function mHandleDragStart(e) {
    e.dataTransfer.setData('text/plain', this.dataset.unit);
    this.classList.add('dragging');
}

function mHandleDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function mHandleDragLeave(e) {
    this.classList.remove('drag-over');
}

function mHandleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const sourceUnit = e.dataTransfer.getData('text/plain');
    const targetUnit = this.dataset.unit;
    if (sourceUnit === targetUnit) return;

    document.querySelectorAll('#materia-group-list .group-item').forEach(el => el.classList.remove('dragging'));

    const sourceInput = document.querySelector(`#materia-group-list .mapped-name-input[data-original="${sourceUnit}"]`);
    const targetInput = document.querySelector(`#materia-group-list .mapped-name-input[data-original="${targetUnit}"]`);

    const affectedInputs = [];
    const allOriginalNames = [];
    document.querySelectorAll('#materia-group-list .mapped-name-input').forEach(input => {
        if (input.value === sourceInput.value || input.value === targetInput.value) {
            affectedInputs.push(input);
            allOriginalNames.push(input.dataset.original);
        }
    });

    const commonName = mGetCommonPrefix(allOriginalNames);
    if (commonName.length < 1) return;

    affectedInputs.forEach(input => {
        input.value = commonName;
        input.style.backgroundColor = '#dbeafe';
        setTimeout(() => input.style.backgroundColor = '#f8fafc', 500);
    });
}

function mGetCommonPrefix(strings) {
    if (!strings || strings.length === 0) return '';
    let prefix = strings[0];
    for (let i = 1; i < strings.length; i++) {
        while (strings[i].indexOf(prefix) !== 0) {
            prefix = prefix.substring(0, prefix.length - 1);
            if (prefix === '') return '';
        }
    }
    return prefix;
}

function bulkGroupMateria() {
    const inputName = document.getElementById('materia-bulk-group-name');
    const newName = inputName.value.trim();
    if (!newName) return alert('Escribe un nombre para el grupo.');

    const checkboxes = document.querySelectorAll('#materia-group-list .unit-checkbox:checked');
    if (checkboxes.length === 0) return alert('Selecciona al menos una unidad.');

    checkboxes.forEach(cb => {
        const input = document.querySelector(`#materia-group-list .mapped-name-input[data-original="${cb.value}"]`);
        if (input) input.value = newName;
        cb.checked = false;
    });

    inputName.value = '';
}

function calculateAndShowMateriaGroupResults() {
    // Persist mapping from UI
    mGroupMapping = {};
    document.querySelectorAll('#materia-group-list .mapped-name-input').forEach(input => {
        mGroupMapping[input.dataset.original] = input.value.trim() || input.dataset.original;
    });

    // Build groups map: groupName → [unidades]
    const groups = {};
    Object.entries(mGroupMapping).forEach(([unit, groupName]) => {
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(unit);
    });

    const groupNames = Object.keys(groups).sort();

    // Create group tabs
    const tabsContainer = document.getElementById('courseTabs');
    tabsContainer.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'tabs';
    row.style.justifyContent = 'center';

    groupNames.forEach(gName => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.textContent = gName;
        btn.onclick = () => switchCourseByGroup(gName, groups[gName]);
        row.appendChild(btn);
    });

    tabsContainer.appendChild(row);
    tabsContainer.style.display = 'block';

    document.getElementById('materia-grouping-container').style.display = 'none';
    const reconfigBtn = document.getElementById('btn-reconfig-grupos');
    if(reconfigBtn) reconfigBtn.style.display = 'inline-flex';

    if (groupNames.length > 0) {
        switchCourseByGroup(groupNames[0], groups[groupNames[0]]);
    }
}

function switchCourseByGroup(groupName, unidades) {
    currentCourse = groupName;

    document.querySelectorAll('#courseTabs .tab-btn').forEach(btn => {
        if(btn.textContent === groupName) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const { stats, isBach, is4esoBach } = processStatsByUnidades(rawData, unidades);
    currentStats = stats;
    currentIsBach = isBach;
    renderTable(stats, { isBach, is4esoBach });

    const yearTitle = document.getElementById('year-title');
    if(yearTitle && academicYear) yearTitle.textContent = `${groupName} - Curso ${academicYear}`;

    document.getElementById('results').style.display = 'block';
}

// ===== STATS PROCESSING =====

function parseGrade(grade) {
    if (!grade) return null;
    const cleanGrade = grade.trim().toUpperCase();
    if (cleanGrade === '') return null;
    if (cleanGrade.includes('10-M') || cleanGrade.includes('MH')) return 10;
    const num = parseFloat(cleanGrade.replace(',', '.'));
    if (!isNaN(num)) return num;
    return null;
}

function isPass(grade) {
    return grade !== null && grade >= 5;
}

function processStats(data, selectedCourse) {
    let courseData = [];

    if (selectedCourse === '1º de E.S.O.') {
        courseData = data.filter(d => d.CURSO.startsWith('1º de E.S.O.') && d.ESTADO === 'Matriculada');
    } else if (selectedCourse === '2º de E.S.O.') {
        courseData = data.filter(d => d.CURSO.startsWith('2º de E.S.O.') && d.ESTADO === 'Matriculada');
    } else if (selectedCourse === '3º de E.S.O.') {
        courseData = data.filter(d =>
            (d.CURSO.startsWith('3º de E.S.O.') || d.CURSO === '1º Programa de Diversificación Curricular (LOMLOE)') &&
            d.ESTADO === 'Matriculada'
        );
    } else if (selectedCourse === '4º de E.S.O.') {
        courseData = data.filter(d =>
            (d.CURSO.startsWith('4º de E.S.O.') || d.CURSO === '2º Programa de Diversificación Curricular (LOMLOE)') &&
            d.ESTADO === 'Matriculada'
        );
    } else if (selectedCourse === '1º de Bachillerato') {
        courseData = data.filter(d => d.CURSO.startsWith('1º de Bachillerato') && d.ESTADO === 'Matriculada');
    } else if (selectedCourse === '2º de Bachillerato') {
        courseData = data.filter(d => d.CURSO.startsWith('2º de Bachillerato') && d.ESTADO === 'Matriculada');
    }

    const isBach = selectedCourse.toLowerCase().includes('bachillerato');
    const is4esoBach = isBach || selectedCourse.includes('4º');
    return buildStatsFromData(courseData, is4esoBach);
}

function processStatsByUnidades(data, unidades) {
    const unidadSet = new Set(unidades);
    const courseData = data.filter(d => unidadSet.has(d.UNIDAD) && d.ESTADO === 'Matriculada');

    const courses = new Set(courseData.map(d => d.CURSO).filter(Boolean));
    const isBach = Array.from(courses).some(c => c.toLowerCase().includes('bachillerato'));
    const is4esoBach = isBach || Array.from(courses).some(c =>
        c.startsWith('4º de E.S.O.') || c.includes('2º Programa de Diversificación'));

    return { stats: buildStatsFromData(courseData, is4esoBach), isBach, is4esoBach };
}

function buildStatsFromData(courseData, is4esoBach) {
    const subjectsMap = new Map();
    const studentSubjectMap = new Map();

    courseData.forEach(student => {
        const subject = student.MATERIA_GENERAL;
        if (!subject || !student.NIA) return;

        updateSubjectStats(subject, student, subjectsMap, studentSubjectMap);

        if (subject.toLowerCase().includes('inglés')) {
            updateSubjectStats('Lengua Extranjera (Inglés - Total)', student, subjectsMap, studentSubjectMap);
        }
    });

    if (is4esoBach) {
        const mathSubjects = Array.from(subjectsMap.keys()).filter(s => s.startsWith('Matemáticas'));
        if (mathSubjects.length >= 2) {
            courseData.forEach(student => {
                if (student.MATERIA_GENERAL && student.MATERIA_GENERAL.startsWith('Matemáticas')) {
                    updateSubjectStats('Matemáticas (Total)', student, subjectsMap, studentSubjectMap);
                }
            });
        }
    }

    let sorted = Array.from(subjectsMap.values()).sort((a, b) => a.subject.localeCompare(b.subject));
    return reorderStats(sorted);
}

function reorderStats(stats) {
    const moveAfter = (keywordToMove, keywordParent) => {
        const idxMove = stats.findIndex(s => s.subject === keywordToMove);
        if (idxMove === -1) return;
        const item = stats.splice(idxMove, 1)[0];

        let idxParent = -1;
        for(let i = stats.length - 1; i >= 0; i--) {
            if(keywordParent === 'Matemáticas' && stats[i].subject.startsWith('Matemáticas') && stats[i].subject !== keywordToMove) {
                idxParent = i; break;
            } else if (keywordParent === 'Lengua Extranjera' && stats[i].subject.toLowerCase().includes('inglés') && stats[i].subject !== keywordToMove) {
                idxParent = i; break;
            }
        }

        if (idxParent > -1) stats.splice(idxParent + 1, 0, item);
        else stats.push(item);
    };

    moveAfter('Lengua Extranjera (Inglés - Total)', 'Lengua Extranjera');
    moveAfter('Matemáticas (Total)', 'Matemáticas');

    return stats;
}

function updateSubjectStats(subjectName, student, subjectsMap, studentSubjectMap) {
    if (!studentSubjectMap.has(subjectName)) {
        studentSubjectMap.set(subjectName, new Set());
    }

    const seenStudents = studentSubjectMap.get(subjectName);
    if (seenStudents.has(student.NIA)) return;
    seenStudents.add(student.NIA);

    if (!subjectsMap.has(subjectName)) {
        subjectsMap.set(subjectName, {
            subject: subjectName,
            totalStudents: 0,
            passed1Ev: 0, eval1Count: 0,
            passed2Ev: 0, eval2Count: 0,
            passed3Ev: 0, eval3Count: 0,
            passedFinal: 0, evalFinalCount: 0,
            passedOrd: 0, evalOrdCount: 0,
            passedExt: 0, evalExtCount: 0,
        });
    }

    const stats = subjectsMap.get(subjectName);
    stats.totalStudents++;

    const checkGrade = (key, passKey, countKey) => {
        const g = parseGrade(student[key]);
        if (g !== null) {
            stats[countKey]++;
            if (isPass(g)) stats[passKey]++;
        }
    };

    checkGrade('NOTA1EV', 'passed1Ev', 'eval1Count');
    checkGrade('NOTA2EV', 'passed2Ev', 'eval2Count');
    checkGrade('NOTA3EV', 'passed3Ev', 'eval3Count');
    checkGrade('EVFINAL_LOMLOE', 'passedFinal', 'evalFinalCount');
    checkGrade('NOTAORD', 'passedOrd', 'evalOrdCount');
    checkGrade('NOTAEXT', 'passedExt', 'evalExtCount');
}

function renderTable(stats, options = {}) {
    const thead = document.querySelector('#stats-table thead');
    const tbody = document.querySelector('#stats-table tbody');
    if(!thead || !tbody) return;

    const isBach = options.isBach || false;
    const is4esoBach = options.is4esoBach || false;
    const has3evData = stats.some(s => s.eval3Count > 0);

    let headerHTML = '<tr><th>Materia</th><th>1ª Ev</th><th>2ª Ev</th>';
    if (has3evData) headerHTML += '<th>3ª Ev</th>';
    if (isBach) {
        headerHTML += '<th>Ord</th><th>Ext</th>';
    } else {
        headerHTML += '<th>Final</th>';
    }
    headerHTML += '</tr>';
    thead.innerHTML = headerHTML;

    tbody.innerHTML = '';

    stats.forEach(s => {
        const row = document.createElement('tr');
        const sub = s.subject;

        let shouldHighlight = false;
        if (!sub.includes('Refuerzo')) {
            if (sub.includes('Geografía e Historia') ||
                sub.includes('Lengua Castellana y Literatura') ||
                sub === 'Lengua Extranjera (Inglés - Total)' ||
                sub === 'Matemáticas (Total)' ||
                (sub === 'Matemáticas' && !is4esoBach)) {
                shouldHighlight = true;
            }
        }
        if (shouldHighlight) row.classList.add('highlight-row');

        const formatPct = (passed, total) => {
            if (!total) return '-';
            return ((passed / total) * 100).toFixed(1) + '%';
        };

        let rowHTML = `<td>${sub}</td>
            <td>${formatPct(s.passed1Ev, s.eval1Count)}</td>
            <td>${formatPct(s.passed2Ev, s.eval2Count)}</td>`;

        if (has3evData) rowHTML += `<td>${formatPct(s.passed3Ev, s.eval3Count)}</td>`;

        if (isBach) {
            rowHTML += `<td>${formatPct(s.passedOrd, s.evalOrdCount)}</td>
                        <td>${formatPct(s.passedExt, s.evalExtCount)}</td>`;
        } else {
            rowHTML += `<td>${formatPct(s.passedFinal, s.evalFinalCount)}</td>`;
        }

        row.innerHTML = rowHTML;
        tbody.appendChild(row);
    });
}

function downloadCSV() {
    if (!currentStats || currentStats.length === 0) return alert('No hay datos para descargar.');

    const isBach = currentIsBach;
    const has3evData = currentStats.some(s => s.eval3Count > 0);

    const SEP = ';';

    let csv = `MATERIA${SEP}1ª Evaluación${SEP}2ª Evaluación`;
    if (has3evData) csv += `${SEP}3ª Evaluación`;
    if (isBach) {
        csv += `${SEP}Ordinaria${SEP}Extraordinaria\n`;
    } else {
        csv += `${SEP}Final\n`;
    }

    const formatNum = (passed, total) => {
        if (!total) return '';
        return ((passed / total) * 100).toFixed(2).replace('.', ',');
    };

    currentStats.forEach(s => {
        csv += `"${s.subject}"${SEP}`;
        csv += `${formatNum(s.passed1Ev, s.eval1Count)}${SEP}`;
        csv += `${formatNum(s.passed2Ev, s.eval2Count)}`;

        if (has3evData) csv += `${SEP}${formatNum(s.passed3Ev, s.eval3Count)}`;

        if (isBach) {
            csv += `${SEP}${formatNum(s.passedOrd, s.evalOrdCount)}${SEP}`;
            csv += `${formatNum(s.passedExt, s.evalExtCount)}`;
        } else {
            csv += `${SEP}${formatNum(s.passedFinal, s.evalFinalCount)}`;
        }
        csv += '\n';
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const courseName = currentCourse.replace(/[^a-z0-9]/gi, '_');
    const fileName = `Resultados_${academicYear}_${courseName}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
