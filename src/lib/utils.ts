/**
 * Calculate the remaining time for a program based on end date
 * @param endDate End date timestamp in milliseconds
 * @returns Object with days, weeks remaining and a formatted string
 */
export function calculateRemainingTime(endDate?: number) {
  if (!endDate) return null;
  
  const now = Date.now();
  
  // If program has already ended
  if (endDate <= now) {
    return {
      days: 0,
      weeks: 0,
      isCompleted: true,
      formattedString: 'Program completed'
    };
  }
  
  const remainingMs = endDate - now;
  const dayInMs = 1000 * 60 * 60 * 24;
  const remainingDays = Math.ceil(remainingMs / dayInMs);
  const remainingWeeks = Math.floor(remainingDays / 7);
  
  let formattedString = '';
  
  if (remainingDays <= 1) {
    formattedString = '⏳ Less than 1 day remaining';
  } else if (remainingDays < 7) {
    formattedString = `⏳ ${remainingDays} days remaining`;
  } else {
    formattedString = `⏳ ${remainingWeeks} weeks remaining`;
    if (remainingDays % 7 > 0) {
      formattedString += ` (${remainingDays} days)`;
    }
  }
  
  return {
    days: remainingDays,
    weeks: remainingWeeks,
    isCompleted: false,
    formattedString
  };
}

/**
 * Calculate the end date of a program based on start date and total duration
 * @param startDate Start date timestamp in milliseconds
 * @param totalWeeks Total number of weeks
 * @returns End date timestamp in milliseconds
 */
export function calculateProgramEndDate(startDate: number, totalWeeks: number): number {
  const dayInMs = 1000 * 60 * 60 * 24;
  return startDate + (totalWeeks * 7 * dayInMs);
}

/**
 * Calculate the total number of weeks in a program based on its blocks
 * @param blocks Array of training blocks
 * @returns Total number of weeks
 */
export function calculateTotalProgramWeeks(blocks: any[]): number {
  if (!blocks || blocks.length === 0) return 0;
  
  // Find the highest end week among all blocks
  return Math.max(...blocks.map(block => block.endWeek || 0));
} 