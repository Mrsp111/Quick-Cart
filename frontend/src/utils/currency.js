/**
 * Formats a number as Indian Rupees (₹)
 * 
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to include the ₹ symbol (default: true)
 * @param {boolean} useIndianFormat - Whether to use Indian number formatting (e.g., 1,00,000 instead of 100,000) (default: true)
 * @returns {string} The formatted price string
 */
export const formatIndianRupee = (amount, showSymbol = true, useIndianFormat = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₹0' : '0';
  }

  // Convert to 2 decimal places
  const formattedAmount = parseFloat(amount).toFixed(2);
  
  let [wholePart, decimalPart] = formattedAmount.split('.');
  
  // Format according to Indian number system (e.g., 1,00,000 instead of 100,000)
  if (useIndianFormat) {
    // For numbers less than 1000, no special formatting is needed
    if (wholePart.length <= 3) {
      // No change needed
    } else {
      // First, separate the last 3 digits
      const lastThree = wholePart.substring(wholePart.length - 3);
      // Then format the remaining digits in groups of 2
      const remaining = wholePart.substring(0, wholePart.length - 3);
      // Use regex to add commas after every 2 digits
      const formattedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      wholePart = formattedRemaining + ',' + lastThree;
    }
  } else {
    // Use standard international formatting (groups of 3)
    wholePart = parseInt(wholePart).toLocaleString('en-IN');
  }

  // Combine whole and decimal parts
  const formattedNumber = `${wholePart}.${decimalPart}`;
  
  // Add the ₹ symbol if requested
  return showSymbol ? `₹${formattedNumber}` : formattedNumber;
};