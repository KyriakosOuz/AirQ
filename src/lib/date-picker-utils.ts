
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, addMonths, isSameDay, isAfter, isBefore } from "date-fns";

export const getValidEndDates = (
  startDate: Date,
  frequency: string
): { minDate: Date; maxDate: Date } => {
  switch (frequency) {
    case "W": {
      // For weekly frequency, end date should complete full weeks
      const startWeek = startOfWeek(startDate, { weekStartsOn: 1 });
      const minEndDate = endOfWeek(startDate, { weekStartsOn: 1 });
      const maxEndDate = addWeeks(startWeek, 12); // Allow up to 12 weeks
      return { minDate: minEndDate, maxDate: maxEndDate };
    }
    case "M": {
      // For monthly frequency, end date should complete full months
      const startMonthDate = startOfMonth(startDate);
      const minEndDate = endOfMonth(startDate);
      const maxEndDate = addMonths(startMonthDate, 6); // Allow up to 6 months
      return { minDate: minEndDate, maxDate: maxEndDate };
    }
    default: {
      // For daily frequency, standard validation
      const maxEndDate = addMonths(startDate, 6);
      return { minDate: startDate, maxDate: maxEndDate };
    }
  }
};

export const isValidEndDate = (
  date: Date,
  startDate: Date,
  frequency: string
): boolean => {
  if (!startDate || isBefore(date, startDate)) return false;
  
  const { minDate, maxDate } = getValidEndDates(startDate, frequency);
  return !isBefore(date, minDate) && !isAfter(date, maxDate);
};

export const getFrequencyAdjustedDate = (
  date: Date,
  frequency: string,
  isEndDate: boolean = false
): Date => {
  switch (frequency) {
    case "W":
      return isEndDate 
        ? endOfWeek(date, { weekStartsOn: 1 })
        : startOfWeek(date, { weekStartsOn: 1 });
    case "M":
      return isEndDate 
        ? endOfMonth(date)
        : startOfMonth(date);
    default:
      return date;
  }
};

export const getTodayModifiers = (
  selectedDate: Date | undefined,
  today: Date
) => {
  const isSelectedToday = selectedDate && isSameDay(selectedDate, today);
  
  return {
    today: today,
    selectedToday: isSelectedToday ? today : undefined,
    notSelectedToday: !isSelectedToday ? today : undefined,
  };
};

export const getTodayStyles = () => ({
  selectedToday: {
    backgroundColor: "hsl(var(--primary))",
    color: "hsl(var(--primary-foreground))",
    fontWeight: "600",
  },
  notSelectedToday: {
    backgroundColor: "hsl(var(--secondary))",
    color: "hsl(var(--secondary-foreground))",
    fontWeight: "600",
    border: "2px solid hsl(var(--primary))",
  },
});
