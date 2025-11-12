import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  PageOrientation,
  ImageRun,
  HeadingLevel,
  UnderlineType,
  IParagraphOptions,
  PageBreak,
  IRunOptions,
  Numbering,
  Indent,
  IImageOptions,
  VerticalAlign,
  HeightRule,
  TableVerticalAlign,
  LevelFormat,
  TextWrappingType,
  HorizontalPositionAlign,
  VerticalPositionAlign,
  ShadingType,
} from 'docx';
import { Student, SchoolSettings, Attendance, Quarter, SubjectQuarterSettings, StudentQuarterlyRecord, MapehRecordDocxData, GeneratedQuiz, GeneratedQuizQuestion, DlpContent, DlpProcedure, QuizType, DllContent, DllObjectives, DllDailyEntry, DllProcedure as DllProcedureType, DlpRubricItem, StudentProfileDocxData, LearningActivitySheet } from '../types';
import { toast } from 'react-hot-toast';

interface SummaryOfGradesDocxData {
    students: {
        males: any[];
        females: any[];
    };
    settings: SchoolSettings;
    subject: string;
    summaryStats: {
        malesPassed: number;
        malesFailed: number;
        femalesPassed: number;
        femalesFailed: number;
    };
    selectedSectionText: string;
}

interface EClassRecordDocxData {
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

interface CertificateDocxData {
    honorRoll: any[];
    settings: SchoolSettings;
    designOptions: {
        title: string;
        content: string;
        fontFamily: string;
        fontSize: number;
        subject: string;
        quarter: Quarter;
        gradeAndSectionOverride?: string;
        showCheckerSignature: boolean;
        adviserDesignation: string;
    }
}

interface HonorsListDocxData {
    honorStudents: {
        highest: any[];
        high: any[];
        regular: any[];
    };
    settings: SchoolSettings;
    selectedSectionText: string;
}

interface PickedStudentsDocxData {
    pickedStudents: Student[];
    topic: string;
    settings: SchoolSettings;
    sectionText: string;
}

interface GroupsDocxData {
    groups: Student[][];
    topic: string;
    settings: SchoolSettings;
    sectionText: string;
}

class DocxService {
    private parseDataUrl(dataUrl: string | undefined): { type: "svg" | "jpg" | "png" | "gif" | "bmp"; data: string } | null {
        if (!dataUrl || !dataUrl.startsWith("data:image/")) {
            return null;
        }
        const parts = dataUrl.split(",");
        if (parts.length !== 2) return null;

        const meta = parts[0];
        const data = parts[1];

        const mimeMatch = meta.match(/data:image\/(.*?);base64/);
        if (!mimeMatch || !mimeMatch[1]) return null;

        let type = mimeMatch[1];
        if (type === "jpeg" || type === "jpg") {
            type = "jpg";
        }
        if (type === "svg+xml") {
            type = "svg";
        }

        const validTypes: Array<"svg" | "jpg" | "png" | "gif" | "bmp"> = ["svg", "jpg", "png", "gif", "bmp"];
        if (!validTypes.includes(type as any)) {
            return null;
        }

        return { type: type as "svg" | "jpg" | "png" | "gif" | "bmp", data };
    }
    
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    private createDocxImage(
        parsedImage: { type: "svg" | "jpg" | "png" | "gif" | "bmp"; data: string } | null,
        width: number,
        height: number,
        options: Partial<IImageOptions> = {}
    ): ImageRun | undefined {
        if (!parsedImage || !parsedImage.data) {
            return undefined;
        }

        try {
            if (parsedImage.type === 'svg') {
                const fallbackImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                return new ImageRun({
                    type: 'svg',
                    data: this.base64ToArrayBuffer(parsedImage.data),
                    transformation: {
                        width,
                        height,
                    },
                    fallback: {
                        type: 'png',
                        data: this.base64ToArrayBuffer(fallbackImageData),
                    },
                    ...options
                });
            } else {
                 return new ImageRun({
                    type: parsedImage.type,
                    data: this.base64ToArrayBuffer(parsedImage.data),
                    transformation: {
                        width: width,
                        height: height,
                    },
                    ...options
                });
            }
        } catch (e) {
            console.error("Failed to create ImageRun. The image data might be corrupt.", e);
            toast.error("An error occurred while processing an image for the document.");
            return undefined;
        }
    }

    private async downloadBlob(blob: Blob, fileName: string): Promise<void> {
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);
    }


