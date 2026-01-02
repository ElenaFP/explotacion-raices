// Logic for Subject Grades (Notas por Materia)

let rawData = [];
let currentStats = [];
let academicYear = '';
let currentCourse = '';

document.addEventListener('DOMContentLoaded', () => {
    // Drag & Drop Setup
    setupDragAndDrop('uploadSection', 'csvFile', processFile);
});

function processFile(file) {
    const loader = document.getElementById('loader');
    const tableContainer = document.getElementById('results');
    const courseTabs = document.getElementById('courseTabs');
    const error = document.getElementById('error');
    
    if(loader) loader.classList.add('active');
    if(error) error.classList.remove('active');
    if(tableContainer) tableContainer.style.display = 'none';
    if(courseTabs) courseTabs.style.display = 'none';
    academicYear = '';
    
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
                // Select first course by default
                switchCourse(courses[0]);
            }

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
    // Use global parseCSV from common.js
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
    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (cols.length < headers.length) continue;
        
        const student = {};
        for (const [key, index] of Object.entries(headerMap)) {
            student[key] = cols[index];
        }
        
        if (!academicYear && student['C_ANNO']) academicYear = student['C_ANNO'];
        
        data.push(student);
    }
    return data;
}

function getUniqueCourses(data) {
    const rawCourses = new Set(data.map(d => d.CURSO).filter(Boolean));
    const courseList = Array.from(rawCourses);

    const orden = {
        '1º de E.S.O. (LOMLOE)': 1,
        '2º de E.S.O. (LOMLOE)': 2,
        '3º ESO + Diversificación': 3,
        '4º ESO + Diversificación': 4,
        '1º de Bachillerato': 5,
        '2º de Bachillerato': 6
    };

    const result = [];
    
    if (courseList.some(c => c === '1º de E.S.O. (LOMLOE)')) result.push('1º de E.S.O. (LOMLOE)');
    if (courseList.some(c => c === '2º de E.S.O. (LOMLOE)')) result.push('2º de E.S.O. (LOMLOE)');
    if (courseList.some(c => c === '3º de E.S.O. (LOMLOE)' || c === '1º Programa de Diversificación Curricular (LOMLOE)')) result.push('3º ESO + Diversificación');
    if (courseList.some(c => c === '4º de E.S.O. (LOMLOE)' || c === '2º Programa de Diversificación Curricular (LOMLOE)')) result.push('4º ESO + Diversificación');
    if (courseList.some(c => c.startsWith('1º de Bachillerato'))) result.push('1º de Bachillerato');
    if (courseList.some(c => c.startsWith('2º de Bachillerato'))) result.push('2º de Bachillerato');

    return result.sort((a, b) => orden[a] - orden[b]);
}

function createCourseTabs(courses) {
    const tabsContainer = document.getElementById('courseTabs');
    if(!tabsContainer) return;
    tabsContainer.innerHTML = '';
    
    courses.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.textContent = c;
        btn.onclick = () => switchCourse(c);
        tabsContainer.appendChild(btn);
    });
    
    if(courses.length > 0) tabsContainer.style.display = 'flex';
}

