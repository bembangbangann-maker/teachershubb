import * as XLSX from 'xlsx';
import { Student, Attendance, AttendanceStatus, Quarter, SubjectQuarterSettings, StudentQuarterlyRecord, SchoolSettings, MapehRecordDocxData, SummaryOfGradesData } from '../types';

interface EClassRecordXlsxData {
    allStudents: { males: Student[]; females: Student[] };
    settings: SchoolSettings;
    subject: string;
    quarter: Quarter;
    selectedSectionText: string;
    recordSettings: SubjectQuarterSettings;
    studentRecords: StudentQuarterlyRecord[];
    calculationResults: Map<string, any>;
    summary: {
        passed: number;
        failed: number;
        malesPassed: number;
        malesFailed: number;
        femalesPassed: number;
        femalesFailed: number;
    };
}


class ExcelService {
    private getAttendanceMap(attendance: Attendance[], year: number, month: number): Map<string, Map<number, AttendanceStatus>> {
        const map = new Map<string, Map<number, AttendanceStatus>>();
        for(const att of attendance) {
            // Ensure date is treated as UTC
            const attDate = new Date(att.date + 'T00:00:00Z');
            if (attDate.getUTCFullYear() === year && attDate.getUTCMonth() === month) {
                if (!map.has(att.studentId)) {
                    map.set(att.studentId, new Map());
                }
                const day = attDate.getUTCDate();
                map.get(att.studentId)!.set(day, att.status);
            }
        }
        return map;
    }

