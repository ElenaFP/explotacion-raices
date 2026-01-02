// Logic for Group Grades (Notas por Grupo)

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
                failures1ev: 0,
                failures2ev: 0,
                failuresOrd: 0,
                failuresExt: 0,
                hasExt: false,
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

        if (processNota(row[indices.nota1])) globalStudents[nia].failures1ev++;
        if (indices.nota2 !== -1 && processNota(row[indices.nota2])) globalStudents[nia].failures2ev++;
        
        let valFinal = '';
        if (indices.notaOrd !== -1) valFinal = row[indices.notaOrd];
        if ((!valFinal || valFinal.trim() === '') && indices.notaLomloe !== -1) {
            valFinal = row[indices.notaLomloe];
        }
        if (processNota(valFinal)) globalStudents[nia].failuresOrd++;
        
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
        '1ev': analyzeGradesWithMapping(mapping, 'failures1ev'),
        '2ev': analyzeGradesWithMapping(mapping, 'failures2ev'),
        'ord': analyzeGradesWithMapping(mapping, 'failuresOrd'),
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