function switchCourse(courseName) {
    currentCourse = courseName;
    
    // Update Active Tab
    const tabs = document.querySelectorAll('#courseTabs .tab-btn');
    tabs.forEach(btn => {
        if(btn.textContent === courseName) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    
    // Process and Render
    currentStats = processStats(rawData, courseName);
    renderTable(currentStats, courseName);
    
    document.getElementById('results').style.display = 'block';
}

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

    // Filter Logic
    if (selectedCourse === '3º ESO + Diversificación') {
        courseData = data.filter(d => 
            (d.CURSO === '3º de E.S.O. (LOMLOE)' || d.CURSO === '1º Programa de Diversificación Curricular (LOMLOE)') && 
            d.ESTADO === 'Matriculada'
        );
    } else if (selectedCourse === '4º ESO + Diversificación') {
        courseData = data.filter(d => 
            (d.CURSO === '4º de E.S.O. (LOMLOE)' || d.CURSO === '2º Programa de Diversificación Curricular (LOMLOE)') && 
            d.ESTADO === 'Matriculada'
        );
    } else if (selectedCourse === '1º de Bachillerato') {
        courseData = data.filter(d => d.CURSO.startsWith('1º de Bachillerato') && d.ESTADO === 'Matriculada');
    } else if (selectedCourse === '2º de Bachillerato') {
        courseData = data.filter(d => d.CURSO.startsWith('2º de Bachillerato') && d.ESTADO === 'Matriculada');
    } else {
        courseData = data.filter(d => d.CURSO === selectedCourse && d.ESTADO === 'Matriculada');
    }
    
    const subjectsMap = new Map();
    const studentSubjectMap = new Map();

    courseData.forEach(student => {
        const subject = student.MATERIA_GENERAL;
        if (!subject || !student.NIA) return;

        updateSubjectStats(subject, student, subjectsMap, studentSubjectMap);

        if (subject.toLowerCase().includes('inglés')) {
            updateSubjectStats('Lengua Extranjera (Inglés - Total)', student, subjectsMap, studentSubjectMap);
        }

        if (selectedCourse.includes('4º') && (subject === 'Matemáticas A' || subject === 'Matemáticas B')) {
            updateSubjectStats('Matemáticas A+B', student, subjectsMap, studentSubjectMap);
        }
        
        if (selectedCourse.includes('Bachillerato')) {
            const lowerSub = subject.toLowerCase();
            if (lowerSub.startsWith('matemáticas')) {
               updateSubjectStats('Matemáticas (Total)', student, subjectsMap, studentSubjectMap);
            }
        }
    });

    let sorted = Array.from(subjectsMap.values()).sort((a, b) => a.subject.localeCompare(b.subject));
    return reorderStats(sorted);
}

function reorderStats(stats) {
    const moveAfter = (keywordToMove, keywordParent) => {
        const idxMove = stats.findIndex(s => s.subject === keywordToMove);
        if (idxMove === -1) return;
        const item = stats.splice(idxMove, 1)[0];
        
        let idxParent = -1;
        for(let i=stats.length-1; i>=0; i--) {
            if(stats[i].subject.includes(keywordParent) && stats[i].subject !== keywordToMove) {
                idxParent = i;
                break;
            }
        }
        
        if (idxParent > -1) {
            stats.splice(idxParent + 1, 0, item);
        } else {
            stats.push(item);
        }
    };

    moveAfter('Lengua Extranjera (Inglés - Total)', 'Lengua Extranjera');
    moveAfter('Matemáticas A+B', 'Matemáticas B');
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
        let val = student[key];
        const g = parseGrade(val);
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

function renderTable(stats, selectedCourse) {
    const thead = document.querySelector('#stats-table thead');
    const tbody = document.querySelector('#stats-table tbody');
    if(!thead || !tbody) return;
    
    const isBach = selectedCourse.toLowerCase().includes('bachillerato');
    
    let headerHTML = '<tr><th>Materia</th><th>1ª Ev</th><th>2ª Ev</th><th>3ª Ev</th>';
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
                (sub === 'Matemáticas' && !isBach) || 
                sub === 'Matemáticas A+B' || 
                sub === 'Matemáticas (Total)') { 
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
            <td>${formatPct(s.passed2Ev, s.eval2Count)}</td>
            <td>${formatPct(s.passed3Ev, s.eval3Count)}</td>`;
        
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
    
    const selectedCourse = currentCourse;
    const isBach = selectedCourse.toLowerCase().includes('bachillerato');
    
    let csv = isBach ? 'MATERIA,1EV,2EV,3EV,ORD,EXT\n' : 'MATERIA,1EV,2EV,3EV,FINAL\n';
    
    const formatNum = (passed, total) => {
        if (!total) return '';
        return ((passed / total) * 100).toFixed(2).replace('.', ','); 
    };

    currentStats.forEach(s => {
        csv += `"${s.subject}",`;
        csv += `${formatNum(s.passed1Ev, s.eval1Count)},`;
        csv += `${formatNum(s.passed2Ev, s.eval2Count)},`;
        csv += `${formatNum(s.passed3Ev, s.eval3Count)}`;
        
        if (isBach) {
            csv += `,${formatNum(s.passedOrd, s.evalOrdCount)},`;
            csv += `${formatNum(s.passedExt, s.evalExtCount)}`;
        } else {
            csv += `,${formatNum(s.passedFinal, s.evalFinalCount)}`;
        }
        csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const courseName = selectedCourse.replace(/[^a-z0-9]/gi, '_');
    const fileName = `Resultados_${academicYear}_${courseName}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
