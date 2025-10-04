import axios from 'axios';

/**
 * FAST CURRENCY CONVERSION SERVICE
 * Caches exchange rates to avoid API delays
 */

// In-memory cache for exchange rates
const ratesCache = {
  rates: {},
  lastUpdated: null,
  ttl: 1000 * 60 * 60 // 1 hour cache
};

/**
 * Get exchange rates (cached for 1 hour)
 * SUPER FAST - No API call if cache is valid!
 */
export const getExchangeRates = async (baseCurrency = 'USD') => {
  try {
    const now = Date.now();
    
    // Return cached rates if still valid
    if (ratesCache.rates[baseCurrency] && 
        ratesCache.lastUpdated && 
        (now - ratesCache.lastUpdated) < ratesCache.ttl) {
      return ratesCache.rates[baseCurrency];
    }
    
    // Fetch fresh rates
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`,
      { timeout: 3000 } // 3 second timeout
    );
    
    // Cache the rates
    if (!ratesCache.rates[baseCurrency]) {
      ratesCache.rates[baseCurrency] = {};
    }
    ratesCache.rates[baseCurrency] = response.data.rates;
    ratesCache.lastUpdated = now;
    
    return response.data.rates;
    
  } catch (error) {
    console.error('Currency API error:', error.message);
    
    // Return cached rates even if expired (better than nothing)
    if (ratesCache.rates[baseCurrency]) {
      return ratesCache.rates[baseCurrency];
    }
    
    // Fallback: return 1:1 rates
    return {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      INR: 83.12,
      JPY: 149.50,
      AUD: 1.52,
      CAD: 1.36,
      CHF: 0.88,
      CNY: 7.24,
      AED: 3.67
    };
  }
};

/**
 * Convert amount from one currency to another
 * INSTANT - Uses cached rates!
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  try {
    const rates = await getExchangeRates(fromCurrency);
    const rate = rates[toCurrency];
    
    if (!rate) {
      console.warn(`No rate found for ${fromCurrency} -> ${toCurrency}, returning original`);
      return amount;
    }
    
    return amount * rate;
  } catch (error) {
    console.error('Conversion error:', error);
    return amount; // Return original if conversion fails
  }
};

/**
 * Convert multiple expenses at once (BATCH)
 * MUCH FASTER than individual conversions!
 */
export const convertExpensesBatch = async (expenses, targetCurrency) => {
  try {
    // Get all unique currencies from expenses
    const uniqueCurrencies = [...new Set(expenses.map(e => e.currency))];
    
    // Pre-fetch rates for all currencies (single cache lookup!)
    const ratesPromises = uniqueCurrencies.map(currency => 
      getExchangeRates(currency)
    );
    
    await Promise.all(ratesPromises);
    
    // Convert all expenses (instant - uses cache!)
    const converted = await Promise.all(
      expenses.map(async (expense) => {
        if (expense.currency === targetCurrency) {
          return {
            ...expense,
            convertedAmount: expense.amount
          };
        }
        
        const convertedAmount = await convertCurrency(
          expense.amount,
          expense.currency,
          targetCurrency
        );
        
        return {
          ...expense,
          convertedAmount
        };
      })
    );
    
    return converted;
    
  } catch (error) {
    console.error('Batch conversion error:', error);
    return expenses.map(e => ({ ...e, convertedAmount: e.amount }));
  }
};

/**
 * Clear cache (for testing or manual refresh)
 */
export const clearCache = () => {
  ratesCache.rates = {};
  ratesCache.lastUpdated = null;
};

/**
 * Get cache status (for debugging)
 */
export const getCacheStatus = () => {
  return {
    hasCachedRates: Object.keys(ratesCache.rates).length > 0,
    currencies: Object.keys(ratesCache.rates),
    lastUpdated: ratesCache.lastUpdated 
      ? new Date(ratesCache.lastUpdated).toISOString() 
      : null,
    age: ratesCache.lastUpdated 
      ? Math.round((Date.now() - ratesCache.lastUpdated) / 1000) + 's'
      : null,
    isExpired: ratesCache.lastUpdated 
      ? (Date.now() - ratesCache.lastUpdated) > ratesCache.ttl
      : true
  };
};

