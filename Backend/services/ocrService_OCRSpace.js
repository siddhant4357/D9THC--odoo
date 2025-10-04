import axios from 'axios';
import FormData from 'form-data';

/**
 * Extract text from receipt image using OCR.space API
 * FREE API - No credit card required
 * Get your free API key: https://ocr.space/ocrapi
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Object} Extracted receipt data
 */
export const extractReceiptData = async (imageBuffer) => {
  try {
    console.log('Starting OCR.space processing...');
    
    // Create form data
    const formData = new FormData();
    formData.append('file', imageBuffer, { filename: 'receipt.jpg' });
    formData.append('apikey', process.env.OCR_SPACE_API_KEY || 'K87899142388957'); // Free demo key
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Engine 2 is more accurate

    // Call OCR.space API
    const response = await axios.post(
      'https://api.ocr.space/parse/image',
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000, // 30 second timeout
      }
    );

    if (response.data.IsErroredOnProcessing) {
      throw new Error(response.data.ErrorMessage?.[0] || 'OCR processing failed');
    }

    const text = response.data.ParsedResults?.[0]?.ParsedText || '';
    console.log('OCR.space completed. Extracted text:', text);

    // Parse the extracted text
    const receiptData = parseReceiptText(text);
    
    return receiptData;
  } catch (error) {
    console.error('OCR.space Error:', error.message);
    
    // Fallback to basic extraction
    return {
      amount: null,
      date: new Date(),
      description: 'Receipt scan - please verify details',
      category: 'Other',
      merchantName: '',
      rawText: error.message,
    };
  }
};

/**
 * Parse OCR text and extract meaningful data
 * Enhanced parsing with multiple patterns
 */
const parseReceiptText = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  
  const result = {
    amount: null,
    date: null,
    description: '',
    category: 'Other',
    merchantName: '',
    rawText: text,
  };

  // Extract amount - Multiple patterns for better accuracy
  const amountPatterns = [
    // Total with currency
    /(?:total|amount|sum|grand total|balance|paid)[\s:]*[$₹€£¥]\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    // Currency followed by number
    /[$₹€£¥]\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
    // Number with currency code
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:usd|inr|eur|gbp|jpy|rs)/i,
    // Total amount pattern
    /(?:total|amount)[\s:]*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    // Simple large number (fallback)
    /\b(\d{2,}(?:\.\d{2})?)\b/,
  ];

  for (const pattern of amountPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      // Get the largest number found (likely the total)
      const numbers = [];
      let match;
      const globalPattern = new RegExp(pattern.source, 'gi');
      while ((match = globalPattern.exec(text)) !== null) {
        const numStr = match[1] || match[0];
        const num = parseFloat(numStr.replace(/[,$₹€£¥]/g, ''));
        if (!isNaN(num) && num > 0) {
          numbers.push(num);
        }
      }
      if (numbers.length > 0) {
        result.amount = Math.max(...numbers);
        break;
      }
    }
  }

  // Extract date - Multiple formats
  const datePatterns = [
    // DD/MM/YYYY or MM/DD/YYYY
    /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/,
    // YYYY-MM-DD
    /\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/,
    // Month name formats
    /\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})\b/i,
    /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})\b/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsedDate = new Date(match[1]);
      if (!isNaN(parsedDate.getTime())) {
        result.date = parsedDate;
        break;
      }
    }
  }

  // If no valid date found, use today
  if (!result.date || isNaN(result.date.getTime())) {
    result.date = new Date();
  }

  // Extract merchant name (usually first meaningful line)
  const merchantPatterns = [
    // Look for company/restaurant name patterns
    /^([A-Z][A-Za-z\s&'-]{2,40})$/m,
    // First line with multiple words
    /^([A-Za-z\s&'-]{3,50})$/m,
  ];

  for (const pattern of merchantPatterns) {
    const match = text.match(pattern);
    if (match && match[1].trim().length > 2) {
      result.merchantName = match[1].trim();
      break;
    }
  }

  // Fallback: use first line
  if (!result.merchantName && lines.length > 0) {
    result.merchantName = lines[0].trim().substring(0, 50);
  }

  // Create description
  result.description = result.merchantName 
    ? `${result.merchantName} - Receipt` 
    : 'Receipt scan';

  // Auto-categorize based on keywords
  const textLower = text.toLowerCase();
  
  if (textLower.match(/restaurant|cafe|coffee|food|dining|meal|pizza|burger|cuisine|bar|pub|eatery/)) {
    result.category = 'Food';
  } else if (textLower.match(/hotel|motel|accommodation|lodging|inn|resort|hostel|booking/)) {
    result.category = 'Accommodation';
  } else if (textLower.match(/taxi|uber|lyft|cab|transport|bus|metro|train|flight|airline|parking|toll|fuel|gas|petrol/)) {
    result.category = 'Transportation';
  } else if (textLower.match(/travel|trip|tour|ticket|booking|airfare/)) {
    result.category = 'Travel';
  } else if (textLower.match(/office|supplies|stationery|equipment|computer|software|hardware/)) {
    result.category = 'Office Supplies';
  } else if (textLower.match(/entertainment|movie|cinema|show|concert|event|ticket/)) {
    result.category = 'Entertainment';
  }

  return result;
};

/**
 * Fallback: Manual parsing helpers
 */
export const extractAmount = (text) => {
  const match = text.match(/[\d,]+\.?\d*/);
  return match ? parseFloat(match[0].replace(/,/g, '')) : null;
};

export const extractDate = (text) => {
  const match = text.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/);
  return match ? new Date(match[0]) : new Date();
};

