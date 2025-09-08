// components/utils/age.ts
// todo ai, check this file

// Returns days for less than 2 weeks, weeks for less than 2 months, months for less than 2 years, and years after that.
const MS_PER_DAY = 86_400_000;

function parseLocalDateOnly(input: Date | string): Date {
     if (input instanceof Date) return new Date(input.getTime());
     if (typeof input === 'string') {
          // Accept YYYY-MM-DD and build a *local* midnight date
          const m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
          // Fallback for full ISO strings with time
          const d = new Date(input);
          if (!Number.isNaN(d.getTime())) return d;
     }
     throw new Error('Invalid date of birth');
}

function daysBetweenCalendar(d1: Date, d2: Date): number {
     // Compare at UTC midnight to avoid DST issues
     const a = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
     const b = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
     return Math.max(0, Math.floor((b - a) / MS_PER_DAY));
}

export function formatAge(dobInput: Date | string, nowInput: Date = new Date()): string {
     const dob = parseLocalDateOnly(dobInput);
     const now = parseLocalDateOnly(nowInput);

     if (now < dob) return '0 days';

     const totalDays = daysBetweenCalendar(dob, now);

     // < 2 weeks → days
     if (totalDays < 14) return `${totalDays} day${totalDays === 1 ? '' : 's'}`;

     // < 2 months → weeks (floor)
     const twoMonthsLater = new Date(dob);
     twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
     if (now < twoMonthsLater) {
          const weeks = Math.floor(totalDays / 7);
          return `${weeks} week${weeks === 1 ? '' : 's'}`;
     }

     // < 2 years → months (calendar months, floored)
     const twoYearsLater = new Date(dob);
     twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);
     if (now < twoYearsLater) {
          let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
          if (now.getDate() < dob.getDate()) months -= 1;
          return `${months} month${months === 1 ? '' : 's'}`;
     }

     // ≥ 2 years → years (calendar years, floored)
     let years = now.getFullYear() - dob.getFullYear();
     const m = now.getMonth() - dob.getMonth();
     if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years -= 1;
     return `${years} year${years === 1 ? '' : 's'}`;
}