  public async generateAttendanceDocx(students: Student[], attendance: Attendance[], currentDate: Date, schoolSettings: SchoolSettings): Promise<void> {
    const year = currentDate.getUTCFullYear();
    const month = currentDate.getUTCMonth(); 

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const studentsByGender = {
        males: students.filter(s => s.gender === 'Male').sort((a,b) => a.lastName.localeCompare(b.lastName)),
        females: students.filter(s => s.gender === 'Female').sort((a,b) => a.lastName.localeCompare(b.lastName)),
        others: students.filter(s => s.gender !== 'Male' && s.gender !== 'Female').sort((a,b) => a.lastName.localeCompare(b.lastName))
    };

    const attendanceMap = new Map<string, Map<number, string>>();
    for (const att of attendance) {
        const attDate = new Date(`${att.date}T00:00:00Z`);
        if (attDate.getUTCFullYear() === year && attDate.getUTCMonth() === month) {
            if (!attendanceMap.has(att.studentId)) {
                attendanceMap.set(att.studentId, new Map());
            }
            const day = attDate.getUTCDate();
            const status = att.status === 'present' ? '' : att.status === 'late' ? '.' : 'x';
            attendanceMap.get(att.studentId)!.set(day, status);
        }
    }

    const summary = (() => {
        const totalAbsences: Record<string, number> = {};
        const totalTardies: Record<string, number> = {};

        students.forEach(s => {
            totalAbsences[s.id] = 0;
            totalTardies[s.id] = 0;
        });

        attendanceMap.forEach((dayMap, studentId) => {
            if(!students.find(s => s.id === studentId)) return;
            dayMap.forEach(status => {
                if (status === 'x') totalAbsences[studentId]++;
                if (status === '.') totalTardies[studentId]++;
            });
        });
        
        const dailySummary = monthDays.map(day => {
            let absent = 0;
            let tardy = 0;
            students.forEach(student => {
                 const status = attendanceMap.get(student.id)?.get(day);
                 if (status === 'x') absent++;
                 if (status === '.') tardy++;
            })
            return { absent, tardy };
        });

        return { totalAbsences, totalTardies, dailySummary };
    })();
    
    const tableHeader1 = new TableRow({
        tableHeader: true,
        children: [
            new TableCell({ children: [new Paragraph({ text: "#", alignment: AlignmentType.CENTER })], rowSpan: 2, verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ text: "(Learner's Name)", alignment: AlignmentType.CENTER })], rowSpan: 2, verticalAlign: VerticalAlign.CENTER, width: { size: 3500, type: WidthType.DXA } }),
            new TableCell({ children: [new Paragraph({ text: "(Date)", alignment: AlignmentType.CENTER })], columnSpan: daysInMonth, verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ text: "Total", alignment: AlignmentType.CENTER })], columnSpan: 2, verticalAlign: VerticalAlign.CENTER }),
        ]
    });

    const tableHeader2 = new TableRow({
        tableHeader: true,
        children: [
            ...monthDays.map(day => new TableCell({ children: [new Paragraph({ text: day.toString(), alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, width: { size: 400, type: WidthType.DXA } })),
            new TableCell({ children: [new Paragraph({ text: "Absences", alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph({ text: "Tardiness", alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
        ],
    });

    const createStudentRows = (studentList: Student[], startIndex: number) => {
        return studentList.map((student, index) => {
            const cells = [
                new TableCell({ children: [new Paragraph({ text: (startIndex + index + 1).toString(), alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ text: `${student.lastName}, ${student.firstName} ${student.middleName?.[0] || ''}.`, alignment: AlignmentType.LEFT })], verticalAlign: VerticalAlign.CENTER }),
            ];

            for (let day = 1; day <= daysInMonth; day++) {
                cells.push(new TableCell({ children: [new Paragraph({ text: attendanceMap.get(student.id)?.get(day) || '', alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }));
            }

            cells.push(new TableCell({ children: [new Paragraph({ text: summary.totalAbsences[student.id]?.toString() || '0', alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }));
            cells.push(new TableCell({ children: [new Paragraph({ text: summary.totalTardies[student.id]?.toString() || '0', alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }));
            
            return new TableRow({ children: cells });
        });
    };

    const maleRows = createStudentRows(studentsByGender.males, 0);
    const femaleRows = createStudentRows(studentsByGender.females, studentsByGender.males.length);

    const monthName = currentDate.toLocaleString('default', { month: 'long', timeZone: 'UTC' });
    const studentInfo = students[0];
    const sectionText = (studentInfo?.gradeLevel && studentInfo?.section) ? `${studentInfo.gradeLevel} - ${studentInfo.section}` : 'Class';

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: { width: 18720, height: 12240 }, // 13 x 8.5 inches in DXA
                    margin: { top: 720, right: 720, bottom: 720, left: 720 },
                },
            },
            children: [
                new Paragraph({ text: "Monthly Attendance Report", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `For the Month of: ${monthName} ${year}`, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `Class: ${sectionText}`, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `Teacher: ${schoolSettings.teacherName}`, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "" }), // Spacer
                new Table({
                    rows: [
                        tableHeader1,
                        tableHeader2,
                        new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "MALE", alignment: AlignmentType.LEFT })], columnSpan: daysInMonth + 4, borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE } } })] }),
                        ...maleRows,
                        new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "FEMALE", alignment: AlignmentType.LEFT })], columnSpan: daysInMonth + 4, borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE } } })] }),
                        ...femaleRows
                    ],
                    width: { size: 100, type: WidthType.PERCENTAGE },
                }),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    this.downloadBlob(blob, `Attendance_Report_${sectionText.replace(/\s/g, '_')}_${monthName}_${year}.docx`);
  }


    public async generateSF2Docx(students: Student[], attendance: Attendance[], schoolSettings: SchoolSettings, currentUTCDate: Date): Promise<void> {
        // --- 1. CALCULATIONS ---
        const year = currentUTCDate.getUTCFullYear();
        const month = currentUTCDate.getUTCMonth();
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const monthName = currentUTCDate.toLocaleString('default', { month: 'long', timeZone: 'UTC' });

        const studentsByGender = {
            males: students.filter(s => s.gender === 'Male').sort((a, b) => a.lastName.localeCompare(b.lastName)),
            females: students.filter(s => s.gender === 'Female').sort((a, b) => a.lastName.localeCompare(b.lastName)),
        };

        const attendanceMap = new Map<string, Map<number, string>>();
        attendance.forEach(att => {
            const attDate = new Date(`${att.date}T00:00:00Z`);
            if (attDate.getUTCFullYear() === year && attDate.getUTCMonth() === month) {
                if (!attendanceMap.has(att.studentId)) {
                    attendanceMap.set(att.studentId, new Map());
                }
                const day = attDate.getUTCDate();
                const status = att.status === 'absent' ? 'x' : att.status === 'late' ? '.' : '';
                if (status) attendanceMap.get(att.studentId)!.set(day, status);
            }
        });

        const summary = (() => {
            const studentTotals = new Map<string, { absences: number; tardies: number }>();
            const dailyTotals = {
                male: { absences: Array(daysInMonth + 1).fill(0), tardies: Array(daysInMonth + 1).fill(0) },
                female: { absences: Array(daysInMonth + 1).fill(0), tardies: Array(daysInMonth + 1).fill(0) },
            };
            
            let schoolDays = 0;
            for (let day = 1; day <= daysInMonth; day++) {
                const d = new Date(Date.UTC(year, month, day));
                if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) { schoolDays++; }
            }

            students.forEach(s => {
                let absences = 0, tardies = 0;
                for (let day = 1; day <= daysInMonth; day++) {
                    const status = attendanceMap.get(s.id)?.get(day);
                    if (status === 'x') {
                        absences++;
                        if (s.gender === 'Male') dailyTotals.male.absences[day]++;
                        else if (s.gender === 'Female') dailyTotals.female.absences[day]++;
                    } else if (status === '.') {
                        tardies++;
                        if (s.gender === 'Male') dailyTotals.male.tardies[day]++;
                        else if (s.gender === 'Female') dailyTotals.female.tardies[day]++;
                    }
                }
                studentTotals.set(s.id, { absences, tardies });
            });

            const monthlyMaleAbsences = dailyTotals.male.absences.reduce((a,b)=> a+b, 0);
            const monthlyFemaleAbsences = dailyTotals.female.absences.reduce((a,b)=> a+b, 0);
            const monthlyMaleTardies = dailyTotals.male.tardies.reduce((a,b)=> a+b, 0);
            const monthlyFemaleTardies = dailyTotals.female.tardies.reduce((a,b)=> a+b, 0);
            const totalEnrolmentMale = studentsByGender.males.length;
            const totalEnrolmentFemale = studentsByGender.females.length;
            const totalPossibleAttendanceMale = totalEnrolmentMale * schoolDays;
            const totalPossibleAttendanceFemale = totalEnrolmentFemale * schoolDays;
            const totalAttendanceMale = totalPossibleAttendanceMale - monthlyMaleAbsences;
            const totalAttendanceFemale = totalPossibleAttendanceFemale - monthlyFemaleAbsences;
            const percAttendanceMale = totalPossibleAttendanceMale > 0 ? (totalAttendanceMale / totalPossibleAttendanceMale) * 100 : 0;
            const percAttendanceFemale = totalPossibleAttendanceFemale > 0 ? (totalAttendanceFemale / totalPossibleAttendanceFemale) * 100 : 0;
            const totalPerc = (totalPossibleAttendanceMale + totalPossibleAttendanceFemale > 0) 
                ? ((totalAttendanceMale + totalAttendanceFemale) / (totalPossibleAttendanceMale + totalPossibleAttendanceFemale)) * 100
                : 0;

            return { studentTotals, dailyTotals, monthlyMaleAbsences, monthlyFemaleAbsences, monthlyMaleTardies, monthlyFemaleTardies, percAttendanceMale, percAttendanceFemale, totalPerc, schoolDays };
        })();
        
        // --- 2. DOCX STYLES & HELPERS ---
        const font = "Times New Roman";
        const text = (txt: string, options: Omit<IRunOptions, 'children'> = {}) => new TextRun({ text: txt, font, size: 14, ...options });
        const boldText = (txt: string, options: Omit<IRunOptions, 'children'> = {}) => text(txt, { bold: true, ...options });
        const p = (children: (TextRun | ImageRun)[], options: IParagraphOptions = {}) => new Paragraph({ children, ...options });
        const fillInLine = (length: number = 20) => new TextRun({ text: " ".repeat(length), underline: { type: UnderlineType.SINGLE } });
        const checkBox = (checked = false) => new TextRun({ text: checked ? "☒" : "☐", font: "Wingdings" });

        const thinBorder = { style: BorderStyle.SINGLE, size: 2, color: "000000" };
        const createCell = (children: (Paragraph|Table)[], options: any = {}) => new TableCell({ children, borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }, verticalAlign: VerticalAlign.CENTER, ...options });

        // --- 3. DOCUMENT CONSTRUCTION ---
        let gradeLevel = '_______';
        let section = '_______';

        const studentWithInfo = students.find(s => s.gradeLevel && s.section);
        if (studentWithInfo) {
            gradeLevel = studentWithInfo.gradeLevel;
            section = studentWithInfo.section;
        } else if (students.length > 0) {
            const firstStudent = students[0];
            const fileName = firstStudent.importFileName || '';
            const match = fileName.match(/(Grade\s*\d+|\d+)\s*-\s*([\w\s]+)/i);
            if (match) {
                gradeLevel = match[1].replace(/Grade\s*/i, 'Grade ').trim();
                section = match[2].replace(/\.(xlsx|docx)$/i, '').trim();
            } else if (firstStudent.gradeLevel) {
                gradeLevel = firstStudent.gradeLevel;
            } else if (firstStudent.section) {
                section = firstStudent.section;
            }
        }
        
        const totalColumns = daysInMonth + 4;

        const headerInfoTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, columnWidths: [10, 20, 10, 20, 10, 30],
            rows: [
                new TableRow({ children: [ createCell([p([text("School ID")])], { borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }), createCell([p([boldText(schoolSettings.schoolId)])], { borders: { bottom: thinBorder } }), createCell([p([text("School Year")])], { borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }), createCell([p([boldText(schoolSettings.schoolYear)])], { borders: { bottom: thinBorder } }), createCell([p([text("Grade Level")])], { borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }), createCell([p([boldText(gradeLevel)])], { borders: { bottom: thinBorder } }) ] }),
                new TableRow({ children: [ createCell([p([text("Name of School")])], { borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }), createCell([p([boldText(schoolSettings.schoolName)])], { borders: { bottom: thinBorder }, columnSpan: 3 }), createCell([p([text("Section")])], { borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }), createCell([p([boldText(section)])], { borders: { bottom: thinBorder } }) ] }),
            ]
        });

        const mainTableRows: TableRow[] = [
            // Headers
            new TableRow({ tableHeader: true, children: [ createCell([p([boldText("#", {size: 14})])], { rowSpan: 2 }), createCell([p([boldText("LEARNER'S NAME", {size: 14})])], { rowSpan: 2, width: { size: 3000, type: WidthType.DXA } }), createCell([p([boldText("(Daily Attendance)", {size: 14})], { alignment: AlignmentType.CENTER })], { columnSpan: daysInMonth }), createCell([p([boldText("Total for the Month", {size: 14})], { alignment: AlignmentType.CENTER })], { columnSpan: 2 }) ] }),
            new TableRow({ tableHeader: true, children: [ ...monthDays.map(day => createCell([p([text(day.toString(), {size: 14})], { alignment: AlignmentType.CENTER })])), createCell([p([text("ABSENCES", {size: 12})], { alignment: AlignmentType.CENTER })]), createCell([p([text("TARDINESS", {size: 12})], { alignment: AlignmentType.CENTER })]) ] }),
        ];

        // Males
        if(studentsByGender.males.length > 0) {
            mainTableRows.push(new TableRow({ children: [createCell([p([boldText("MALE", {size: 14})])], { alignment: AlignmentType.LEFT, spacing: { before: 100, after: 100 } }), ...Array.from({length: totalColumns-1}).map(()=> createCell([]))] }));
            studentsByGender.males.forEach((s, i) => mainTableRows.push(new TableRow({ children: [ createCell([p([text((i + 1).toString())], { alignment: AlignmentType.CENTER })]), createCell([p([text(`  ${s.lastName}, ${s.firstName} ${s.middleName?.[0] || ''}.`)], { alignment: AlignmentType.LEFT })]), ...monthDays.map(day => createCell([p([text(attendanceMap.get(s.id)?.get(day) || '', {size: 14})], { alignment: AlignmentType.CENTER })])), createCell([p([text(summary.studentTotals.get(s.id)?.absences.toString() || '0')], { alignment: AlignmentType.CENTER })]), createCell([p([text(summary.studentTotals.get(s.id)?.tardies.toString() || '0')], { alignment: AlignmentType.CENTER })]) ] })));
        }
        mainTableRows.push(new TableRow({ children: [createCell([p([boldText(`MALE | Total per Day →`, {size: 14})])], { columnSpan: 2 }), ...monthDays.map(day => createCell([p([boldText((summary.dailyTotals.male.absences[day] || '').toString(), {size: 14})], { alignment: AlignmentType.CENTER })])), createCell([p([boldText(summary.monthlyMaleAbsences.toString(), {size: 14})], { alignment: AlignmentType.CENTER })]), createCell([p([boldText(summary.monthlyMaleTardies.toString(), {size: 14})], { alignment: AlignmentType.CENTER })]) ] }));
        
        // Females
        if (studentsByGender.females.length > 0) {
            mainTableRows.push(new TableRow({ children: [createCell([p([boldText("FEMALE", {size: 14})])], { alignment: AlignmentType.LEFT, spacing: { before: 100, after: 100 } }), ...Array.from({length: totalColumns-1}).map(()=> createCell([]))] }));
            studentsByGender.females.forEach((s, i) => mainTableRows.push(new TableRow({ children: [ createCell([p([text((studentsByGender.males.length + i + 1).toString())], { alignment: AlignmentType.CENTER })]), createCell([p([text(`  ${s.lastName}, ${s.firstName} ${s.middleName?.[0] || ''}.`)], { alignment: AlignmentType.LEFT })]), ...monthDays.map(day => createCell([p([text(attendanceMap.get(s.id)?.get(day) || '', {size: 14})], { alignment: AlignmentType.CENTER })])), createCell([p([text(summary.studentTotals.get(s.id)?.absences.toString() || '0')], { alignment: AlignmentType.CENTER })]), createCell([p([text(summary.studentTotals.get(s.id)?.tardies.toString() || '0')], { alignment: AlignmentType.CENTER })]) ] })));
        }
        mainTableRows.push(new TableRow({ children: [createCell([p([boldText(`FEMALE | Total per Day →`, {size: 14})])], { columnSpan: 2 }), ...monthDays.map(day => createCell([p([boldText((summary.dailyTotals.female.absences[day] || '').toString(), {size: 14})], { alignment: AlignmentType.CENTER })])), createCell([p([boldText(summary.monthlyFemaleAbsences.toString(), {size: 14})], { alignment: AlignmentType.CENTER })]), createCell([p([boldText(summary.monthlyFemaleTardies.toString(), {size: 14})], { alignment: AlignmentType.CENTER })]) ] }));
        
        mainTableRows.push(new TableRow({ children: [createCell([p([boldText(`COMBINED | Total per Day →`, {size: 14})])], { columnSpan: 2 }), ...monthDays.map(day => createCell([p([boldText(((summary.dailyTotals.male.absences[day] + summary.dailyTotals.female.absences[day]) || '').toString(), {size: 14})], { alignment: AlignmentType.CENTER })])), createCell([p([boldText((summary.monthlyMaleAbsences + summary.monthlyFemaleAbsences).toString(), {size: 14})], { alignment: AlignmentType.CENTER })]), createCell([p([boldText((summary.monthlyMaleTardies + summary.monthlyFemaleTardies).toString(), {size: 14})], { alignment: AlignmentType.CENTER })]) ] }));

        const guidelines = [ p([boldText("GUIDELINES:", {size:16})]), p([text("1. The attendance shall be checked every day.", {size:16})]), p([text("2. Dates shall be written in the columns after Learner's Name.", {size:16})]), p([text("3. To mark the attendance, write the following symbols:", {size:16})]), p([text("(blank) - Present", {size:16})], { indent: { left: 360 } }), p([text("(x) - Absent on a particular day.", {size:16})], { indent: { left: 360 } }), p([text("(.) - Tardy (late) in the morning or afternoon.", {size:16})], { indent: { left: 360 } }) ];
        const monthSummaryTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ tableHeader: true, children: [createCell([p([boldText(`Month: ${monthName}`, {size: 12})], { alignment: AlignmentType.CENTER })]), createCell([p([boldText("Male", {size: 12})], { alignment: AlignmentType.CENTER })]), createCell([p([boldText("Female", {size: 12})], { alignment: AlignmentType.CENTER })]), createCell([p([boldText("Total", {size: 12})], { alignment: AlignmentType.CENTER })])] }),
                new TableRow({ children: [createCell([p([boldText("No. of Days of Classes", {size: 12})])]), createCell([p([text(summary.schoolDays.toString(), {size: 12})], { alignment: AlignmentType.CENTER })]), createCell([p([text(summary.schoolDays.toString(), {size: 12})], { alignment: AlignmentType.CENTER })]), createCell([p([text(summary.schoolDays.toString(), {size: 12})], { alignment: AlignmentType.CENTER })])] }),
                new TableRow({ children: [createCell([p([boldText("% of Attendance for the month", {size: 12})])]), createCell([p([text(summary.percAttendanceMale.toFixed(2).replace('.', ',')+'%', {size: 12})], { alignment: AlignmentType.CENTER })]), createCell([p([text(summary.percAttendanceFemale.toFixed(2).replace('.', ',')+'%', {size: 12})], { alignment: AlignmentType.CENTER })]), createCell([p([text(summary.totalPerc.toFixed(2).replace('.', ',')+'%', {size: 12})], { alignment: AlignmentType.CENTER })])] }),
            ]
        });

        const doc = new Document({
             sections: [{
                properties: { page: { size: { width: 18720, height: 12240 }, margin: { top: 720, right: 480, bottom: 720, left: 480 } } },
                children: [ 
                    p([boldText("School Form 2 (SF2) Daily Attendance Report of Learners", {size: 20})], { alignment: AlignmentType.CENTER }),
                    p([text(`(This replaces Form 1, Form 2 & STS Form 4 - Absenteeism and Dropout Profile)`, {size: 14, italics: true})], { alignment: AlignmentType.CENTER }),
                    p([]),
                    headerInfoTable,
                    p([]),
                    new Table({ rows: mainTableRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
                    p([]),
                    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [50, 50], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, rows: [ new TableRow({ children: [ new TableCell({ children: guidelines, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }), new TableCell({ children: [monthSummaryTable], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }) ] })] }),
                    p([]),
                    p([text("I certify that this is a true and correct report.", {size: 16})]),
                    p([]), p([]),
                    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, columnWidths: [60, 40], rows: [ new TableRow({ children: [ new TableCell({children: [], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }}), new TableCell({ children: [ p([boldText(schoolSettings.teacherName.toUpperCase())], { alignment: AlignmentType.CENTER }), p([text("(Signature of Teacher/Class Adviser over Printed Name)")], { alignment: AlignmentType.CENTER, border: { top: thinBorder } }) ], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }) ] }) ] })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const gradeLevelString = gradeLevel.replace(/\s+/g, '-');
        const sectionString = section.replace(/\s+/g, '_');
        const gradeAndSectionString = `${gradeLevelString}_${sectionString}`;
        const fileName = `SF2_${gradeAndSectionString}_${monthName}_${year}.docx`;
        this.downloadBlob(blob, fileName);
    }
    
    public async generateStudentProfileDocx(data: StudentProfileDocxData): Promise<void> {
        const { student, academicSummary, attendanceSummary, recentAnecdotes, settings } = data;

        const studentPhoto = this.createDocxImage(this.parseDataUrl(student.photo), 120, 120);

        const children: (Paragraph | Table)[] = [];

        // Header with Logo
        const schoolLogo = this.createDocxImage(this.parseDataUrl(settings.schoolLogo), 80, 80);
        const headerChildren: Paragraph[] = [];
        if (settings.schoolName) {
            headerChildren.push(new Paragraph({
                children: [new TextRun({ text: settings.schoolName.toUpperCase(), bold: true, size: 28 })],
                alignment: AlignmentType.CENTER,
            }));
        }
        headerChildren.push(new Paragraph({
            children: [new TextRun({ text: "Student Profile Summary", size: 22 })],
            alignment: AlignmentType.CENTER,
        }));
        if (settings.schoolYear) {
            headerChildren.push(new Paragraph({
                children: [new TextRun({ text: `S.Y. ${settings.schoolYear}`, size: 20 })],
                alignment: AlignmentType.CENTER,
            }));
        }

        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [20, 80],
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: schoolLogo ? [new Paragraph({ children: [schoolLogo], alignment: AlignmentType.CENTER })] : [],
                            verticalAlign: VerticalAlign.CENTER,
                        }),
                        new TableCell({
                            children: headerChildren,
                            verticalAlign: VerticalAlign.CENTER,
                        }),
                    ],
                }),
            ],
        });
        children.push(headerTable);
        children.push(new Paragraph({ spacing: { after: 200 } }));


        // Student Info
        const studentInfoTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [30, 70],
            borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: studentPhoto ? [new Paragraph({ children: [studentPhoto], alignment: AlignmentType.CENTER })] : [new Paragraph("No Photo")],
                            verticalAlign: VerticalAlign.CENTER,
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({ children: [new TextRun({ text: `${student.firstName} ${student.lastName}`, bold: true, size: 28, })], }),
                                new Paragraph({ children: [new TextRun({ text: `LRN: ${student.lrn || 'N/A'}`, size: 20 })], }),
                                new Paragraph({ children: [new TextRun({ text: `Grade ${student.gradeLevel || 'N/A'} - ${student.section || 'N/A'}`, size: 20 })], }),
                            ],
                            verticalAlign: VerticalAlign.CENTER,
                        }),
                    ],
                }),
            ],
        });
        children.push(studentInfoTable);
        children.push(new Paragraph({ spacing: { after: 300 } }));

        // Academic Summary
        children.push(new Paragraph({
            children: [new TextRun({ text: "Quarterly Grades Summary", bold: true, size: 24, underline: { type: UnderlineType.SINGLE } })],
            spacing: { after: 100 },
        }));

        if (academicSummary.length > 0) {
            const gradeHeader = new TableRow({
                tableHeader: true,
                children: ["Subject", "Q1", "Q2", "Q3", "Q4"].map(text =>
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
                        shading: { type: ShadingType.CLEAR, fill: "D9D9D9" },
                    })
                ),
            });

            const gradeRows = academicSummary.map(item => new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.subject, size: 18 })] })] }),
                    ...item.grades.map(grade =>
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: grade?.toString() ?? '-', size: 18 })], alignment: AlignmentType.CENTER })],
                        })
                    ),
                ],
            }));

            children.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [gradeHeader, ...gradeRows],
            }));
        } else {
            children.push(new Paragraph({ children: [new TextRun({ text: "No grades recorded.", size: 18, italics: true })] }));
        }
        children.push(new Paragraph({ spacing: { after: 300 } }));

        // Attendance
        children.push(new Paragraph({ children: [new TextRun({ text: "Attendance Summary", bold: true, size: 24, underline: { type: UnderlineType.SINGLE } })], spacing: { after: 100 }, }));
        children.push(new Paragraph({ children: [ new TextRun({ text: `${attendanceSummary.month}: `, bold: true, size: 20 }), new TextRun({ text: `${attendanceSummary.absences} Absences, ${attendanceSummary.lates} Lates`, size: 20 }), ], }));
        children.push(new Paragraph({ spacing: { after: 300 } }));
        
        // Anecdotes
        children.push(new Paragraph({ children: [new TextRun({ text: "Recent Anecdotal Records", bold: true, size: 24, underline: { type: UnderlineType.SINGLE } })], spacing: { after: 100 }, }));
        if (recentAnecdotes.length > 0) {
            recentAnecdotes.forEach(anecdote => {
                children.push(new Paragraph({ children: [ new TextRun({ text: `${new Date(anecdote.date).toLocaleDateString()}: `, bold: true, size: 18 }), new TextRun({ text: `"${anecdote.observation}"`, italics: true, size: 18 }), ], spacing: { after: 100 }, }));
            });
        } else {
            children.push(new Paragraph({ children: [new TextRun({ text: "No records found.", size: 18, italics: true })] }));
        }
        
        // Footer
        children.push(new Paragraph({ spacing: { after: 400 } }));
        children.push(new Paragraph({
            children: [new TextRun({ text: "Prepared by:", size: 18 })]
        }));
        children.push(new Paragraph({ spacing: { after: 800 } })); // Space for signature
        children.push(new Paragraph({
            children: [new TextRun({ text: settings.teacherName.toUpperCase(), bold: true, size: 18, underline: { type: UnderlineType.SINGLE } })]
        }));
         children.push(new Paragraph({
            children: [new TextRun({ text: "Class Adviser", size: 18 })]
        }));


        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        size: {
                            width: 11906, // A4 Portrait width in DXA
                            height: 16838, // A4 Portrait height in DXA
                        },
                        orientation: PageOrientation.PORTRAIT,
                    },
                    margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }, // 0.75 inch
                },
                children,
            }],
        });
        
        const blob = await Packer.toBlob(doc);
        this.downloadBlob(blob, `${student.lastName}_${student.firstName}_Profile.docx`);
    }

    public async generateSummaryOfGradesDocx(data: SummaryOfGradesDocxData): Promise<void> {
        const { students, settings, subject, summaryStats, selectedSectionText } = data;
 
        const text = (txt: string, options: IRunOptions = {}) => new TextRun({ text: txt, font: "Times New Roman", size: 20, ...options });
        const boldText = (txt: string, options: IRunOptions = {}) => text(txt, { bold: true, ...options });
        const p = (children: (TextRun | ImageRun)[], options: IParagraphOptions = {}) => new Paragraph({ children, ...options });
 
        const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
        const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
        const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
 
        const createCell = (children: Paragraph[], options: any = {}) => new TableCell({
            children,
            borders: cellBorders,
            verticalAlign: VerticalAlign.CENTER,
            ...options,
        });
 
        const centerP = (txt: string | TextRun | TextRun[]) => createCell([p(Array.isArray(txt) ? txt : [typeof txt === 'string' ? text(txt) : txt], { alignment: AlignmentType.CENTER })]);
        const leftP = (txt: string | TextRun[]) => createCell([p(Array.isArray(txt) ? txt : [text(txt)], { alignment: AlignmentType.LEFT })]);
        
        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorder,
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                p([boldText("Summary of Quarterly Grades", { size: 28 })], { alignment: AlignmentType.CENTER }),
                                p([text(`School Year ${settings.schoolYear}`, { size: 20 })], { alignment: AlignmentType.CENTER }),
                            ],
                            borders: noBorder,
                            verticalAlign: VerticalAlign.CENTER,
                        }),
                    ],
                }),
            ],
        });
 
        const tableHeader = new TableRow({
            children: [centerP(boldText("#")), centerP(boldText("LEARNERS' NAMES")), centerP(boldText("Q1")), centerP(boldText("Q2")), centerP(boldText("Q3")), centerP(boldText("Q4")), centerP(boldText("FINAL GRADE")), centerP(boldText("REMARKS"))],
            tableHeader: true,
        });
 
        const createStudentRows = (studentList: any[], startIndex: number) => studentList.map((s, i) => {
            const hasAllQuarters = s.quarterlyGrades.length === 4 && s.quarterlyGrades.every((g: number | null) => g !== null);

            return new TableRow({
                children: [
                    centerP(String(startIndex + i + 1)),
                    leftP([text(`${s.student.lastName}, ${s.student.firstName} ${s.student.middleName?.[0] || ''}.`)]),
                    centerP(s.quarterlyGrades[0]?.toString() ?? ''),
                    centerP(s.quarterlyGrades[1]?.toString() ?? ''),
                    centerP(s.quarterlyGrades[2]?.toString() ?? ''),
                    centerP(s.quarterlyGrades[3]?.toString() ?? ''),
                    centerP(boldText(hasAllQuarters ? (s.finalGrade?.toString() ?? '') : '')),
                    centerP(boldText(hasAllQuarters ? (s.remark ?? '') : '')),
                ]
            })
        });
 
        const tableRows = [tableHeader];
        if (students.males.length > 0) {
            tableRows.push(new TableRow({ children: [createCell([p([boldText("MALE")])], { columnSpan: 8, shading: { type: ShadingType.CLEAR, fill: "DDEBF7" } })] }));
            tableRows.push(...createStudentRows(students.males, 0));
        }
        if (students.females.length > 0) {
            tableRows.push(new TableRow({ children: [createCell([p([boldText("FEMALE")])], { columnSpan: 8, shading: { type: ShadingType.CLEAR, fill: "FCE4D6" } })] }));
            tableRows.push(...createStudentRows(students.females, students.males.length));
        }
 
        const summaryTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [centerP(boldText("")), centerP(boldText("Male")), centerP(boldText("Female")), centerP(boldText("Total"))] }),
                new TableRow({ children: [leftP([boldText("Passed")]), centerP(String(summaryStats.malesPassed)), centerP(String(summaryStats.femalesPassed)), centerP(String(summaryStats.malesPassed + summaryStats.femalesPassed))] }),
                new TableRow({ children: [leftP([boldText("Failed")]), centerP(String(summaryStats.malesFailed)), centerP(String(summaryStats.femalesFailed)), centerP(String(summaryStats.malesFailed + summaryStats.femalesFailed))] }),
            ]
        });
 
        const signatureTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            rows: [
                new TableRow({ children: [
                    createCell([ p([text("Prepared by:")]), p([]), p([]), p([boldText(settings.teacherName.toUpperCase())], { alignment: AlignmentType.CENTER }), p([text(settings.teacherName ? 'Teacher' : '')], { alignment: AlignmentType.CENTER, border: { top: thinBorder }}) ], { borders: noBorder }),
                    createCell([], { borders: noBorder }),
                    createCell([ p([text("Checked by:")]), p([]), p([]), p([boldText(settings.checkedBy.toUpperCase())], { alignment: AlignmentType.CENTER }), p([text(settings.checkerDesignation)], { alignment: AlignmentType.CENTER, border: { top: thinBorder }}) ], { borders: noBorder }),
                ]})
            ]
        });
 
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        size: {
                            width: 12240, // 8.5 inches
                            height: 18720, // 13 inches
                        },
                        margin: { top: 720, right: 720, bottom: 720, left: 720 },
                    },
                },
                children: [
                    headerTable,
                    p([]),
                    new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
                    p([]),
                    summaryTable,
                    p([]), p([]), p([]),
                    signatureTable
                ]
            }]
        });
 
        const blob = await Packer.toBlob(doc);
        this.downloadBlob(blob, `Summary_of_Grades_${subject.replace(/\s/g, '_')}_${selectedSectionText.replace(/\s/g, '_')}.docx`);
    }
    
    public async generateEClassRecordDocx(data: EClassRecordDocxData): Promise<void> {
        const { allStudents, settings, subject, quarter, selectedSectionText, recordSettings, studentRecords, calculationResults, summary } = data;

        // --- STYLES & HELPERS ---
        const text = (txt: string, options: IRunOptions = {}) => new TextRun({ text: txt, font: "Calibri", ...options });
        const boldText = (txt: string, options: IRunOptions = {}) => text(txt, { bold: true, ...options });
        const p = (children: (TextRun | ImageRun)[], options: IParagraphOptions = {}) => new Paragraph({ children, alignment: AlignmentType.CENTER, ...options });

        const thinBorder = { style: BorderStyle.SINGLE, size: 2, color: "000000" };
        const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
        const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

        const createCell = (children: (Paragraph|Table)[], options: any = {}) => new TableCell({
            children,
            borders: cellBorders,
            verticalAlign: VerticalAlign.CENTER,
            ...options,
        });
        
        const headerTitle = p([boldText("Class Record", { size: 48 })]);
        const headerSubtitle = p([text("(Pursuant to Deped Order 8 series of 2015)", { size: 16, italics: true })]);

        const mainHeaderDetailsTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorder,
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                p([boldText("REGION:", { size: 18 }), text(` ${settings.region}`, { size: 18 })]),
                                p([boldText("SCHOOL NAME:", { size: 18 }), text(` ${settings.schoolName}`, { size: 18 })]),
                            ],
                            borders: noBorder,
                            width: { size: 65, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [
                                p([boldText("DIVISION:", { size: 18 }), text(` ${settings.division}`, { size: 18 })]),
                                p([boldText("SCHOOL ID:", { size: 18 }), text(` ${settings.schoolId}`, { size: 18 })]),
                                p([boldText("SCHOOL YEAR:", { size: 18 }), text(` ${settings.schoolYear}`, { size: 18 })]),
                            ],
                            borders: noBorder,
                            width: { size: 35, type: WidthType.PERCENTAGE }
                        }),
                    ]
                })
            ]
        });
    
        const getPageHeader = () => {
            const quarterText = ["FIRST QUARTER", "SECOND QUARTER", "THIRD QUARTER", "FOURTH QUARTER"][quarter - 1];
            const topHeaderTable = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: [20, 25, 30, 25],
                borders: noBorder,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ borders: noBorder, children: [p([boldText(quarterText, { size: 22 })], { alignment: AlignmentType.LEFT })] }),
                            new TableCell({ borders: noBorder, children: [p([boldText(`GRADE & SECTION: ${selectedSectionText}`, { size: 22 })], { alignment: AlignmentType.LEFT })] }),
                            new TableCell({ borders: noBorder, children: [p([boldText(`TEACHER: ${settings.teacherName}`, { size: 22 })], { alignment: AlignmentType.LEFT })] }),
                            new TableCell({ borders: noBorder, children: [p([boldText(`SUBJECT: ${subject.toUpperCase()}`, { size: 22 })], { alignment: AlignmentType.LEFT })] }),
                        ]
                    })
                ]
            });
            return topHeaderTable;
        }

        const createMainHeaders = () => {
            const headerRow1 = new TableRow({
                children: [
                    createCell([p([boldText("LEARNERS' NAMES", { size: 20 })])], { rowSpan: 2, columnSpan: 2 }),
                    createCell([p([boldText(`WRITTEN WORKS (${recordSettings.wwPercentage * 100}%)`, { size: 18 })])], { columnSpan: 13 }),
                    createCell([p([boldText(`PERFORMANCE TASKS (${recordSettings.ptPercentage * 100}%)`, { size: 18 })])], { columnSpan: 13 }),
                    createCell([p([boldText(`QUARTERLY ASSESSMENT (${recordSettings.qaPercentage * 100}%)`, { size: 18 })])], { columnSpan: 3 }),
                    createCell([p([boldText("Initial Grade", { size: 20 })])], { rowSpan: 2 }),
                    createCell([p([boldText("Quarterly Grade", { size: 20 })])], { rowSpan: 2 }),
                ],
                tableHeader: true,
            });

            const headerRow2Children: TableCell[] = [];
            for (let i = 1; i <= 10; i++) headerRow2Children.push(createCell([p([text(String(i), { size: 16 })])]));
            headerRow2Children.push(createCell([p([boldText("Total", { size: 16 })])])); headerRow2Children.push(createCell([p([boldText("PS", { size: 16 })])])); headerRow2Children.push(createCell([p([boldText("WS", { size: 16 })])]));
            for (let i = 1; i <= 10; i++) headerRow2Children.push(createCell([p([text(String(i), { size: 16 })])]));
            headerRow2Children.push(createCell([p([boldText("Total", { size: 16 })])])); headerRow2Children.push(createCell([p([boldText("PS", { size: 16 })])])); headerRow2Children.push(createCell([p([boldText("WS", { size: 16 })])]));
            headerRow2Children.push(createCell([p([text("1", { size: 16 })])])); headerRow2Children.push(createCell([p([boldText("PS", { size: 16 })])])); headerRow2Children.push(createCell([p([boldText("WS", { size: 16 })])]));
            const headerRow2 = new TableRow({ children: headerRow2Children, tableHeader: true });

            const hpsRowChildren: TableCell[] = [
                createCell([p([])]), 
                createCell([p([boldText("HIGHEST POSSIBLE SCORE", { size: 16 })])])
            ];
            const wwMaxTotal = recordSettings.writtenWorksMax.reduce((a, b) => a + (b || 0), 0);
            const ptMaxTotal = recordSettings.performanceTasksMax.reduce((a, b) => a + (b || 0), 0);
            recordSettings.writtenWorksMax.forEach(s => hpsRowChildren.push(createCell([p([boldText(s?.toString() ?? '', { size: 16 })])])));
            hpsRowChildren.push(createCell([p([boldText(wwMaxTotal.toString(), { size: 16 })])])); hpsRowChildren.push(createCell([p([boldText("100.00", { size: 16 })])])); hpsRowChildren.push(createCell([p([boldText((recordSettings.wwPercentage * 100).toFixed(2), { size: 16 })])]));
            recordSettings.performanceTasksMax.forEach(s => hpsRowChildren.push(createCell([p([boldText(s?.toString() ?? '', { size: 16 })])])));
            hpsRowChildren.push(createCell([p([boldText(ptMaxTotal.toString(), { size: 16 })])])); hpsRowChildren.push(createCell([p([boldText("100.00", { size: 16 })])])); hpsRowChildren.push(createCell([p([boldText((recordSettings.ptPercentage * 100).toFixed(2), { size: 16 })])]));
            hpsRowChildren.push(createCell([p([boldText(recordSettings.quarterlyAssessmentMax?.toString() ?? '', { size: 16 })])])); hpsRowChildren.push(createCell([p([boldText("100.00", { size: 16 })])])); hpsRowChildren.push(createCell([p([boldText((recordSettings.qaPercentage * 100).toFixed(2), { size: 16 })])]));
            hpsRowChildren.push(createCell([p([boldText("100.00", { size: 16 })])])); hpsRowChildren.push(createCell([p([boldText("100", { size: 16 })])]));
            const hpsRow = new TableRow({ children: hpsRowChildren, tableHeader: true });

            return [headerRow1, headerRow2, hpsRow];
        };

        const createStudentTable = (studentList: Student[], gender: 'MALE' | 'FEMALE', startIndex: number) => {
            const studentRows = studentList.map((student, index) => {
                const record = studentRecords.find(r => r.studentId === student.id);
                const calcs = calculationResults.get(student.id) || {};
                const children: TableCell[] = [ createCell([p([text((startIndex + index + 1).toString())])]), createCell([p([text(`${student.lastName}, ${student.firstName} ${student.middleName?.[0] || ''}.`)], { alignment: AlignmentType.LEFT })]) ];
                for (let i = 0; i < 10; i++) children.push(createCell([p([text(record?.writtenWorks[i]?.toString() ?? '')])]));
                children.push(createCell([p([text(calcs.wwTotal?.toString() ?? '')])])); children.push(createCell([p([text(calcs.wwPs?.toFixed(2) ?? '')])])); children.push(createCell([p([boldText(calcs.wwWs?.toFixed(2) ?? '')])]));
                for (let i = 0; i < 10; i++) children.push(createCell([p([text(record?.performanceTasks[i]?.toString() ?? '')])]));
                children.push(createCell([p([text(calcs.ptTotal?.toString() ?? '')])])); children.push(createCell([p([text(calcs.ptPs?.toFixed(2) ?? '')])])); children.push(createCell([p([boldText(calcs.ptWs?.toFixed(2) ?? '')])]));
                children.push(createCell([p([text(record?.quarterlyAssessment?.toString() ?? '')])])); children.push(createCell([p([text(calcs.qaPs?.toFixed(2) ?? '')])])); children.push(createCell([p([boldText(calcs.qaWs?.toFixed(2) ?? '')])]));
                children.push(createCell([p([boldText(calcs.initialGrade?.toFixed(2) ?? '')])])); children.push(createCell([p([boldText(calcs.quarterlyGrade?.toString() ?? '', { size: 20 })])]));
                return new TableRow({ children });
            });

            const genderHeaderRow = new TableRow({ children: [createCell([p([boldText(gender)])], { columnSpan: 33, shading: { type: ShadingType.CLEAR, fill: gender === 'MALE' ? "DDEBF7" : "FCE4D6" } })] });

            return new Table({
                rows: [...createMainHeaders(), genderHeaderRow, ...studentRows],
                width: { size: 100, type: WidthType.PERCENTAGE },
                 columnWidths: [ 400, 3200, ...Array(10).fill(550), 700, 700, 700, ...Array(10).fill(550), 700, 700, 700, 700, 700, 700, 1000, 1000 ],
            });
        };

        const footerElements = () => {
            const summaryTable = new Table({
                width: { size: 40, type: WidthType.PERCENTAGE },
                columnWidths: [40, 20, 20, 20],
                borders: noBorder,
                rows: [
                    new TableRow({ children: [ createCell([p([boldText("SUMMARY")])], { columnSpan: 4, borders: { ...noBorder, bottom: thinBorder } }) ] }),
                    new TableRow({ children: [ createCell([], { borders: noBorder }), createCell([p([boldText("Passed")])], { borders: noBorder }), createCell([p([boldText("Failed")])], { borders: noBorder }), createCell([p([boldText("Total")])], { borders: noBorder }) ] }),
                    new TableRow({ children: [ createCell([p([boldText("MALE")])], { borders: noBorder }), createCell([p([text(String(summary.malesPassed))])]), createCell([p([text(String(summary.malesFailed))])]), createCell([p([text(String(summary.malesPassed + summary.malesFailed))])]) ] }),
                    new TableRow({ children: [ createCell([p([boldText("FEMALE")])], { borders: noBorder }), createCell([p([text(String(summary.femalesPassed))])]), createCell([p([text(String(summary.femalesFailed))])]), createCell([p([text(String(summary.femalesPassed + summary.femalesFailed))])]) ] }),
                    new TableRow({ children: [ createCell([p([boldText("TOTAL")])], { borders: noBorder }), createCell([p([text(String(summary.passed))])]), createCell([p([text(String(summary.failed))])]), createCell([p([text(String(summary.passed + summary.failed))])]) ] }),
                ]
            });

            const signatureTable = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: [45, 10, 45],
                borders: noBorder,
                rows: [
                    new TableRow({
                        children: [
                            createCell([ p([text("Submitted by:")]), p([]), p([]), p([boldText(settings.teacherName.toUpperCase())], { alignment: AlignmentType.CENTER }), p([text("Teacher")], { alignment: AlignmentType.CENTER, border: { top: thinBorder } }) ], { borders: noBorder }),
                            createCell([], { borders: noBorder }),
                            createCell([ p([text("Checked by:")]), p([]), p([]), p([boldText(settings.checkedBy.toUpperCase())], { alignment: AlignmentType.CENTER }), p([text(settings.checkerDesignation)], { alignment: AlignmentType.CENTER, border: { top: thinBorder } }) ], { borders: noBorder }),
                        ]
                    })
                ]
            });
            return [ new Paragraph(""), summaryTable, new Paragraph(""), new Paragraph(""), signatureTable];
        };

        const docChildren: (Paragraph | Table)[] = [headerTitle, headerSubtitle, new Paragraph(""), mainHeaderDetailsTable, new Paragraph("")];
        const hasMales = allStudents.males.length > 0;
        const hasFemales = allStudents.females.length > 0;
        
        if (hasMales) {
            docChildren.push(getPageHeader());
            docChildren.push(new Paragraph(""));
            docChildren.push(createStudentTable(allStudents.males, 'MALE', 0));
        }

        if (hasFemales) {
            if (hasMales) {
                docChildren.push(new Paragraph({ children: [new PageBreak()] }));
            }
            docChildren.push(getPageHeader());
            docChildren.push(new Paragraph(""));
            docChildren.push(createStudentTable(allStudents.females, 'FEMALE', allStudents.males.length));
        }

        if(hasMales || hasFemales) {
            docChildren.push(...footerElements());
        } else {
            docChildren.push(getPageHeader());
        }

        const doc = new Document({
            sections: [{
                properties: { page: { size: { width: 18720, height: 12240 }, margin: { top: 360, right: 360, bottom: 360, left: 360 } } },
                children: docChildren,
            }]
        });
        
        const blob = await Packer.toBlob(doc);
        this.downloadBlob(blob, `E-Class_Record_${subject.replace(/\s/g, '_')}_Q${quarter}_${selectedSectionText.replace(/\s/g, '_')}.docx`);
    }
    
    public async generateMapehRecordDocx(data: MapehRecordDocxData): Promise<void> {
        const { summaryData, settings, quarter, selectedSectionText } = data;
        const rows = [
            new TableRow({
                tableHeader: true,
                children: ["Student Name", "Music", "Arts", "PE", "Health", "Final MAPEH Grade"].map(text => new TableCell({ children: [new Paragraph(text)]}))
            })
        ];

        summaryData.forEach(item => {
            rows.push(new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph(`${item.student.lastName}, ${item.student.firstName}`)] }),
                    new TableCell({ children: [new Paragraph(item.componentGrades["Music"]?.toString() ?? '')] }),
                    new TableCell({ children: [new Paragraph(item.componentGrades["Arts"]?.toString() ?? '')] }),
                    new TableCell({ children: [new Paragraph(item.componentGrades["PE"]?.toString() ?? '')] }),
                    new TableCell({ children: [new Paragraph(item.componentGrades["Health"]?.toString() ?? '')] }),
                    new TableCell({ children: [new Paragraph(item.finalMapehGrade?.toString() ?? '')] }),
                ]
            }));
        });

        const doc = new Document({
            sections: [{
                properties: { page: { size: { width: 18720, height: 12240 } } },
                children: [
                    new Paragraph({ text: `MAPEH Summary - Quarter ${quarter}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                    new Paragraph({ text: `Class: ${selectedSectionText}`, alignment: AlignmentType.CENTER }),
                    new Paragraph(""),
                    new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }})
                ]
            }]
        });
        const blob = await Packer.toBlob(doc);
        this.downloadBlob(blob, `MAPEH_Record_Q${quarter}.docx`);
    }
    
    public async generateHonorsListDocx(data: HonorsListDocxData): Promise<void> {
        const { honorStudents, settings, selectedSectionText } = data;
        const children: (Paragraph | Table)[] = [
            new Paragraph({ text: "List of Honors", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: selectedSectionText, heading: HeadingLevel.HEADING_3, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: `School Year ${settings.schoolYear}`, alignment: AlignmentType.CENTER }),
            new Paragraph(""),
        ];

        const createHonorSection = (title: string, students: any[]) => {
            if (students.length === 0) return;
            children.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_2 }));
            const rows = [
                new TableRow({
                    tableHeader: true,
                    children: [
                        new TableCell({ children: [new Paragraph({ text: "Rank", alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: "Name", alignment: AlignmentType.CENTER })], width: { size: 60, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: "General Average", alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                    ],
                }),
                ...students.map((s, i) => new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: (i + 1).toString(), alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph(`${s.student.lastName}, ${s.student.firstName}`)] }),
                        new TableCell({ children: [new Paragraph({ text: s.generalAvg.toFixed(2), alignment: AlignmentType.CENTER })] }),
                    ]
                }))
            ];
            children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
            children.push(new Paragraph(""));
        };
        
        createHonorSection("WITH HIGHEST HONORS (98-100)", honorStudents.highest);
        createHonorSection("WITH HIGH HONORS (95-97)", honorStudents.high);
        createHonorSection("WITH HONORS (90-94)", honorStudents.regular);

        const doc = new Document({ sections: [{ children }] });
        const blob = await Packer.toBlob(doc);
        this.downloadBlob(blob, `Honors_List_${selectedSectionText.replace(/\s/g, '_')}.docx`);
    }
    
    public async generatePickedStudentsDocx(data: PickedStudentsDocxData): Promise<void> {
        const { pickedStudents, topic, settings, sectionText } = data;
        const children: Paragraph[] = [
            new Paragraph({ text: topic, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: sectionText, heading: HeadingLevel.HEADING_3, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: `Teacher: ${settings.teacherName}`, alignment: AlignmentType.CENTER }),
            new Paragraph(""),
        ];

        pickedStudents.forEach((student, index) => {
            children.push(new Paragraph({
                text: `${index + 1}. ${student.lastName}, ${student.firstName}`,
                numbering: { reference: "picked-list", level: 0 }
            }));
        });

        const doc = new Document({
            numbering: {
                config: [{
                    reference: "picked-list",
                    levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1." }]
                }]
            },
            sections: [{ children }],
        });

        const blob = await Packer.toBlob(doc);
        this.downloadBlob(blob, `${topic.replace(/\s/g, '_') || 'Picked_Students'}.docx`);
    }

     public async generateGroupsDocx(data: GroupsDocxData): Promise<void> {
        const { groups, topic, settings, sectionText } = data;
        const children: Paragraph[] = [
            new Paragraph({ text: `Groupings for: ${topic || 'Unspecified Activity'}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: sectionText, heading: HeadingLevel.HEADING_3, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: `Teacher: ${settings.teacherName}`, alignment: AlignmentType.CENTER }),
            new Paragraph(""),
        ];

        groups.forEach((group, index) => {
            children.push(new Paragraph({ text: `Group ${index + 1}`, heading: HeadingLevel.HEADING_2 }));
            group.forEach(student => {
                children.push(new Paragraph({
                    text: `${student.lastName}, ${student.firstName}`,
                    bullet: { level: 0 },
                }));
            });
            children.push(new Paragraph(""));
        });

        const doc = new Document({
            sections: [{ children }],
        });

        const blob = await Packer.toBlob(doc);
        this.downloadBlob(blob, `Groups_${topic.replace(/\s/g, '_') || 'Export'}.docx`);
    }

    public async generateQuizDocx(quiz: GeneratedQuiz): Promise<void> {
        const docChildren: (Paragraph | Table)[] = [
            new Paragraph({ text: quiz.quizTitle, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph(""),
        ];
    
        if (quiz.tableOfSpecifications && quiz.tableOfSpecifications.length > 0) {
            docChildren.push(new Paragraph({ text: "Table of Specifications", heading: HeadingLevel.HEADING_2 }));
            const tosHeader = new TableRow({
                tableHeader: true,
                children: [
                    new TableCell({ children: [new Paragraph("Learning Objective")] }),
                    new TableCell({ children: [new Paragraph("Cognitive Level")] }),
                    new TableCell({ children: [new Paragraph("Item Numbers")] }),
                ],
            });
            const tosRows = quiz.tableOfSpecifications.map(item => new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph(item.objective)] }),
                    new TableCell({ children: [new Paragraph(item.cognitiveLevel)] }),
                    new TableCell({ children: [new Paragraph(item.itemNumbers)] }),
                ]
            }));
            const tosTable = new Table({
                rows: [tosHeader, ...tosRows],
                width: { size: 100, type: WidthType.PERCENTAGE },
            });
            docChildren.push(tosTable);
            docChildren.push(new Paragraph(""));
        }
    
        const numberingConfig = {
            config: [
                {
                    reference: "quiz-num",
                    levels: [
                        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
                        { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
                    ],
                },
            ],
        };
    
        const allQuestions: GeneratedQuizQuestion[] = [];
    
        Object.entries(quiz.questionsByType).forEach(([type, quizPart]) => {
            if (quizPart) {
                docChildren.push(new Paragraph({ text: type, heading: HeadingLevel.HEADING_2 }));
                if (quizPart.instructions) {
                    docChildren.push(new Paragraph({ children: [new TextRun({ text: quizPart.instructions, italics: true })] }));
                }
                quizPart.questions.forEach(q => {
                    docChildren.push(new Paragraph({ text: q.questionText, numbering: { reference: "quiz-num", level: 0 } }));
                    allQuestions.push(q);
                    if (q.options) {
                        q.options.forEach(opt => {
                            docChildren.push(new Paragraph({ text: opt, numbering: { reference: "quiz-num", level: 1 } }));
                        });
                    }
                    docChildren.push(new Paragraph(""));
                });
            }
        });

        if (quiz.activities && quiz.activities.length > 0) {
            docChildren.push(new Paragraph({ text: "Activities", heading: HeadingLevel.HEADING_2 }));
            quiz.activities.forEach(activity => {
                docChildren.push(new Paragraph({ text: activity.activityName, heading: HeadingLevel.HEADING_3 }));
                docChildren.push(new Paragraph({ children: [new TextRun({ text: activity.activityInstructions, italics: true })] }));
                if (activity.rubric && activity.rubric.length > 0) {
                    const rubricHeader = new TableRow({
                        tableHeader: true,
                        children: [
                            new TableCell({ children: [new Paragraph("Criteria")] }),
                            new TableCell({ children: [new Paragraph("Points")] }),
                        ]
                    });
                    const rubricRows = activity.rubric.map(item => new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(item.criteria)] }),
                            new TableCell({ children: [new Paragraph(String(item.points))] }),
                        ]
                    }));
                    docChildren.push(new Table({ rows: [rubricHeader, ...rubricRows], width: { size: 100, type: WidthType.PERCENTAGE } }));
                }
                docChildren.push(new Paragraph(""));
            });
        }
    
        docChildren.push(new Paragraph({ children: [new PageBreak()] }));
        docChildren.push(new Paragraph({ text: "Answer Key", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }));
        allQuestions.forEach((q, index) => {
            docChildren.push(new Paragraph({ text: `${index + 1}. ${q.correctAnswer}` }));
        });
    
        const doc = new Document({
            numbering: numberingConfig,
            sections: [{ children: docChildren }],
        });
    
        const blob = await Packer.toBlob(doc);
        this.downloadBlob(blob, `${quiz.quizTitle.replace(/\s/g, '_')}.docx`);
    }

    public async generateDlpDocx(dlpForm: any, dlpContent: DlpContent, remarks: string, settings: SchoolSettings): Promise<void> {
        const isFilipino = dlpForm.language === 'Filipino';

        const t = {
            objectives: isFilipino ? 'I. LAYUNIN' : 'I. OBJECTIVES',
            content: isFilipino ? 'II. NILALAMAN' : 'II. CONTENT',
            learningResources: isFilipino ? 'III. KAGAMITANG PANTURO' : 'III. LEARNING RESOURCES',
            procedure: isFilipino ? 'IV. PAMAMARAAN' : 'IV. PROCEDURE',
            remarks: isFilipino ? 'V. MGA TALA' : 'V. REMARKS',
            reflection: isFilipino ? 'VI. PAGNINILAY' : 'VI. REFLECTION',
            contentStandard: isFilipino ? 'Pamantayang Pangnilalaman:' : 'Content Standard:',
            performanceStandard: isFilipino ? 'Pamantayan sa Pagganap:' : 'Performance Standard:',
            learningCompetency: isFilipino ? 'Kasanayan sa Pagkatuto:' : 'Learning Competency:',
            atTheEnd: isFilipino ? 'Sa pagtatapos ng aralin, ang mga mag-aaral ay inaasahang:' : 'At the end of the lesson, the learners should be able to:',
            topic: isFilipino ? 'Paksa:' : 'Topic:',
            references: isFilipino ? 'Sanggunian:' : 'References:',
            materials: isFilipino ? 'Kagamitan:' : 'Materials:',
            dailyLessonPlanIn: isFilipino ? 'DETALYADONG BANGHAY-ARALIN SA' : 'DAILY LESSON PLAN IN',
            school: isFilipino ? 'Paaralan:' : 'School:',
            teacher: isFilipino ? 'Guro:' : 'Teacher:',
            learningArea: isFilipino ? 'Asignatura:' : 'Learning Area:',
            teachingDates: isFilipino ? 'Petsa ng Pagtuturo:' : 'Teaching Dates:',
            classSchedule: isFilipino ? 'ISKEDYUL NG KLASE' : 'CLASS SCHEDULE',
            preparedBy: isFilipino ? 'Inihanda ni:' : 'Prepared By:',
            checkedBy: isFilipino ? 'Sinuri ni:' : 'Checked By:',
            approvedBy: isFilipino ? 'Inaprubahan ni:' : 'Approved By:',
            answerKey: isFilipino ? 'Susi sa Pagwawasto (Para sa Pagtataya ng Pagkatuto)' : 'Answer Key (For Evaluating Learning)',
        };

        const font = "Times New Roman";
        const text = (txt: string, options: Omit<IRunOptions, 'children'> = {}) => new TextRun({ text: txt, font, size: 22, ...options });
        const boldText = (txt: string, options: Omit<IRunOptions, 'children'> = {}) => text(txt, { bold: true, ...options });
        const p = (children: (TextRun | ImageRun)[], options: IParagraphOptions = {}) => new Paragraph({ children, ...options });
        const checkBox = (checked = false) => new TextRun({ text: checked ? "☒" : "☐", font: "Wingdings" });
        
        const thinBorder = { style: BorderStyle.SINGLE, size: 2, color: "000000" };
        const createCell = (children: (Paragraph|Table)[], options: any = {}) => new TableCell({ children, borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }, verticalAlign: VerticalAlign.TOP, ...options });
        
        const scheduleParagraphs = dlpForm.classSchedule.split('\n').map((line: string) => p([text(line, { size: 18 })]));
        const logo = this.createDocxImage(this.parseDataUrl(settings.schoolLogo), 60, 60);

        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [ new TableCell({ children: logo ? [p([logo])] : [], rowSpan: 5, verticalAlign: VerticalAlign.CENTER }), createCell([p([boldText(t.school), text(` ${dlpForm.schoolName.toUpperCase()}`)])]), createCell([p([boldText(t.dailyLessonPlanIn, {size: 20})]), p([boldText(`${dlpForm.subject.toUpperCase()} ${dlpForm.gradeLevel}`, {size: 20})])], { rowSpan: 2, verticalAlign: VerticalAlign.CENTER }) ] }),
                new TableRow({ children: [createCell([p([boldText(dlpForm.quarterSelect)])])] }),
                new TableRow({ children: [createCell([p([boldText(t.teacher), text(` ${dlpForm.teacher}`)])]), createCell([p([boldText(t.classSchedule)]), ...scheduleParagraphs], { rowSpan: 3 })] }),
                new TableRow({ children: [createCell([p([boldText(t.learningArea), text(` ${dlpForm.subject.toUpperCase()}`)])])] }),
                new TableRow({ children: [createCell([p([boldText(t.teachingDates), text(` ${dlpForm.teachingDates}`)])])] }),
            ]
        });

        let gradeLevelColor = "DDEBF7"; // Default
        switch (dlpForm.gradeLevel) {
            case '7': gradeLevelColor = "C6E0B4"; break; case '8': gradeLevelColor = "FFE699"; break; case '9': gradeLevelColor = "FFC7CE"; break; case '10': case '11': case '12': gradeLevelColor = "BDD7EE"; break;
        }
        const headerShading = { shading: { type: ShadingType.CLEAR, fill: gradeLevelColor } };

        const procedureRows = dlpContent.procedures.map(proc => {
            const contentParagraphs = proc.content.split('\n').map(line => p([text(line)]));
            return new TableRow({
                children: [
                    createCell([p([boldText(proc.title)])]),
                    createCell(contentParagraphs),
                    createCell([p([text(proc.ppst, { italics: true, color: "38B2AC" })])]),
                ]
            });
        });

        const procedureTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [2500, 4500, 2500],
            rows: [
                new TableRow({
                    tableHeader: true,
                    children: [
                        createCell([p([boldText(isFilipino ? 'Pamamaraan' : 'Procedure')])]),
                        createCell([p([boldText(isFilipino ? 'Gawain ng Guro/Mag-aaral' : 'Teacher/Student Activity')])]),
                        createCell([p([boldText(isFilipino ? 'Mga Kaugnay na PPST Indicator' : 'Aligned PPST Indicators')])]),
                    ]
                }),
                ...procedureRows,
            ]
        });

        const mainContent = [
            p([boldText(t.objectives, { size: 24 })], headerShading),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [30, 70], rows: [
                new TableRow({ children: [createCell([p([boldText(t.contentStandard)])]), createCell([p([text(dlpContent.contentStandard)])])] }),
                new TableRow({ children: [createCell([p([boldText(t.performanceStandard)])]), createCell([p([text(dlpContent.performanceStandard)])])] }),
                new TableRow({ children: [createCell([p([boldText(t.learningCompetency)])]), createCell([p([text(dlpForm.learningCompetency)])])] }),
                new TableRow({ children: [createCell([p([text(t.atTheEnd)])], { columnSpan: 2 })] }),
                new TableRow({ children: [createCell([p([text(dlpForm.lessonObjective)], { bullet: { level: 0 }})], { columnSpan: 2 })] }),
            ]}),
            p([boldText(t.content, { size: 24 })], headerShading),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [30, 70], rows: [ new TableRow({ children: [createCell([p([boldText(t.topic)])]), createCell([p([text(dlpContent.topic)])])] }) ] }),
            p([boldText(t.learningResources, { size: 24 })], headerShading),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [30, 70], rows: [
                new TableRow({ children: [createCell([p([boldText(t.references)])]), createCell([p([text(dlpContent.learningReferences)])])] }),
                new TableRow({ children: [createCell([p([boldText(t.materials)])]), createCell([p([text(dlpContent.learningMaterials)])])] }),
            ]}),
            p([boldText(t.procedure, { size: 24 })], headerShading),
            procedureTable,
        ];

        const remarksSection = [
            p([boldText(t.remarks, { size: 24 })], headerShading),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [ new TableRow({ children: [ createCell([p([text(dlpContent.remarksContent || '')]), p([])]) ], }), ], })
        ];

        const sectionsForReflection = (dlpForm.classSchedule || '').split('\n').map((line: string) => { const parts = line.match(/([Gg]?\d+\s*-\s*[\w\s]+|[\w\s]+)/); return parts ? parts[0].trim().replace(/,/g, '') : line.trim(); }).filter(Boolean);
        const reflectionRows = [
            new TableRow({ children: [ createCell([p([boldText(isFilipino ? 'A. Bilang ng mag-aaral na nakakuha ng 80% sa pagtataya' : 'A. No. of learners who earned 80% in the evaluation')])]), createCell(sectionsForReflection.length > 0 ? sectionsForReflection.map(sec => p([text(`___ out of ___ learners earned 80% and above - ${sec}`)])) : [p([text('___ out of ___ learners earned 80% and above')])]) ] }),
            new TableRow({ children: [ createCell([p([boldText(isFilipino ? 'B. Bilang ng mag-aaral na nangangailangan ng remediation na nakakuha ng mababa sa 80%' : 'B. No. of learners who require additional activities for remediation who score below 80%')])]), createCell(sectionsForReflection.length > 0 ? sectionsForReflection.map(sec => p([text(`___ out of ___ learners require additional activities - ${sec}`)])) : [p([text('___ out of ___ learners require additional activities')])]) ] }),
            new TableRow({ children: [ createCell([p([boldText(isFilipino ? 'C. Nakatulong ba ang remedial? Bilang ng mag-aaral na nakaunawa sa aralin.' : 'C. Did the remedial lessons work? No. of learners who have caught up with the lessons.')])]), createCell([ p([checkBox(), text(isFilipino ? ' Oo' : ' YES'), text('  '), checkBox(), text(isFilipino ? ' Hindi' : ' NO')]), p([checkBox(), text(isFilipino ? ' ___ na mag-aaral ang nakaunawa sa aralin' : ' ___ learners caught up with the lesson')]) ]) ] }),
            new TableRow({ children: [ createCell([p([boldText(isFilipino ? 'D. Bilang ng mga mag-aaral na magpapatuloy sa remediation.' : 'D. No. of learners who continue to require remediation')])]), createCell([ p([checkBox(), text(isFilipino ? ' ___ na mag-aaral ang magpapatuloy sa remediation' : ' ___ learners continue to require remediation')]) ]) ] }),
            new TableRow({ children: [ createCell([p([boldText(isFilipino ? 'E. Alin sa mga istratehiyang pagtuturo nakatulong ng lubos? Paano ito nakatulong?' : 'E. Which of my teaching strategies work well? Why did this work?')])]), createCell([ p([checkBox(), text(' experiment')]), p([checkBox(), text(' collaborative learning')]), p([checkBox(), text(' differentiated instruction')]), p([checkBox(), text(' lecture')]), p([checkBox(), text(' think-pair-share')]), p([checkBox(), text(' role play')]), p([checkBox(), text(' discovery')]), p([checkBox(), text(' board work')]), p([text(isFilipino ? 'Bakit? ____________________' : 'Why? ____________________')]) ]) ] }),
            new TableRow({ children: [ createCell([p([boldText(isFilipino ? 'F. Anong suliranin ang aking naranasan na solusyunan sa tulong ang aking punungguro at superbisor?' : 'F. What difficulties did I encounter which my principal or supervisor can help me solve?')])]), createCell([ p([checkBox(), text(' bullying among students')]), p([checkBox(), text(" student's behavior/attitude")]), p([checkBox(), text(' unavailable technology/equipment (AVR/LCD)')]), p([checkBox(), text(' internet lab')]), p([text(isFilipino ? 'Bakit? ____________________' : 'Why? ____________________')]) ]) ] }),
            new TableRow({ children: [ createCell([p([boldText(isFilipino ? 'G. Anong kagamitang panturo ang aking nadibuho na nais kong ibahagi sa mga kapwa ko guro.' : 'G. What innovation or localized materials did I use / discover which I wish to share with other teachers.')])]), createCell([ p([checkBox(), text(' localized videos')]), p([checkBox(), text(' colorful worksheets')]), p([checkBox(), text(' local jingle composition')]), p([text(isFilipino ? 'Bakit? ____________________' : 'Why? ____________________')]) ]) ] }),
        ];
        const reflectionTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [40, 60], rows: reflectionRows });
        const reflectionSection = [ p([boldText(t.reflection, { size: 24 })], headerShading), reflectionTable ];

        const signatureTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, columnWidths: [33, 34, 33],
            rows: [
                new TableRow({ children: [ new TableCell({ children: [p([text(t.preparedBy)])], borders: { top: { style: BorderStyle.NONE } } }), new TableCell({ children: [p([text(t.checkedBy)])], borders: { top: { style: BorderStyle.NONE } } }), new TableCell({ children: [p([text(t.approvedBy)])], borders: { top: { style: BorderStyle.NONE } } }) ] }),
                new TableRow({ children: [ new TableCell({ children: [p([])], borders: { bottom: { style: BorderStyle.NONE } } }), new TableCell({ children: [p([])], borders: { bottom: { style: BorderStyle.NONE } } }), new TableCell({ children: [p([])], borders: { bottom: { style: BorderStyle.NONE } } }) ] }),
                new TableRow({ children: [ new TableCell({ children: [p([])], borders: { bottom: { style: BorderStyle.NONE } } }), new TableCell({ children: [p([])], borders: { bottom: { style: BorderStyle.NONE } } }), new TableCell({ children: [p([])], borders: { bottom: { style: BorderStyle.NONE } } }) ] }),
                new TableRow({ children: [ new TableCell({ children: [p([boldText(dlpForm.preparedByName)], { alignment: AlignmentType.CENTER })], borders: { top: thinBorder } }), new TableCell({ children: [p([boldText(dlpForm.checkedByName)], { alignment: AlignmentType.CENTER })], borders: { top: thinBorder } }), new TableCell({ children: [p([boldText(dlpForm.approvedByName)], { alignment: AlignmentType.CENTER })], borders: { top: thinBorder } }) ] }),
                new TableRow({ children: [ new TableCell({ children: [p([text(dlpForm.preparedByDesignation)], { alignment: AlignmentType.CENTER })] }), new TableCell({ children: [p([text(dlpForm.checkedByDesignation)], { alignment: AlignmentType.CENTER })] }), new TableCell({ children: [p([text(dlpForm.approvedByDesignation)], { alignment: AlignmentType.CENTER })] }) ] }),
            ]
        });

        const answerKeySection = [ new Paragraph({ children: [new PageBreak()] }), p([boldText(t.answerKey, { size: 24 })], { alignment: AlignmentType.CENTER }), p([]), ...(dlpContent.evaluationQuestions || []).map((q, i) => p([text(`${i + 1}. ${q.answer}`)], { numbering: { reference: "answer-key-num", level: 0 } })) ];
        const numbering = { config: [ { reference: "answer-key-num", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { paragraph: { indent: { left: 720, hanging: 360 } } }, }], }, ], };
        
        const doc = new Document({
            numbering,
            sections: [{ 
                properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
                children: [ headerTable, ...mainContent, ...remarksSection, ...reflectionSection, p([]), p([]), signatureTable, ...answerKeySection ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        this.downloadBlob(blob, `DLP_${dlpContent.topic.replace(/\s/g, '_')}.docx`);
    }

     public async generateDllDocx(dllForm: any, dllContent: DllContent, settings: SchoolSettings): Promise<void> {
        const font = "Times New Roman";
        const text = (txt: string, options: Omit<IRunOptions, 'children'> = {}) => new TextRun({ text: txt, font, size: 18, ...options });
        const boldText = (txt: string, options: Omit<IRunOptions, 'children'> = {}) => text(txt, { bold: true, ...options });
        const p = (children: (TextRun | ImageRun)[], options: IParagraphOptions = {}) => new Paragraph({ children, ...options });

        const thinBorder = { style: BorderStyle.SINGLE, size: 2, color: "000000" };
        const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
        
        let gradeLevelColor = "DDEBF7"; // Default
        switch (dllForm.gradeLevel) {
            case '7': gradeLevelColor = "C6E0B4"; break; // Light Green
            case '8': gradeLevelColor = "FFE699"; break; // Light Yellow
            case '9': gradeLevelColor = "FFC7CE"; break; // Light Red
            case '10': case '11': case '12': gradeLevelColor = "BDD7EE"; break; // Light Blue
        }
        const headerShading = { shading: { type: ShadingType.CLEAR, fill: gradeLevelColor } };

        const createCell = (children: (Paragraph | Table)[], options: any = {}) => new TableCell({ children, borders: cellBorders, verticalAlign: VerticalAlign.TOP, ...options });

        const createMultiLineParagraphs = (textBlock: string, options: IParagraphOptions = {}) => {
            return textBlock.split('\n').map(line => p([text(line)], options));
        };

        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [15, 35, 15, 35],
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            rows: [
                new TableRow({ children: [ new TableCell({ children: [p([boldText("TEACHER:")])], borders: {bottom: thinBorder} }), new TableCell({ children: [p([text(dllForm.teacher)])], borders: {bottom: thinBorder} }), new TableCell({ children: [p([boldText("TEACHING DATES & TIME:")])], borders: {bottom: thinBorder} }), new TableCell({ children: [p([text(dllForm.teachingDates)])], borders: {bottom: thinBorder} }) ] }),
                new TableRow({ children: [ new TableCell({ children: [p([boldText("SCHOOL:")])], borders: {bottom: thinBorder} }), new TableCell({ children: [p([text(dllForm.schoolName)])], borders: {bottom: thinBorder} }), new TableCell({ children: [p([boldText("QUARTER:")])], borders: {bottom: thinBorder} }), new TableCell({ children: [p([text(dllForm.quarter)])], borders: {bottom: thinBorder} }) ] }),
            ]
        });

        const mainTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [20, 16, 16, 16, 16, 16],
            rows: [
                // Day headers
                new TableRow({
                    children: [ 
                        createCell([p([boldText(`GRADE ${dllForm.gradeLevel} - ${dllForm.subject}`)])], headerShading), 
                        createCell([p([boldText("MONDAY")])], headerShading), 
                        createCell([p([boldText("TUESDAY")])], headerShading), 
                        createCell([p([boldText("WEDNESDAY")])], headerShading), 
                        createCell([p([boldText("THURSDAY")])], headerShading), 
                        createCell([p([boldText("FRIDAY")])], headerShading)
                    ],
                }),
                // I. OBJECTIVES
                new TableRow({ children: [createCell([p([boldText("I. OBJECTIVES", { size: 20 })])], { columnSpan: 6, ...headerShading })] }),
                new TableRow({ children: [createCell([p([boldText("A. Content Standard")])], headerShading), createCell([p([text(dllContent.contentStandard)])], { columnSpan: 5 })] }),
                new TableRow({ children: [createCell([p([boldText("B. Performance Standard")])], headerShading), createCell([p([text(dllContent.performanceStandard)])], { columnSpan: 5 })] }),
                new TableRow({ children: [createCell([p([boldText("C. Learning Competencies/Objectives")])], headerShading), createCell(createMultiLineParagraphs(dllContent.learningCompetencies.monday)), createCell(createMultiLineParagraphs(dllContent.learningCompetencies.tuesday)), createCell(createMultiLineParagraphs(dllContent.learningCompetencies.wednesday)), createCell(createMultiLineParagraphs(dllContent.learningCompetencies.thursday)), createCell(createMultiLineParagraphs(dllContent.learningCompetencies.friday))] }),
                // II. CONTENT
                new TableRow({ children: [createCell([p([boldText("II. CONTENT", { size: 20 })])], { columnSpan: 6, ...headerShading })] }),
                new TableRow({ children: [createCell([p([text(dllContent.content)])], { columnSpan: 6 })] }),
                // III. LEARNING RESOURCES
                new TableRow({ children: [createCell([p([boldText("III. LEARNING RESOURCES", { size: 20 })])], { columnSpan: 6, ...headerShading })] }),
                new TableRow({ children: [createCell([p([boldText("A. References")])], headerShading), createCell([], { columnSpan: 5 })] }),
                ...Object.entries(dllContent.learningResources).map(([key, value]) => {
                    let label = "";
                    if (key === "teacherGuidePages") label = "1. Teacher's Guide Pages";
                    else if (key === "learnerMaterialsPages") label = "2. Learner's Materials Pages";
                    else if (key === "textbookPages") label = "3. Textbook Pages";
                    else if (key === "additionalMaterials") label = "4. Additional Materials";
                    else if (key === "otherResources") label = "B. Other Learning Resources";
                    return new TableRow({ children: [createCell([p([text(label)])], headerShading), createCell([p([text(value.monday)])]), createCell([p([text(value.tuesday)])]), createCell([p([text(value.wednesday)])]), createCell([p([text(value.thursday)])]), createCell([p([text(value.friday)])])] });
                }),
                // IV. PROCEDURES
                new TableRow({ children: [createCell([p([boldText("IV. PROCEDURES", { size: 20 })])], { columnSpan: 6, ...headerShading })] }),
                ...dllContent.procedures.map(proc => new TableRow({ children: [createCell([p([boldText(proc.procedure)])], headerShading), createCell(createMultiLineParagraphs(proc.monday)), createCell(createMultiLineParagraphs(proc.tuesday)), createCell(createMultiLineParagraphs(proc.wednesday)), createCell(createMultiLineParagraphs(proc.thursday)), createCell(createMultiLineParagraphs(proc.friday))] })),
                // V. REMARKS
                new TableRow({ children: [createCell([p([boldText("V. REMARKS", { size: 20 })])], { columnSpan: 6, ...headerShading })] }),
                new TableRow({ children: [createCell([p([text(dllContent.remarks)])], { columnSpan: 6 })] }),
                // VI. REFLECTION
                new TableRow({ children: [createCell([p([boldText("VI. REFLECTION", { size: 20 })])], { columnSpan: 6, ...headerShading })] }),
                ...dllContent.reflection.map(refl => new TableRow({ children: [createCell([p([boldText(refl.procedure)])], headerShading), createCell([p([text(refl.monday)])]), createCell([p([text(refl.tuesday)])]), createCell([p([text(refl.wednesday)])]), createCell([p([text(refl.thursday)])]), createCell([p([text(refl.friday)])])] })),
            ]
        });

        const signatureTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [33, 34, 33],
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            rows: [
                new TableRow({ children: [
                    new TableCell({ children: [p([text("Prepared by:")])], borders: {top: {style: BorderStyle.NONE}} }),
                    new TableCell({ children: [p([text("Checked by:")])], borders: {top: {style: BorderStyle.NONE}} }),
                    new TableCell({ children: [p([text("Noted by:")])], borders: {top: {style: BorderStyle.NONE}} })
                ]}),
                new TableRow({ children: [ new TableCell({ children: [p([])] }), new TableCell({ children: [p([])] }), new TableCell({ children: [p([])] }) ] }),
                new TableRow({ children: [ new TableCell({ children: [p([])] }), new TableCell({ children: [p([])] }), new TableCell({ children: [p([])] }) ] }),
                new TableRow({ children: [
                    new TableCell({ children: [p([boldText(dllForm.preparedByName)], { alignment: AlignmentType.CENTER })], borders: {top: thinBorder} }),
                    new TableCell({ children: [p([boldText(dllForm.checkedByName)], { alignment: AlignmentType.CENTER })], borders: {top: thinBorder} }),
                    new TableCell({ children: [p([boldText(dllForm.approvedByName)], { alignment: AlignmentType.CENTER })], borders: {top: thinBorder} })
                ]}),
                new TableRow({ children: [
                    new TableCell({ children: [p([text(dllForm.preparedByDesignation)], { alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [p([text(dllForm.checkedByDesignation)], { alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [p([text(dllForm.approvedByDesignation)], { alignment: AlignmentType.CENTER })] })
                ]}),
            ]
        });


        const doc = new Document({
            sections: [{
                properties: {
                    page: { size: { width: 18720, height: 12240, }, margin: { top: 720, right: 720, bottom: 720, left: 720 }, },
                },
                children: [ 
                    p([boldText("DAILY LESSON LOG")], { alignment: AlignmentType.CENTER }),
                    headerTable,
                    p([]),
                    mainTable,
                    p([]),
                    signatureTable,
                 ],
            }]
        });

        const blob = await Packer.toBlob(doc);
        this.downloadBlob(blob, `Weekly_Plan_${dllForm.subject}_${dllForm.gradeLevel}.docx`);
    }

    // Fix: Add missing generateLasDocx method
    public async generateLasDocx(details: {
        schoolYear: string;
        schoolName: string;
        teacherName: string;
        subject: string;
        gradeLevel: string;
    }, lasContent: LearningActivitySheet): Promise<void> {
        const font = "Times New Roman";
        const text = (txt: string, options: Omit<IRunOptions, 'children'> = {}) => new TextRun({ text: txt, font, size: 24, ...options }); // 12pt
        const boldText = (txt: string, options: Omit<IRunOptions, 'children'> = {}) => text(txt, { bold: true, ...options });
        const p = (children: (TextRun | ImageRun)[], options: IParagraphOptions = {}) => new Paragraph({ children, ...options });

        const thinBorder = { style: BorderStyle.SINGLE, size: 2, color: "000000" };
        const createCell = (children: (Paragraph|Table)[], options: any = {}) => new TableCell({ children, borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }, verticalAlign: VerticalAlign.CENTER, ...options });

        const docChildren: (Paragraph | Table)[] = [];

        // Header
        docChildren.push(p([boldText(details.schoolName.toUpperCase(), { size: 28 })], { alignment: AlignmentType.CENTER }));
        docChildren.push(p([text(`SY ${details.schoolYear}`)], { alignment: AlignmentType.CENTER }));
        docChildren.push(p([text(`${details.subject} - Grade ${details.gradeLevel}`)], { alignment: AlignmentType.CENTER }));
        docChildren.push(p([text(`Teacher: ${details.teacherName}`)], { alignment: AlignmentType.CENTER }));
        docChildren.push(p([]));

        // Title
        docChildren.push(p([boldText(lasContent.activityTitle, { size: 32, underline: { type: UnderlineType.SINGLE } })], { alignment: AlignmentType.CENTER, spacing: { after: 200 } }));

        // Learning Target
        docChildren.push(p([boldText("Learning Target:")], { spacing: { after: 100 } }));
        docChildren.push(p([text(lasContent.learningTarget)], { indent: { left: 360 }, spacing: { after: 200 } }));
        
        // References
        docChildren.push(p([boldText("References:")], { spacing: { after: 100 } }));
        lasContent.references.split('\n').forEach(line => {
            docChildren.push(p([text(line)], { indent: { left: 360 } }));
        });
        docChildren.push(p([]));

        // Concept Notes
        if (lasContent.conceptNotes && lasContent.conceptNotes.length > 0) {
            lasContent.conceptNotes.forEach(note => {
                docChildren.push(p([boldText(note.title, { underline: { type: UnderlineType.SINGLE } })], { spacing: { after: 100 } }));
                note.content.split('\n').forEach(line => {
                    docChildren.push(p([text(line)], { indent: { left: 360 }, spacing: { after: 50 } }));
                });
                docChildren.push(p([]));
            });
        }
        
        // Activities
        if (lasContent.activities && lasContent.activities.length > 0) {
            docChildren.push(p([boldText("ACTIVITIES", { size: 28 })], { alignment: AlignmentType.CENTER, spacing: { after: 200 } }));

            lasContent.activities.forEach(activity => {
                docChildren.push(p([boldText(activity.title, { size: 26, underline: { type: UnderlineType.SINGLE } })], { spacing: { after: 100 } }));
                docChildren.push(p([text(activity.instructions, { italics: true })], { indent: { left: 360 }, spacing: { after: 200 } }));

                if (activity.questions && activity.questions.length > 0) {
                    activity.questions.forEach(q => {
                        docChildren.push(p([text(q.questionText)], { numbering: { reference: "las-questions", level: 0 } }));
                        if (q.options) {
                            q.options.forEach(opt => {
                                docChildren.push(p([text(opt)], { numbering: { reference: "las-questions", level: 1 } }));
                            });
                        }
                    });
                     docChildren.push(p([]));
                }

                if (activity.rubric && activity.rubric.length > 0) {
                    docChildren.push(p([boldText("Rubric")], { spacing: { before: 200, after: 100 } }));
                    const rubricHeader = new TableRow({
                        children: [
                            createCell([p([boldText("Criteria")])]),
                            createCell([p([boldText("Points")], { alignment: AlignmentType.CENTER })]),
                        ],
                    });
                    const rubricRows = activity.rubric.map(item => new TableRow({
                        children: [
                            createCell([p([text(item.criteria)])]),
                            createCell([p([text(String(item.points))], { alignment: AlignmentType.CENTER })]),
                        ],
                    }));
                    docChildren.push(new Table({
                        rows: [rubricHeader, ...rubricRows],
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        columnWidths: [80, 20],
                    }));
                     docChildren.push(p([]));
                }
            });
        }

        const numberingConfig = {
            config: [
                {
                    reference: "las-questions",
                    levels: [
                        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
                        { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
                    ],
                },
            ],
        };

        const doc = new Document({
            numbering: numberingConfig,
            sections: [{ 
                properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, // 1 inch margins
                children: docChildren
            }]
        });

        const blob = await Packer.toBlob(doc);
        this.downloadBlob(blob, `LAS_${lasContent.activityTitle.replace(/\s/g, '_')}.docx`);
    }
}

export const docxService = new DocxService();
