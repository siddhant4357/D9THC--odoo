import Tesseract from 'tesseract.js';

/**
 * Extract text from receipt image using OCR
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Object} Extracted receipt data
 */
export const extractReceiptData = async (imageBuffer) => {
  try {
    console.log('Starting OCR processing...');
    
    // Perform OCR on the image
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    console.log('OCR completed. Extracted text:', text);

    // Parse the extracted text
    const receiptData = parseReceiptText(text);
    
    return receiptData;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to process receipt image');
  }
};

/**
 * Parse OCR text and extract meaningful data
 * @param {string} text - Raw OCR text
 * @returns {Object} Parsed receipt data
 */
const parseReceiptText = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  
  const result = {
    amount: null,
    date: null,
    description: '',
    category: 'Other',
    merchantName: '',
  };

  // Extract amount (look for currency symbols and numbers)
  const amountPatterns = [
    /(?:total|amount|sum|paid)[\s:]*[$₹€£]\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /[$₹€£]\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rs|inr|usd|eur|gbp)/i,
    /(?:total|amount)[\s:]*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.amount = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }

  // Extract date
  const datePatterns = [
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
    /(\d{4}[/-]\d{1,2}[/-]\d{1,2})/,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.date = new Date(match[1]);
      if (!isNaN(result.date.getTime())) {
        break;
      }
    }
  }

  // If no date found, use today
  if (!result.date || isNaN(result.date.getTime())) {
    result.date = new Date();
  }

  // Extract merchant/restaurant name (usually first line)
  if (lines.length > 0) {
    result.merchantName = lines[0].trim().substring(0, 100);
  }

  // Create description
  result.description = result.merchantName 
    ? `${result.merchantName} - Receipt` 
    : 'Receipt scan';

  // Categorize based on keywords
  const textLower = text.toLowerCase();
  if (textLower.includes('restaurant') || textLower.includes('cafe') || 
      textLower.includes('food') || textLower.includes('dining')) {
    result.category = 'Food';
  } else if (textLower.includes('hotel') || textLower.includes('accommodation') || 
             textLower.includes('lodging')) {
    result.category = 'Accommodation';
  } else if (textLower.includes('taxi') || textLower.includes('uber') || 
             textLower.includes('transport') || textLower.includes('fuel') || 
             textLower.includes('parking')) {
    result.category = 'Transportation';
  } else if (textLower.includes('flight') || textLower.includes('train') || 
             textLower.includes('travel')) {
    result.category = 'Travel';
  } else if (textLower.includes('office') || textLower.includes('supplies') || 
             textLower.includes('stationery')) {
    result.category = 'Office Supplies';
  }

  return result;
};

/**
 * Simple amount extraction from text
 * @param {string} text - Text containing amount
 * @returns {number|null} Extracted amount
 */
export const extractAmount = (text) => {
  const amountMatch = text.match(/\d+(?:,\d{3})*(?:\.\d{2})?/);
  return amountMatch ? parseFloat(amountMatch[0].replace(/,/g, '')) : null;
};

/**
 * Extract date from text
 * @param {string} text - Text containing date
 * @returns {Date|null} Extracted date
 */
export const extractDate = (text) => {
  const dateMatch = text.match(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/);
  return dateMatch ? new Date(dateMatch[0]) : null;
};

