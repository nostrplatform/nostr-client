/**
 * Converts satoshi amount to BTC with proper formatting
 * @param satoshis Amount in satoshis
 * @param maxDecimals Maximum number of decimal places to show (default: 8)
 * @returns Formatted BTC value as string without trailing zeros
 */
export function satoshiToBitcoin(satoshis: number, maxDecimals: number = 8): string {
  const btcValue = satoshis / 100000000;
  
  // Format with fixed decimal places first
  const fixed = btcValue.toFixed(maxDecimals);
  
  // Remove trailing zeros and decimal point if not needed
  return fixed.replace(/\.?0+$/, '');
}
