export type Rating = 'O' | 'VS' | 'S' | '';

export interface ObjectiveYear {
    type: 'COI' | 'NCOI' | null;
    indicator: string | null;
}

export interface T2T7Objective {
    objNumber: number;
    years: [ObjectiveYear, ObjectiveYear, ObjectiveYear];
}

// Based on the provided image for Teacher II to Teacher VII progression
export const t2t7Objectives: T2T7Objective[] = [
    { objNumber: 1, years: [{ type: 'COI', indicator: '1.1.2' }, { type: 'COI', indicator: '1.1.2' }, { type: 'COI', indicator: '1.1.2' }] },
    { objNumber: 2, years: [{ type: 'COI', indicator: '1.4.2' }, { type: 'COI', indicator: '1.4.2' }, { type: 'NCOI', indicator: '1.2.2' }] },
    { objNumber: 3, years: [{ type: 'COI', indicator: '1.5.2' }, { type: 'COI', indicator: '1.5.2' }, { type: 'COI', indicator: '1.3.2' }] },
    { objNumber: 4, years: [{ type: 'COI', indicator: '2.3.2' }, { type: 'COI', indicator: '1.6.2' }, { type: 'COI', indicator: '1.4.2' }] },
    { objNumber: 5, years: [{ type: 'COI', indicator: '2.6.2' }, { type: 'COI', indicator: '2.1.2' }, { type: 'COI', indicator: '1.7.2' }] },
    { objNumber: 6, years: [{ type: 'COI', indicator: '3.1.2' }, { type: 'COI', indicator: '2.2.2' }, { type: 'COI', indicator: '2.4.2' }] },
    { objNumber: 7, years: [{ type: 'COI', indicator: '4.1.2' }, { type: 'COI', indicator: '3.2.2' }, { type: 'COI', indicator: '2.5.2' }] },
    { objNumber: 8, years: [{ type: 'NCOI', indicator: '4.4.2' }, { type: 'COI', indicator: '3.5.2' }, { type: 'COI', indicator: '3.3.2' }] },
    { objNumber: 9, years: [{ type: 'COI', indicator: '4.5.2' }, { type: 'NCOI', indicator: '4.2.2' }, { type: 'COI', indicator: '3.4.2' }] },
    { objNumber: 10, years: [{ type: 'COI', indicator: '5.1.2' }, { type: 'COI', indicator: '5.3.2' }, { type: 'NCOI', indicator: '4.3.2' }] },
    { objNumber: 11, years: [{ type: 'NCOI', indicator: '5.2.2' }, { type: 'NCOI', indicator: '5.5.2' }, { type: 'NCOI', indicator: '6.1.2' }] },
    { objNumber: 12, years: [{ type: 'NCOI', indicator: '5.4.2' }, { type: 'NCOI', indicator: '6.2.2' }, { type: 'NCOI', indicator: '6.3.2' }] },
    { objNumber: 13, years: [{ type: 'NCOI', indicator: '7.1.2' }, { type: 'NCOI', indicator: '7.3.2' }, { type: 'NCOI', indicator: '6.4.2' }] },
    { objNumber: 14, years: [{ type: 'NCOI', indicator: '7.5.2' }, { type: 'NCOI', indicator: '7.4.2' }, { type: 'NCOI', indicator: '7.2.2' }] },
    { objNumber: 15, years: [{ type: 'NCOI', indicator: '8.1' }, { indicator: null, type: null }, { indicator: null, type: null }] }, // Plus Factor
];