import { Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Student, Grade, Anecdote, AIAnalysisResult, ExtractedGrade, ExtractedStudentData, DlpContent, GeneratedQuiz, QuizType, DlpRubricItem, DllContent, AttendanceStatus, DlpProcedure } from '../types';
// Fix: Import toast to show error messages to the user.
import { toast } from "react-hot-toast";

// --- UTILITY FUNCTIONS ---

/**
 * A robust JSON parser that handles AI responses which might be wrapped in markdown code blocks.
 * @param jsonString The raw string response from the AI model.
 * @returns The parsed JSON object.
 */
const parseJsonFromAiResponse = <T>(jsonString: string | undefined | null): T => {
    // FIX: Guard against null, undefined, or empty string responses from the AI.
    // This prevents the '.trim()' error and ensures graceful failure.
    if (!jsonString || jsonString.trim() === '') {
        throw new Error("AI returned no text content to parse.");
    }
    // The AI may wrap the JSON in ```json ... ```, so we strip it.
    const sanitizedString = jsonString.trim().replace(/^```json\s*|```\s*$/g, '');
    try {
        return JSON.parse(sanitizedString) as T;
    } catch (error) {
        console.error("Failed to parse sanitized JSON:", sanitizedString);
        throw new Error("AI returned a malformed JSON response.");
    }
};


/**
 * Calls the secure Vercel/serverless function API proxy.
 * @param modelOptions The request body to send to the Gemini API.
 * @returns The full response object from the Gemini API.
 */
const callApiProxy = async (modelOptions: any): Promise<any> => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelOptions),
    });

    if (!response.ok) {
        let errorDetails = `AI API call failed with status ${response.status}.`;
        try {
            // Vercel often sends JSON errors for function issues
            const errorData = await response.json();
            errorDetails = errorData.details || errorData.error || JSON.stringify(errorData);
        } catch (e) {
            // If the response isn't JSON (e.g., a gateway timeout), use the text body.
            const textError = await response.text();
            if (textError) errorDetails = textError;
        }
        console.error('API Proxy Error:', errorDetails);
        throw new Error(errorDetails);
    }
    
    // The proxy returns the entire GenerateContentResponse object from the SDK.
    return response.json();
};

/**
 * Standard safety settings to allow educational content generation.
 */
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * Standard system instructions for complex generation tasks to improve efficiency.
 */
const efficientGenerationSystemInstruction = "You are an expert educational content creator. Be efficient and generate the JSON output directly without any extra conversation or explanation.";


/**
 * Processes and formats errors from the AI service for user-facing display.
 * @param error The error object.
 * @param functionName The name of the service function where the error occurred.
 * @returns A user-friendly Error object.
 */
const handleGeminiError = (error: any, functionName: string): Error => {
    console.error(`Error in ${functionName}:`, error);
    
    let userMessage = "An AI feature failed. Please try again. If the problem persists, check your connection or the server logs.";

    if (error && typeof error.message === 'string') {
        const lowerMessage = error.message.toLowerCase();
        if (lowerMessage.includes('api key not valid') || lowerMessage.includes('api_key_invalid')) {
            userMessage = "AI Error: The API key configured on the server is invalid.";
        } else if (lowerMessage.includes('quota')) {
            userMessage = "AI Error: API quota exceeded. Please check your billing details.";
        } else if (lowerMessage.includes('timeout')) {
            userMessage = "AI Error: The request timed out. The task may be too complex. Please try simplifying it.";
        } else {
            userMessage = `AI Error: ${error.message}`;
        }
    }
    
    return new Error(userMessage);
};

// --- API FUNCTIONS ---

export const checkApiStatus = async (): Promise<{ status: 'success' | 'error'; message: string }> => {
    try {
        await callApiProxy({ model: 'gemini-2.5-flash', contents: 'test' });
        return { status: 'success', message: 'Connection successful. The secure AI proxy is working correctly.' };
    } catch (error) {
        const processedError = handleGeminiError(error, 'checkApiStatus');
        return { status: 'error', message: processedError.message };
    }
};

const performanceAnalysisSchema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { studentName: { type: Type.STRING }, trendSummary: { type: Type.STRING }, recommendation: { type: Type.STRING } }, required: ["studentName", "trendSummary", "recommendation"] } };