    public generateAttendanceXlsx(students: Student[], attendance: Attendance[], currentDate: Date): void {
        const year = currentDate.getUTCFullYear();
        const month = currentDate.getUTCMonth();
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        
        const monthName = currentDate.toLocaleString('default', { month: 'long', timeZone: 'UTC' });
        const title = `Attendance Report for ${monthName} ${year}`;

        // 1. Group and sort students by gender
        const males = students.filter(s => s.gender === 'Male').sort((a, b) => a.lastName.localeCompare(b.lastName));
        const females = students.filter(s => s.gender === 'Female').sort((a, b) => a.lastName.localeCompare(b.lastName));
        
        const attendanceMap = this.getAttendanceMap(attendance, year, month);

        // 2. Calculate totals
        const dailyTotals: { [key: string]: { [day: number]: number } } = { present: {}, absent: {}, late: {} };
        let monthlyMalePresents = 0;
        let monthlyFemalePresents = 0;

        students.forEach(student => {
            for (let day = 1; day <= daysInMonth; day++) {
                if (!dailyTotals.present[day]) dailyTotals.present[day] = 0;
                if (!dailyTotals.absent[day]) dailyTotals.absent[day] = 0;
                if (!dailyTotals.late[day]) dailyTotals.late[day] = 0;
                
                const status = attendanceMap.get(student.id)?.get(day);
                if (status === 'present') {
                    dailyTotals.present[day]++;
                    if (student.gender === 'Male') monthlyMalePresents++;
                    else if (student.gender === 'Female') monthlyFemalePresents++;
                } else if (status === 'absent') {
                    dailyTotals.absent[day]++;
                } else if (status === 'late') {
                    dailyTotals.late[day]++;
                }
            }
        });

        // 3. Build worksheet data
        const worksheetData: (string|number)[][] = [];

        const firstStudent = students[0];
        const gradeAndSection = (firstStudent?.gradeLevel && firstStudent?.section)
            ? `${firstStudent.gradeLevel} - ${firstStudent.section}`
            : 'Class';
        
        worksheetData.push([title]);
        worksheetData.push([`Class: ${gradeAndSection}`]);
        worksheetData.push([]);

        const headers: string[] = ["Student Name", ...Array.from({ length: daysInMonth }, (_, i) => String(i + 1))];
        worksheetData.push(headers);

        const createStudentRow = (student: Student) => {
            const row: string[] = [`${student.lastName}, ${student.firstName}${student.middleName && student.middleName.trim() ? ` ${student.middleName.trim().charAt(0)}.` : ''}`];
            for (let day = 1; day <= daysInMonth; day++) {
                const status = attendanceMap.get(student.id)?.get(day);
                let mark = '';
                if (status === 'present') mark = 'P';
                else if (status === 'absent') mark = 'A';
                else if (status === 'late') mark = 'L';
                row.push(mark);
            }
            return row;
        };

        if (males.length > 0) {
            worksheetData.push(["MALES"]);
            males.forEach(s => worksheetData.push(createStudentRow(s)));
        }

        if (females.length > 0) {
            worksheetData.push(["FEMALES"]);
            females.forEach(s => worksheetData.push(createStudentRow(s)));
        }
        
        worksheetData.push([]); // Spacer

        const createTotalRow = (label: string, totals: { [day: number]: number }) => {
            const row: (string|number)[] = [label];
            for (let day = 1; day <= daysInMonth; day++) {
                row.push(totals[day] || 0);
            }
            return row;
        };

        worksheetData.push(createTotalRow('Daily Totals - Present', dailyTotals.present));
        worksheetData.push(createTotalRow('Daily Totals - Absent', dailyTotals.absent));
        worksheetData.push(createTotalRow('Daily Totals - Late', dailyTotals.late));
        
        worksheetData.push([]); // Spacer
        worksheetData.push(["Monthly Summary"]);
        worksheetData.push(["Total Present Days (Male)", monthlyMalePresents]);
        worksheetData.push(["Total Present Days (Female)", monthlyFemalePresents]);

        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        ws['!cols'] = [{ wch: 35 }, ...Array(daysInMonth).fill({ wch: 4 })];

        const merges = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: daysInMonth } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: daysInMonth } }
        ];

        let currentRow = 4; // after main headers
        if (males.length > 0) {
            merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: daysInMonth } });
            currentRow += males.length + 1;
        }
        if (females.length > 0) {
            merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: daysInMonth } });
            currentRow += females.length + 1;
        }

        currentRow += 5; // Spacer + 3 total rows + spacer
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: daysInMonth } });

        ws['!merges'] = merges;
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Monthly Attendance');

        const fileName = `Attendance_${gradeAndSection.replace(/\s/g, '_')}_${monthName}_${year}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }

    public generateEClassRecordXlsx(data: EClassRecordXlsxData): void {
        const { allStudents, settings, subject, quarter, selectedSectionText, recordSettings, studentRecords, calculationResults, summary } = data;

        const ws: XLSX.WorkSheet = {};
        const merges: XLSX.Range[] = [];
        let R = 0; // Current row index

        // Styles
        const headerStyle = { font: { bold: true, sz: 11, name: "Calibri" }, fill: { fgColor: { rgb: "FFF2CC" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true } };
        const boldCenteredStyle = { font: { bold: true, name: "Calibri" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }, alignment: { horizontal: "center", vertical: "center" } };
        const centeredStyle = { font: { name: "Calibri" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }, alignment: { horizontal: "center", vertical: "center" } };
        const leftAlignedStyle = { font: { name: "Calibri" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }, alignment: { horizontal: "left", vertical: "center" } };
        const titleStyle = { font: { bold: true, sz: 14, name: "Calibri" }, alignment: { horizontal: "center" } };
        const subTitleStyle = { font: { sz: 11, name: "Calibri" }, alignment: { horizontal: "center" } };
        const summaryHeaderStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFF2CC" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }, alignment: { horizontal: "center" } };
        const genderHeaderStyle = { font: { bold: true, sz: 11 }, fill: { fgColor: { rgb: "DDEBF7" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }, alignment: { horizontal: "left", vertical: "center" } };

        const createCell = (value: string | number | null, style: any, type: 's' | 'n' = 's') => {
            if (value === null || value === undefined) return { t: 's', v: '', s: style };
            if (type === 'n' && typeof value === 'number' && !Number.isInteger(value)) {
                return { t: 'n', v: value, z: '0.00', s: style };
            }
            return { t: type, v: value, s: style };
        };

        // Main Header
        const quarterTextFull = ["FIRST QUARTER", "SECOND QUARTER", "THIRD QUARTER", "FOURTH QUARTER"][quarter - 1];
        ws['A1'] = createCell('ELECTRONIC CLASS RECORD', titleStyle); merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 32 } }); R++;
        ws['A2'] = createCell(`SY ${settings.schoolYear} - ${quarterTextFull}`, subTitleStyle); merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 32 } }); R++;
        ws['A3'] = createCell(`GRADE & SECTION: ${selectedSectionText}`, subTitleStyle); merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 32 } }); R++;
        ws['A4'] = createCell(`TEACHER: ${settings.teacherName} | SUBJECT: ${subject.toUpperCase()}`, subTitleStyle); merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 32 } }); R++; R++;
        
        // Summary Table on the side
        ws['AF1'] = createCell('SUMMARY OF GRADES', summaryHeaderStyle); merges.push({ s: { r: 0, c: 31 }, e: { r: 0, c: 32 } });
        ws['AF2'] = createCell('Passed', centeredStyle); ws['AG2'] = createCell(summary.passed, centeredStyle, 'n');
        ws['AF3'] = createCell('Failed', centeredStyle); ws['AG3'] = createCell(summary.failed, centeredStyle, 'n');

        // Main Table Headers
        const headerRow1 = R, headerRow2 = R + 1, hpsRow = R + 2;
        
        ws[XLSX.utils.encode_cell({r: headerRow1, c: 0})] = createCell("LEARNERS' NAMES", headerStyle); merges.push({ s: { r: headerRow1, c: 0 }, e: { r: hpsRow, c: 1 } });
        ws[XLSX.utils.encode_cell({r: headerRow1, c: 2})] = createCell(`WRITTEN WORK (${recordSettings.wwPercentage * 100}%)`, headerStyle); merges.push({ s: { r: headerRow1, c: 2 }, e: { r: headerRow1, c: 14 } });
        ws[XLSX.utils.encode_cell({r: headerRow1, c: 15})] = createCell(`PERFORMANCE TASK (${recordSettings.ptPercentage * 100}%)`, headerStyle); merges.push({ s: { r: headerRow1, c: 15 }, e: { r: headerRow1, c: 27 } });
        ws[XLSX.utils.encode_cell({r: headerRow1, c: 28})] = createCell(`QUARTERLY ASSESSMENT (${recordSettings.qaPercentage * 100}%)`, headerStyle); merges.push({ s: { r: headerRow1, c: 28 }, e: { r: headerRow1, c: 30 } });
        ws[XLSX.utils.encode_cell({r: headerRow1, c: 31})] = createCell('Initial Grade', headerStyle); merges.push({ s: { r: headerRow1, c: 31 }, e: { r: hpsRow, c: 31 } });
        ws[XLSX.utils.encode_cell({r: headerRow1, c: 32})] = createCell(`Quarterly Grade`, headerStyle); merges.push({ s: { r: headerRow1, c: 32 }, e: { r: hpsRow, c: 32 } });
        
        for(let i=0; i<10; i++) ws[XLSX.utils.encode_cell({r: headerRow2, c: 2+i})] = createCell(i+1, headerStyle, 'n');
        ws[XLSX.utils.encode_cell({r: headerRow2, c: 12})] = createCell('Total', headerStyle); ws[XLSX.utils.encode_cell({r: headerRow2, c: 13})] = createCell('PS', headerStyle); ws[XLSX.utils.encode_cell({r: headerRow2, c: 14})] = createCell('WS', headerStyle);
        for(let i=0; i<10; i++) ws[XLSX.utils.encode_cell({r: headerRow2, c: 15+i})] = createCell(i+1, headerStyle, 'n');
        ws[XLSX.utils.encode_cell({r: headerRow2, c: 25})] = createCell('Total', headerStyle); ws[XLSX.utils.encode_cell({r: headerRow2, c: 26})] = createCell('PS', headerStyle); ws[XLSX.utils.encode_cell({r: headerRow2, c: 27})] = createCell('WS', headerStyle);
        ws[XLSX.utils.encode_cell({r: headerRow2, c: 28})] = createCell('1', headerStyle); ws[XLSX.utils.encode_cell({r: headerRow2, c: 29})] = createCell('PS', headerStyle); ws[XLSX.utils.encode_cell({r: headerRow2, c: 30})] = createCell('WS', headerStyle);
        
        // HPS Row
        ws[XLSX.utils.encode_cell({r: hpsRow, c: 0})] = createCell("HIGHEST POSSIBLE SCORE", boldCenteredStyle); merges.push({ s: { r: hpsRow, c: 0 }, e: { r: hpsRow, c: 1 } });
        const wwMaxTotal = recordSettings.writtenWorksMax.reduce((a, b) => a + (b || 0), 0);
        const ptMaxTotal = recordSettings.performanceTasksMax.reduce((a, b) => a + (b || 0), 0);
        recordSettings.writtenWorksMax.forEach((s, i) => { ws[XLSX.utils.encode_cell({r: hpsRow, c: 2+i})] = createCell(s, boldCenteredStyle, 'n'); });
        ws[XLSX.utils.encode_cell({r: hpsRow, c: 12})] = createCell(wwMaxTotal, boldCenteredStyle, 'n'); ws[XLSX.utils.encode_cell({r: hpsRow, c: 13})] = createCell(100, boldCenteredStyle, 'n'); ws[XLSX.utils.encode_cell({r: hpsRow, c: 14})] = createCell(recordSettings.wwPercentage * 100, boldCenteredStyle, 'n');
        recordSettings.performanceTasksMax.forEach((s, i) => { ws[XLSX.utils.encode_cell({r: hpsRow, c: 15+i})] = createCell(s, boldCenteredStyle, 'n'); });
        ws[XLSX.utils.encode_cell({r: hpsRow, c: 25})] = createCell(ptMaxTotal, boldCenteredStyle, 'n'); ws[XLSX.utils.encode_cell({r: hpsRow, c: 26})] = createCell(100, boldCenteredStyle, 'n'); ws[XLSX.utils.encode_cell({r: hpsRow, c: 27})] = createCell(recordSettings.ptPercentage * 100, boldCenteredStyle, 'n');
        ws[XLSX.utils.encode_cell({r: hpsRow, c: 28})] = createCell(recordSettings.quarterlyAssessmentMax, boldCenteredStyle, 'n'); ws[XLSX.utils.encode_cell({r: hpsRow, c: 29})] = createCell(100, boldCenteredStyle, 'n'); ws[XLSX.utils.encode_cell({r: hpsRow, c: 30})] = createCell(recordSettings.qaPercentage * 100, boldCenteredStyle, 'n');
        ws[XLSX.utils.encode_cell({r: hpsRow, c: 31})] = createCell(100, boldCenteredStyle, 'n'); ws[XLSX.utils.encode_cell({r: hpsRow, c: 32})] = createCell(100, boldCenteredStyle, 'n');
        
        R = hpsRow + 1;

        const renderStudentRows = (students: Student[], startIndex: number) => {
            students.forEach((student, index) => {
                const record = data.studentRecords.find(r => r.studentId === student.id);
                const calcs = calculationResults.get(student.id) || {};
                ws[XLSX.utils.encode_cell({r: R, c: 0})] = createCell(startIndex + index + 1, centeredStyle, 'n');
                ws[XLSX.utils.encode_cell({r: R, c: 1})] = createCell(`${student.lastName}, ${student.firstName}${student.middleName && student.middleName.trim() ? ` ${student.middleName.trim().charAt(0)}.` : ''}`, leftAlignedStyle);
                if (record) {
                    record.writtenWorks.forEach((s, i) => { ws[XLSX.utils.encode_cell({r: R, c: 2+i})] = createCell(s, centeredStyle, 'n'); });
                    ws[XLSX.utils.encode_cell({r: R, c: 12})] = createCell(calcs.wwTotal, centeredStyle, 'n'); ws[XLSX.utils.encode_cell({r: R, c: 13})] = createCell(calcs.wwPs, centeredStyle, 'n'); ws[XLSX.utils.encode_cell({r: R, c: 14})] = createCell(calcs.wwWs, boldCenteredStyle, 'n');
                    record.performanceTasks.forEach((s, i) => { ws[XLSX.utils.encode_cell({r: R, c: 15+i})] = createCell(s, centeredStyle, 'n'); });
                    ws[XLSX.utils.encode_cell({r: R, c: 25})] = createCell(calcs.ptTotal, centeredStyle, 'n'); ws[XLSX.utils.encode_cell({r: R, c: 26})] = createCell(calcs.ptPs, centeredStyle, 'n'); ws[XLSX.utils.encode_cell({r: R, c: 27})] = createCell(calcs.ptWs, boldCenteredStyle, 'n');
                    ws[XLSX.utils.encode_cell({r: R, c: 28})] = createCell(record.quarterlyAssessment, centeredStyle, 'n'); ws[XLSX.utils.encode_cell({r: R, c: 29})] = createCell(calcs.qaPs, centeredStyle, 'n'); ws[XLSX.utils.encode_cell({r: R, c: 30})] = createCell(calcs.qaWs, boldCenteredStyle, 'n');
                    ws[XLSX.utils.encode_cell({r: R, c: 31})] = createCell(calcs.initialGrade, boldCenteredStyle, 'n'); ws[XLSX.utils.encode_cell({r: R, c: 32})] = createCell(calcs.quarterlyGrade, boldCenteredStyle, 'n');
                } else {
                    for(let c=2; c<=32; c++) ws[XLSX.utils.encode_cell({r: R, c})] = createCell('', centeredStyle);
                }
                R++;
            });
        };

        if (allStudents.males.length > 0) {
            ws[XLSX.utils.encode_cell({r:R, c:0})] = createCell("MALE", genderHeaderStyle); merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 32 } }); R++;
            renderStudentRows(allStudents.males, 0);
        }
        if (allStudents.females.length > 0) {
            ws[XLSX.utils.encode_cell({r:R, c:0})] = createCell("FEMALE", genderHeaderStyle); merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 32 } }); R++;
            renderStudentRows(allStudents.females, allStudents.males.length);
        }
        
        ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 34, r: R + 2 } });
        ws['!merges'] = merges;
        ws['!cols'] = [ { wch: 4 }, { wch: 30 }, ...Array(10).fill({ wch: 5 }), { wch: 6 }, { wch: 8 }, { wch: 8 }, ...Array(10).fill({ wch: 5 }), { wch: 6 }, { wch: 8 }, { wch: 8 }, { wch: 6 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 2 }, { wch: 15 }, { wch: 8 } ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Q${quarter} ${subject}`);
        const fileName = `E-Class_Record_${subject.replace(/\s/g, '_')}_Q${quarter}_${selectedSectionText.replace(/\s/g, '_')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }
    
    public generateMapehRecordXlsx(data: MapehRecordDocxData): void {
        const { summaryData, settings, quarter, selectedSectionText } = data;
        const sheetData: (string | number | null)[][] = [];

        sheetData.push([`MAPEH Summary - Quarter ${quarter}`]);
        sheetData.push([`Class: ${selectedSectionText}`]);
        sheetData.push([`Teacher: ${settings.teacherName}`]);
        sheetData.push([]);
        sheetData.push(["Student Name", "Music", "Arts", "PE", "Health", "Final MAPEH Grade"]);

        summaryData.forEach(item => {
            sheetData.push([
                `${item.student.lastName}, ${item.student.firstName}${item.student.middleName && item.student.middleName.trim() ? ` ${item.student.middleName.trim().charAt(0)}.` : ''}`,
                item.componentGrades["Music"],
                item.componentGrades["Arts"],
                item.componentGrades["PE"],
                item.componentGrades["Health"],
                item.finalMapehGrade
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws['!cols'] = [{ wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 20 }];
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `MAPEH Summary Q${quarter}`);
        
        const fileName = `MAPEH_Summary_${selectedSectionText.replace(/\s/g, '_')}_Q${quarter}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }

    public generateSummaryOfGradesXlsx(data: SummaryOfGradesData): void {
        const { students, settings, subject, selectedSectionText, summaryStats } = data;
        const sheetData: (string | number | null)[][] = [];
        const merges: XLSX.Range[] = [];
        let R = 0;

        // Header
        const headerTitle = `Summary of Quarterly Grades`;
        sheetData.push([null, null, null, headerTitle]);
        merges.push({ s: { r: R, c: 3 }, e: { r: R, c: 4 } }); R++;
        sheetData.push([null, null, null, `(Pursuant to DepEd Order 8, s. 2015)`]);
        merges.push({ s: { r: R, c: 3 }, e: { r: R, c: 4 } }); R++; R++;
        
        sheetData.push(['Region:', settings.region, null, 'Division:', settings.division]);
        merges.push({ s: { r: R, c: 1 }, e: { r: R, c: 2 } }); R++;
        sheetData.push(['School Name:', settings.schoolName, null, 'School ID:', settings.schoolId]);
        merges.push({ s: { r: R, c: 1 }, e: { r: R, c: 2 } }); R++;
        sheetData.push(['Grade & Section:', selectedSectionText, null, 'School Year:', settings.schoolYear]);
        merges.push({ s: { r: R, c: 1 }, e: { r: R, c: 2 } }); R++;
        sheetData.push(['Subject:', subject, null, 'Teacher:', settings.teacherName]);
        merges.push({ s: { r: R, c: 1 }, e: { r: R, c: 2 } }); R++; R++;

        // Table Headers
        const tableHeaders = ["#", "LEARNERS' NAMES", "Q1", "Q2", "Q3", "Q4", "FINAL GRADE", "REMARKS"];
        sheetData.push(tableHeaders);
        R++;
        
        const createStudentRow = (studentData: any, index: number) => {
            return [
                index + 1,
                `${studentData.student.lastName}, ${studentData.student.firstName}${studentData.student.middleName && studentData.student.middleName.trim() ? ` ${studentData.student.middleName.trim().charAt(0)}.` : ''}`,
                ...studentData.quarterlyGrades,
                studentData.finalGrade,
                studentData.remark,
            ];
        };

        // Male students
        if (students.males.length > 0) {
            sheetData.push(["MALE"]);
            merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 7 } }); R++;
            students.males.forEach((s, i) => { sheetData.push(createStudentRow(s, i)); R++; });
        }

        // Female students
        if (students.females.length > 0) {
            sheetData.push(["FEMALE"]);
            merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 7 } }); R++;
            students.females.forEach((s, i) => { sheetData.push(createStudentRow(s, students.males.length + i)); R++; });
        }

        // Summary Footer
        R++;
        sheetData.push(["Summary"]);
        merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 7 } }); R++;
        sheetData.push(["", "Male", "Female", "Total"]); R++;
        sheetData.push(["Passed", summaryStats.malesPassed, summaryStats.femalesPassed, summaryStats.malesPassed + summaryStats.femalesPassed]); R++;
        sheetData.push(["Failed", summaryStats.malesFailed, summaryStats.femalesFailed, summaryStats.malesFailed + summaryStats.femalesFailed]); R++;

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 12 }];
        ws['!merges'] = merges;
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Summary_${subject}`);

        const fileName = `Summary_of_Grades_${subject.replace(/\s/g, '_')}_${selectedSectionText.replace(/\s/g, '_')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }
}

export const excelService = new ExcelService();