import crypto from 'crypto';

/**
 * Generate a secure random password
 * @param {number} length - Length of the password (default: 12)
 * @returns {string} - Generated password
 */
export const generateSecurePassword = (length = 12) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += symbols[crypto.randomInt(0, symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => crypto.randomInt(0, 3) - 1).join('');
};

/**
 * Generate a memorable password (easier to type but still secure)
 * @returns {string} - Generated password
 */
export const generateMemorablePassword = () => {
  const words = ['Storm', 'Cloud', 'River', 'Mountain', 'Forest', 'Ocean', 'Thunder', 'Lightning', 'Phoenix', 'Dragon'];
  const word = words[crypto.randomInt(0, words.length)];
  const number = crypto.randomInt(100, 999);
  const symbol = ['!', '@', '#', '$', '%'][crypto.randomInt(0, 5)];
  
  return `${word}${number}${symbol}`;
};

