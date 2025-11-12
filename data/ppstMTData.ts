export interface MTIndicator {
    domain: number;
    strand: number;
    code: string;
    description: string;
    type: 'COI' | 'NCOI';
}

// Representative list of Highly Proficient Indicators
export const highlyProficientObjectives: MTIndicator[] = [
    { domain: 1, strand: 1, code: 'HP-1.1.3', description: 'Model effective applications of content knowledge within and across curriculum teaching areas.', type: 'COI' },
    { domain: 1, strand: 5, code: 'HP-1.5.3', description: 'Develop and apply effective teaching strategies to promote critical and creative thinking, as well as other higher-order thinking skills.', type: 'COI' },
    { domain: 2, strand: 3, code: 'HP-2.3.3', description: 'Work with colleagues to model and share effective techniques in the management of classroom structure to engage learners in meaningful exploration, discovery and hands-on activities within a range of physical learning environments.', type: 'COI' },
    { domain: 3, strand: 1, code: 'HP-3.1.3', description: 'Work with colleagues to share differentiated, developmentally appropriate opportunities to address learners\' differences in gender, needs, strengths, interests and experiences.', type: 'COI' },
    { domain: 4, strand: 1, code: 'HP-4.1.3', description: 'Develop and apply effective strategies in the planning and management of developmentally sequenced teaching and learning processes to meet curriculum requirements and varied teaching contexts.', type: 'COI' },
    { domain: 4, strand: 4, code: 'HP-4.4.3', description: 'Contribute to collegial discussions that use teacher and learner feedback to enrich teaching practice.', type: 'NCOI' },
    { domain: 5, strand: 1, code: 'HP-5.1.3', description: 'Work collaboratively with colleagues to review the design, selection, organization and use of a range of effective diagnostic, formative and summative assessment strategies consistent with curriculum requirements.', type: 'COI' },
    { domain: 5, strand: 2, code: 'HP-5.2.3', description: 'Interpret collaboratively monitoring and evaluation strategies of learner progress and achievement using learner attainment data.', type: 'NCOI' },
    { domain: 5, strand: 3, code: 'HP-5.3.3', description: 'Use effective strategies for providing timely, accurate and constructive feedback to encourage learners to reflect on and improve their own learning.', type: 'NCOI' },
    { domain: 6, strand: 2, code: 'HP-6.2.3', description: 'Reflect on and evaluate learning environments that are responsive to community contexts.', type: 'NCOI' },
    { domain: 7, strand: 4, code: 'HP-7.4.3', description: 'Initiate professional reflections and promote learning opportunities with colleagues to improve practice.', type: 'NCOI' },
];

// Representative list of Distinguished Indicators
export const distinguishedObjectives: MTIndicator[] = [
    { domain: 1, strand: 1, code: 'D-1.1.4', description: 'Model exemplary practice and lead colleagues in enhancing content knowledge and its application within and across curriculum teaching areas.', type: 'COI' },
    { domain: 1, strand: 5, code: 'D-1.5.4', description: 'Lead colleagues in developing and applying effective teaching strategies to promote critical and creative thinking, as well as other higher-order thinking skills.', type: 'COI' },
    { domain: 2, strand: 4, code: 'D-2.4.4', description: 'Exhibit exemplary practice and lead colleagues in enhancing supportive learning environments that nurture and inspire learner participation.', type: 'COI' },
    { domain: 3, strand: 1, code: 'D-3.1.4', description: 'Lead colleagues to evaluate differentiated strategies to enrich teaching practices that address learners\' differences in gender, needs, strengths, interests and experiences.', type: 'COI' },
    { domain: 4, strand: 2, code: 'D-4.2.4', description: 'Exhibit a commitment to and support colleagues in the setting of high expectations that are aligned with the learning competencies.', type: 'COI' },
    { domain: 4, strand: 4, code: 'D-4.4.4', description: 'Lead colleagues in professional discussions to plan and implement strategies that enrich teaching practice.', type: 'NCOI' },
    { domain: 5, strand: 1, code: 'D-5.1.4', description: 'Lead initiatives in the evaluation of assessment policies and practices that promote learner progress and achievement.', type: 'NCOI' },
    { domain: 5, strand: 5, code: 'D-5.5.4', description: 'Provide advice and lead colleagues in the effective analysis and utilization of assessment data to modify teaching and learning practices and programs.', type: 'NCOI' },
    { domain: 6, strand: 3, code: 'D-6.3.4', description: 'Discuss with colleagues teaching and learning practices that apply existing codes, laws and regulations that apply to the teaching profession, and the responsibilities specified in the Code of Ethics for Professional Teachers.', type: 'NCOI' },
    { domain: 7, strand: 3, code: 'D-7.3.4', description: 'Contribute actively to professional networks within and between schools to improve practice.', type: 'NCOI' },
    { domain: 7, strand: 5, code: 'D-7.5.4', description: 'Take a leadership role in supporting colleagues with their professional development goals.', type: 'NCOI' },
];
