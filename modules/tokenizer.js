// modules/tokenizer.js
// Breaks passwords down into smaller parts (tokens) for analysis.

/**
 * A simple tokenizer that splits a password into an array of tokens.
 * e.g., "Password123!" -> ["Password", "123", "!"]
 * @param {string} password
 * @returns {string[]}
 */
export function simpleTokenize(password) {
  // Simple example: split by common separators and patterns
  const tokens = password.match(/[A-Z][a-z]+|[a-z]+|[A-Z]+|\d+|[^A-Za-z\d]+/g) || [];
  return tokens;
}


/**
 * Analyzes a password and breaks it down into its constituent parts.
 * @param {string} password The password to analyze.
 * @returns {{baseWord: string, numbers: string, symbols: string, structure: string}}
 */
export function structuredTokenize(password) {
    const parts = password.match(/[a-zA-Z]+|\d+|[^a-zA-Z\d]+/g) || [];
    
    let baseWord = '';
    let numbers = '';
    let symbols = '';
    const structureParts = [];

    parts.forEach(part => {
        if (/[a-zA-Z]/.test(part)) {
            baseWord += part;
            structureParts.push('[word]');
        } else if (/\d/.test(part)) {
            numbers += part;
            structureParts.push('[number]');
        } else {
            symbols += part;
            structureParts.push('[symbol]');
        }
    });

    return {
        baseWord: baseWord.toLowerCase(),
        numbers: numbers,
        symbols: symbols,
        structure: structureParts.join('')
    };
}

