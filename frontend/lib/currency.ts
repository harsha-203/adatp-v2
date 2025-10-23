// Currency conversion utilities

// USD to INR conversion rate (as of 2024)
const USD_TO_INR_RATE = 83;

/**
 * Convert USD price to INR
 * @param usdPrice Price in USD
 * @returns Price in INR
 */
export function convertUSDToINR(usdPrice: number): number {
  return Math.round(usdPrice * USD_TO_INR_RATE);
}

/**
 * Format price in INR currency format
 * @param price Price amount
 * @returns Formatted price string with ₹ symbol
 */
export function formatINR(price: number): string {
  return `₹${price.toLocaleString('en-IN')}`;
}

/**
 * Convert USD price and format in INR
 * @param usdPrice Price in USD
 * @returns Formatted INR price string
 */
export function convertAndFormatPrice(usdPrice: number): string {
  const inrPrice = convertUSDToINR(usdPrice);
  return formatINR(inrPrice);
}
