/**
 * Utility functions for dashboard data handling
 */

/**
 * Safely formats a number to locale string, returning "0" if value is undefined/null
 */
export const safeToLocaleString = (value: number | undefined | null): string => {
  return (value || 0).toLocaleString();
};

/**
 * Safely formats a currency value, returning "$0" if value is undefined/null
 */
export const safeCurrencyFormat = (value: number | undefined | null): string => {
  return `$${(value || 0).toLocaleString()}`;
};

/**
 * Safely gets a percentage value, returning "0%" if value is undefined/null
 */
export const safePercentageFormat = (value: number | undefined | null): string => {
  return `${(value || 0)}%`;
};

/**
 * Ensures an array is returned, even if the input is undefined/null
 */
export const safeArray = <T>(value: T[] | undefined | null): T[] => {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
};

/**
 * Ensures an object has fallback values for required properties
 */
export const withFallback = <T>(value: T | undefined | null, fallback: T): T => {
  return value || fallback;
};