
/**
 * Formats a number into a compact string (e.g., 2.5T, 1.2B, 500M)
 */
export const formatCompactNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return '0.00';
  
  if (num >= 1e12) {
    return (num / 1e12).toFixed(2) + 'T';
  }
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

/**
 * Formats a price with appropriate precision based on value
 */
export const formatPrice = (price: number | undefined | null): string => {
  if (price === undefined || price === null) return '$0.00';
  
  if (price < 0.01) {
    return '$' + price.toFixed(6);
  }
  if (price < 1) {
    return '$' + price.toFixed(4);
  }
  if (price < 10) {
    return '$' + price.toFixed(3);
  }
  return '$' + price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Generates a consistent color based on a string (symbol)
 */
export const getSymbolColor = (symbol: string): string => {
  const colors = [
    'from-orange-500 to-yellow-500',
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-red-500 to-orange-500',
    'from-indigo-500 to-purple-500',
  ];
  
  const charCode = symbol.charCodeAt(0) || 0;
  const index = charCode % colors.length;
  return colors[index];
};