export const analyzeStudentPerformance = async (students: Student[], grades: Grade[], anecdotes: Anecdote[]): Promise<AIAnalysisResult[]> => {
  const model = "gemini-2.5-pro";
  const studentData = students.map(student => ({
      name: `${student.firstName} ${student.lastName}`,
      grades: grades.filter(g => g.studentId === student.id).map(g => ({ subject: g.subject, quarter: g.quarter, percentage: ((g.score / g.maxScore) * 100).toFixed(2) })),
      anecdotes: anecdotes.filter(a => a.studentId === student.id).map(a => a.observation)
  }));

  const prompt = `As an expert teacher, analyze the provided data for a class of students. Identify students who are either excelling or at risk based on grade trends and anecdotal records. Focus on significant, consistent trends or notable outliers. For each identified student, provide their full name, a one-sentence trendSummary, and a personalized, actionable recommendation (intervention for at-risk, enrichment for excelling). Do not include students with stable or average performance.

    Here is the class data: ${JSON.stringify(studentData, null, 2)}

    Return the result as a JSON array. If no students show significant trends, return an empty array. Adhere strictly to the provided JSON schema.`;

  try {
    const response = await callApiProxy({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: performanceAnalysisSchema,
        safetySettings,
      },
      systemInstruction: "You are an expert teacher analyzing student data. Be concise and accurate."
    });

    const result = parseJsonFromAiResponse<AIAnalysisResult[] | AIAnalysisResult>(response.text);
    // Failsafe: If the AI returns a single object instead of an array, wrap it.
    if (!Array.isArray(result)) {
        return [result];
    }
    return result;

  } catch (error) {
    throw handleGeminiError(error, 'analyzeStudentPerformance');
  }
};

const gradeExtractionSchema = { type: Type.OBJECT, properties: { grades: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { studentName: { type: Type.STRING }, score: { type: Type.NUMBER }, maxScore: { type: Type.NUMBER } }, required: ["studentName", "score", "maxScore"] } } } };

export const extractGradesFromImage = async (base64Image: string, students: Student[]): Promise<ExtractedGrade[]> => {
    const model = "gemini-2.5-flash";
    const studentList = students.map(s => `${s.firstName} ${s.lastName}`).join(', ');
    const prompt = `Analyze the image of a grade sheet. Extract each student's name, their score, and the maximum possible score. Match names to this list: ${studentList}. Return data as JSON.`;

    try {
        const response = await callApiProxy({
            model,
            contents: { parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: base64Image } }] },
            config: { responseMimeType: "application/json", responseSchema: gradeExtractionSchema, safetySettings },
        });

        const result = parseJsonFromAiResponse<{ grades?: ExtractedGrade[] }>(response.text);
        return result.grades || [];
    } catch (error) {
        throw handleGeminiError(error, 'extractGradesFromImage');
    }
};

const rephraseSchema = { type: Type.OBJECT, properties: { revisedText: { type: Type.STRING } }, required: ["revisedText"] };

export const rephraseAnecdote = async (text: string, mode: 'correct' | 'rephrase'): Promise<string> => {
    const model = "gemini-2.5-flash";
    const prompt = mode === 'correct' 
        ? `Correct grammar and spelling. Text: "${text}"`
        : `Rephrase for a formal, objective student record. Text: "${text}"`;

    try {
        const response = await callApiProxy({
            model, contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: rephraseSchema, safetySettings },
        });
        const result = parseJsonFromAiResponse<{ revisedText: string }>(response.text);
        return result.revisedText;
    } catch (error) {
        throw handleGeminiError(error, 'rephraseAnecdote');
    }
};

const reportCardCommentSchema = { type: Type.OBJECT, properties: { strengths: { type: Type.STRING }, areasForImprovement: { type: Type.STRING }, closingStatement: { type: Type.STRING } }, required: ["strengths", "areasForImprovement", "closingStatement"] };

