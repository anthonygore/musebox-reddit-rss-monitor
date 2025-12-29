/**
 * Check if a post is within the specified time window
 * @param {Date|string} postDate - The publication date of the post
 * @param {number} minutes - Time window in minutes
 * @returns {boolean} - True if the post is within the time window
 */
export function isWithinTimeWindow(postDate, minutes) {
  const now = Date.now();
  const postTime = new Date(postDate).getTime();
  const timeWindowMs = minutes * 60 * 1000;
  const age = now - postTime;

  return age >= 0 && age <= timeWindowMs;
}

/**
 * Convert a date to Unix timestamp (milliseconds)
 * @param {Date|string} date - Date to convert
 * @returns {number} - Unix timestamp in milliseconds
 */
export function toTimestamp(date) {
  return new Date(date).getTime();
}

/**
 * Get the age of a post in minutes
 * @param {Date|string} postDate - The publication date of the post
 * @returns {number} - Age in minutes
 */
export function getAgeInMinutes(postDate) {
  const now = Date.now();
  const postTime = new Date(postDate).getTime();
  return Math.floor((now - postTime) / (60 * 1000));
}
