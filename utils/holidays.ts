interface Holiday {
    month: number; // 0-indexed
    day?: number;
    name: string;
    message: string;
    // Function to calculate day for floating holidays
    calculateDate?: (year: number) => { month: number; day: number };
}

const getLastMondayOfAugust = (year: number): { month: number, day: number } => {
    // August is month 7. new Date(year, 8, 0) gives the last day of August.
    const lastDayOfMonth = new Date(year, 8, 0); 
    const dayOfWeek = lastDayOfMonth.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    let dayOfMonth = lastDayOfMonth.getDate();
    // Calculate how many days to subtract to get to the previous Monday
    const offset = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
    dayOfMonth -= offset;
    return { month: 7, day: dayOfMonth };
};

export const holidays: Holiday[] = [
    { month: 0, day: 1, name: "New Year's Day", message: "Happy New Year! May the coming year be filled with fresh opportunities, new achievements, and countless moments of joy in your classroom." },
    { month: 3, day: 9, name: "Araw ng Kagitingan", message: "Today we honor bravery. Thank you for your daily heroism in the classroom, fighting for the future of your students." },
    { month: 4, day: 1, name: "Labor Day", message: "Happy Labor Day! Your hard work and dedication as an educator are immensely valued. Enjoy a well-deserved day of rest." },
    { month: 5, day: 12, name: "Independence Day", message: "Happy Independence Day! Let's celebrate the freedom to learn and the power of education to build a stronger nation." },
    // Fix: Added missing 'month' property to satisfy the Holiday interface.
    { month: 7, name: "National Heroes Day", calculateDate: getLastMondayOfAugust, message: "Salute to the heroes of the past and the heroes of today—like you! Thank you for your tireless dedication to your students." },
    { month: 9, day: 5, name: "World Teachers' Day", message: "Happy World Teachers' Day! Your dedication shapes the future. Take a moment to celebrate the incredible impact you make every single day." },
    { month: 10, day: 1, name: "All Saints' Day", message: "A day for remembrance and reflection. Wishing you a peaceful and solemn break." },
    { month: 10, day: 30, name: "Bonifacio Day", message: "Remembering the courage of a national hero. May it inspire the hero within you as you teach and guide your students." },
    { month: 11, day: 25, name: "Christmas Day", message: "Merry Christmas! Wishing you a season filled with joy, peace, and well-deserved rest. Enjoy the holiday break!" },
    { month: 11, day: 30, name: "Rizal Day", message: "A day to honor a hero who valued education above all. Your work continues his legacy. Wishing you a meaningful day of reflection." },
];
