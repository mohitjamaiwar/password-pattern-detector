// modules/similarityEngine.js
// Compares a new password fingerprint against stored ones to find similarities.

/**
 * Calculates the Levenshtein distance between two strings.
 * @param {string} s1 The first string.
 * @param {string} s2 The second string.
 * @returns {number} The Levenshtein distance.
 */
function levenshteinDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

/**
 * Compares two password fingerprints to find similarities.
 * @param {object} newFingerprint The fingerprint of the new password.
 * @param {object} storedFingerprint The fingerprint of a stored password.
 * @returns {object} An object describing the similarity.
 */
export function comparePasswords(newFingerprint, storedFingerprint) {
    const results = {
        similar: false,
        score: 0,
        reasons: []
    };

    // 1. Direct hash comparison (exact match)
    if (newFingerprint.hash === storedFingerprint.hash) {
        return { similar: true, score: 1.0, pattern: "exact match" };
    }

    // 2. Levenshtein distance on base words
    const baseWordDistance = levenshteinDistance(newFingerprint.tokens.baseWord, storedFingerprint.tokens.baseWord);
    const longerBaseWord = Math.max(newFingerprint.tokens.baseWord.length, storedFingerprint.tokens.baseWord.length);
    if (longerBaseWord > 0) {
        const baseWordSimilarity = 1 - (baseWordDistance / longerBaseWord);
        if (baseWordSimilarity > 0.85) {
            results.similar = true;
            results.score = Math.max(results.score, baseWordSimilarity);
            results.reasons.push("similar base word");
        }
    }

    // 3. Structure comparison
    if (newFingerprint.structure === storedFingerprint.structure) {
        results.similar = true;
        results.score = Math.max(results.score, 0.7); // Structural similarity is a strong indicator
        results.reasons.push("same structure");
    }

    // 4. Token comparison (same base word)
    if (newFingerprint.tokens.baseWord === storedFingerprint.tokens.baseWord && newFingerprint.tokens.baseWord.length > 3) {
        results.similar = true;
        results.score = Math.max(results.score, 0.8);
        results.reasons.push("same base word");
    }

    // 5. Numeric mutation detection
    const num1 = parseInt(newFingerprint.tokens.numbers, 10);
    const num2 = parseInt(storedFingerprint.tokens.numbers, 10);
    if (!isNaN(num1) && !isNaN(num2) && num1 !== num2) {
        // Check for simple increments/decrements
        if (Math.abs(num1 - num2) < 5) {
             results.score = Math.max(results.score, 0.6);
             results.reasons.push("numeric mutation");
        }
    }
    
    // Final check on combined reasons
    if (results.reasons.includes("same base word") && results.reasons.includes("numeric mutation")) {
        results.similar = true;
        results.score = Math.max(results.score, 0.9);
        results.pattern = "base word + numeric mutation";
    } else if (results.similar) {
        results.pattern = results.reasons.join(' + ');
    }


    return results;
}