export const generateReportCardComment = async (student: Student, grades: Grade[], anecdotes: Anecdote[]): Promise<{strengths: string, areasForImprovement: string, closingStatement: string}> => {
    const model = "gemini-2.5-pro";
    const gradeSummary = grades.map(g => ({ subject: g.subject, type: g.type, percentage: ((g.score / g.maxScore) * 100).toFixed(0) }));
    const prompt = `As a caring teacher, write a report card comment for ${student.firstName} ${student.lastName}.
        Student Data: - Grades: ${JSON.stringify(gradeSummary)} - Anecdotes: ${JSON.stringify(anecdotes.map(a => a.observation))}
        Instructions: Write a positive paragraph on strengths, a constructive one on areas for improvement, and a brief closing statement. Format as JSON.`;
    
     try {
        const response = await callApiProxy({ model, contents: prompt, config: { responseMimeType: "application/json", responseSchema: reportCardCommentSchema, safetySettings } });
        return parseJsonFromAiResponse(response.text);
    } catch (error) {
        throw handleGeminiError(error, 'generateReportCardComment');
    }
};

const quoteSchema = { type: Type.OBJECT, properties: { quote: { type: Type.STRING }, author: { type: Type.STRING } }, required: ["quote", "author"] };

export const getInspirationalQuote = async (): Promise<{ quote: string; author: string }> => {
    const model = "gemini-2.5-flash";
    const prompt = "Generate a short, inspirational quote for a teacher about education or growth. Return as JSON.";
    try {
        const response = await callApiProxy({ model, contents: prompt, config: { responseMimeType: "application/json", responseSchema: quoteSchema, safetySettings } });
        const result = parseJsonFromAiResponse<{ quote: string; author: string }>(response.text);
        if (!result.quote || !result.author) throw new Error("AI returned an invalid quote structure.");
        return result;
    } catch (error) {
        return { quote: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" }; // Failsafe
    }
};

const certificateContentSchema = { type: Type.OBJECT, properties: { certificateText: { type: Type.STRING } }, required: ["certificateText"] };

export const generateCertificateContent = async (details: { awardTitle: string; tone: string; achievements?: string }): Promise<string> => {
    const model = "gemini-2.5-flash";
    const { awardTitle, tone, achievements } = details;
    const prompt = `Craft body content for a student certificate for "${awardTitle}" with a ${tone} tone. ${achievements ? `Mention: "${achievements}"` : ''} Use placeholders '^^[STUDENT_NAME]^^' and '##[AWARD_TYPE]##'. Return JSON.`;

    try {
        const response = await callApiProxy({ model, contents: prompt, config: { responseMimeType: "application/json", responseSchema: certificateContentSchema, safetySettings } });
        const result = parseJsonFromAiResponse<{ certificateText: string }>(response.text);
        return result.certificateText;
    } catch (error) {
        throw handleGeminiError(error, 'generateCertificateContent');
    }
};

export const processAttendanceCommand = async (command: string, students: Student[]): Promise<{ status: AttendanceStatus, studentIds: string[] } | null> => {
    const model = "gemini-2.5-flash";
    const updateAttendanceTool = {
        functionDeclarations: [{
            name: 'update_attendance',
            description: 'Updates the attendance status for one or more students.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    status: { type: Type.STRING, description: "Attendance status: 'present', 'absent', or 'late'." },
                    student_ids: { type: Type.ARRAY, description: "An array of student IDs to update. Use 'ALL_STUDENTS' to update everyone.", items: { type: Type.STRING } },
                },
                required: ['status', 'student_ids'],
            },
        }]
    };
    const studentListWithIds = students.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}` }));
    const prompt = `Your task is to update student attendance by interpreting a command and using the 'update_attendance' function. You MUST use the student IDs from the list provided. Do not guess names or make up IDs. If a name in the command is ambiguous or not found in the list, respond with a text message asking for clarification instead of calling the function.
    
    Student List: ${JSON.stringify(studentListWithIds)}
    
    Command: "${command}"`;

    try {
        const response = await callApiProxy({
            model, contents: prompt, config: { tools: [updateAttendanceTool], safetySettings },
        });
        
        const call = response.functionCalls?.[0];
        if (!call) {
            // If the AI didn't call the function, it's likely asking for clarification.
            // We throw this as an error so the UI can display it in a single, consistent way.
            if (response.text?.trim()) {
                throw new Error(`AI needs clarification: ${response.text}`);
            }
            throw new Error("AI could not determine which students to update. Please try rephrasing your command.");
        }
        
        const args = call.args as { status: AttendanceStatus; student_ids: string[] };
        if (!args.status || !args.student_ids) {
            throw new Error("AI returned an incomplete function call.");
        };

        if (args.student_ids.includes("ALL_STUDENTS")) {
            return { status: args.status, studentIds: students.map(s => s.id) };
        }
        
        return { status: args.status, studentIds: args.student_ids };

    } catch (error) {
        throw handleGeminiError(error, 'processAttendanceCommand');
    }
};

const dlpProcedureSchema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING }, ppst: { type: Type.STRING } }, required: ["title", "content", "ppst"] };
const dlpEvaluationQuestionSchema = { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, answer: { type: Type.STRING } }, required: ["question", "options", "answer"] };
const dlpContentSchema = { type: Type.OBJECT, properties: { contentStandard: { type: Type.STRING }, performanceStandard: { type: Type.STRING }, topic: { type: Type.STRING }, learningReferences: { type: Type.STRING }, learningMaterials: { type: Type.STRING }, procedures: { type: Type.ARRAY, items: dlpProcedureSchema }, evaluationQuestions: { type: Type.ARRAY, items: dlpEvaluationQuestionSchema }, remarksContent: { type: Type.STRING } }, required: ["contentStandard", "performanceStandard", "topic", "learningReferences", "learningMaterials", "procedures", "evaluationQuestions", "remarksContent"] };

export const generateDlpContent = async (details: { gradeLevel: string; learningCompetency: string; lessonObjective: string; previousLesson: string; selectedQuarter: string; subject: string; teacherPosition: 'Beginning' | 'Proficient' | 'Highly Proficient' | 'Distinguished'; language: 'English' | 'Filipino'; }): Promise<DlpContent> => {
    const model = "gemini-2.5-pro";
    const { gradeLevel, language, subject, learningCompetency, lessonObjective, teacherPosition } = details;
    const prompt = `Generate a complete DepEd-aligned Daily Lesson Plan in ${language} for a ${gradeLevel} ${subject} class. Learning competency: "${learningCompetency}". Lesson Objective: "${lessonObjective}". Base PPST COIs on DepEd Order No. 14, s. 2023 for a ${teacherPosition} teacher. Structure the output as a valid JSON object.`;

    try {
        const response = await callApiProxy({
            model, contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: dlpContentSchema, safetySettings },
            systemInstruction: efficientGenerationSystemInstruction,
        });
        return parseJsonFromAiResponse<DlpContent>(response.text);
    } catch (error) {
        throw handleGeminiError(error, 'generateDlpContent');
    }
};

const dlpRubricItemSchema = { type: Type.OBJECT, properties: { criteria: { type: Type.STRING }, points: { type: Type.NUMBER } }, required: ["criteria", "points"] };
const tosItemSchema = { type: Type.OBJECT, properties: { objective: { type: Type.STRING }, cognitiveLevel: { type: Type.STRING }, itemNumbers: { type: Type.STRING } }, required: ["objective", "cognitiveLevel", "itemNumbers"] };
const questionSchema = { type: Type.OBJECT, properties: { questionText: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING } }, required: ["questionText", "correctAnswer"] };
const quizSectionSchema = { type: Type.OBJECT, properties: { instructions: { type: Type.STRING }, questions: { type: Type.ARRAY, items: questionSchema } }, required: ["instructions", "questions"] };
const quizContentSchema = { type: Type.OBJECT, properties: { quizTitle: { type: Type.STRING }, tableOfSpecifications: { type: Type.ARRAY, items: tosItemSchema }, questionsByType: { type: Type.OBJECT, properties: { 'Multiple Choice': quizSectionSchema, 'True or False': quizSectionSchema, 'Identification': quizSectionSchema } }, activities: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { activityName: { type: Type.STRING }, activityInstructions: { type: Type.STRING }, rubric: { type: Type.ARRAY, items: dlpRubricItemSchema } }, required: ["activityName", "activityInstructions"] } } }, required: ["quizTitle", "questionsByType", "activities"] };

export const generateQuizContent = async (details: { topic: string; numQuestions: number; quizTypes: QuizType[], subject: string, gradeLevel: string }): Promise<GeneratedQuiz> => {
    const model = "gemini-2.5-pro";
    const { topic, numQuestions, quizTypes, subject, gradeLevel } = details;
    const prompt = `Generate a high-quality quiz for a ${gradeLevel} ${subject} class on the topic: "${topic}". Include ${numQuestions} questions for each of these types: ${quizTypes.join(', ')}. Also generate 2-3 follow-up activities. If total questions > 10, include a Table of Specifications. Return as a valid JSON object.`;

    try {
        const response = await callApiProxy({
            model, contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: quizContentSchema, safetySettings },
            systemInstruction: efficientGenerationSystemInstruction,
        });
        return parseJsonFromAiResponse<GeneratedQuiz>(response.text);
    } catch (error) {
        throw handleGeminiError(error, 'generateQuizContent');
    }
};

export const generateRubricForActivity = async (details: { activityName: string, activityInstructions: string, totalPoints: number }): Promise<DlpRubricItem[]> => {
    const model = "gemini-2.5-flash";
    const { activityName, activityInstructions, totalPoints } = details;
    const rubricSchema = { type: Type.OBJECT, properties: { rubricItems: { type: Type.ARRAY, description: `Rubric criteria. Sum of points MUST equal ${totalPoints}.`, items: dlpRubricItemSchema } }, required: ["rubricItems"] };
    const prompt = `Create a rubric for the activity "${activityName}" with instructions: "${activityInstructions}". The total points must be exactly ${totalPoints}. Return as JSON.`;

    try {
        const response = await callApiProxy({ model, contents: prompt, config: { responseMimeType: "application/json", responseSchema: rubricSchema, safetySettings } });
        const result = parseJsonFromAiResponse<{ rubricItems: DlpRubricItem[] }>(response.text);
        return result.rubricItems;
    } catch (error) {
        throw handleGeminiError(error, 'generateRubricForActivity');
    }
};

const dllDailyEntrySchema = { type: Type.OBJECT, properties: { monday: { type: Type.STRING }, tuesday: { type: Type.STRING }, wednesday: { type: Type.STRING }, thursday: { type: Type.STRING }, friday: { type: Type.STRING } }, required: ["monday", "tuesday", "wednesday", "thursday", "friday"] };
const dllProcedureSchema = { type: Type.OBJECT, properties: { procedure: { type: Type.STRING }, ...dllDailyEntrySchema.properties }, required: ["procedure", "monday", "tuesday", "wednesday", "thursday", "friday"] };
const dllContentSchema = { type: Type.OBJECT, properties: { contentStandard: { type: Type.STRING }, performanceStandard: { type: Type.STRING }, learningCompetencies: { ...dllDailyEntrySchema }, content: { type: Type.STRING }, learningResources: { type: Type.OBJECT, properties: { teacherGuidePages: dllDailyEntrySchema, learnerMaterialsPages: dllDailyEntrySchema, textbookPages: dllDailyEntrySchema, additionalMaterials: dllDailyEntrySchema, otherResources: dllDailyEntrySchema }, required: ["teacherGuidePages", "learnerMaterialsPages", "textbookPages", "additionalMaterials", "otherResources"] }, procedures: { type: Type.ARRAY, items: dllProcedureSchema }, remarks: { type: Type.STRING }, reflection: { type: Type.ARRAY, items: dllProcedureSchema } }, required: ["contentStandard", "performanceStandard", "learningCompetencies", "content", "learningResources", "procedures", "remarks", "reflection"] };

export const generateDllContent = async (details: { subject: string; gradeLevel: string; weeklyTopic?: string; contentStandard?: string; performanceStandard?: string; teachingDates: string; quarter: string; language: 'English' | 'Filipino'; }): Promise<DllContent> => {
    const model = "gemini-2.5-pro";
    const { subject, gradeLevel, weeklyTopic, contentStandard, performanceStandard, teachingDates, quarter, language } = details;
    const prompt = `Generate a comprehensive Daily Lesson Log (DLL) in ${language} for a full 5-day week for a ${gradeLevel} ${subject} class, Quarter ${quarter}, for ${teachingDates}. Topic: "${weeklyTopic || 'AI to generate based on curriculum'}". Content Standard: "${contentStandard || 'AI to generate'}". Performance Standard: "${performanceStandard || 'AI to generate'}". Strictly follow the DepEd DLL format and provided JSON schema.`;

    try {
        const response = await callApiProxy({
            model, contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: dllContentSchema, safetySettings },
            systemInstruction: efficientGenerationSystemInstruction,
        });
        return parseJsonFromAiResponse<DllContent>(response.text);
    } catch (error) {
        throw handleGeminiError(error, 'generateDllContent');
    }
};