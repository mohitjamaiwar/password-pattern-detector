// modules/riskScorer.js
// Analyzes password characteristics and similarity results to assign a risk score.

/**
 * Calculates a risk score for a new password based on various factors.
 *
 * @param {Array<object>} similarityResults An array of comparison results from the similarity engine.
 * @param {number} passwordLength The length of the new password.
 * @param {number} exactMatches The number of times this exact password hash has been seen before.
 * @returns {{riskScore: string, reasons: Array<string>}} An object with the risk score and reasons.
 */
export function calculateRisk(similarityResults, passwordLength, exactMatches) {
    let riskScore = 'LOW';
    let numericScore = 0; // Score from 0 to 10
    const reasons = new Set();

    // 1. Check for exact password reuse
    if (exactMatches > 0) {
        riskScore = 'CRITICAL';
        numericScore = 10;
        reasons.add('Password reused on multiple sites');
    }

    // 2. Analyze similarity and mutation patterns
    let highestSimilarity = 0;
    let mostSignificantPattern = '';
    for (const result of similarityResults) {
        if (result.similar && result.score > highestSimilarity) {
            highestSimilarity = result.score;
            if (result.pattern) {
                mostSignificantPattern = result.pattern;
            }
        }
    }

    if (highestSimilarity > 0.85) {
        riskScore = 'HIGH';
        numericScore = Math.max(numericScore, Math.min(9, Math.round(8 + (highestSimilarity - 0.85) * (1 / 0.15))));
        if (mostSignificantPattern) {
            reasons.add(`Predictable mutation pattern detected: ${mostSignificantPattern}`);
        } else {
            reasons.add('Very similar to a password on another site');
        }
    } else if (highestSimilarity > 0.6) {
        riskScore = riskScore === 'HIGH' ? 'HIGH' : 'MEDIUM';
        numericScore = Math.max(numericScore, Math.round(4 + (highestSimilarity - 0.6) * (3 / 0.25)));
        reasons.add('Similar to a password on another site');
    }

    // 3. Check for weak password length
    if (passwordLength < 8) {
        riskScore = riskScore === 'HIGH' ? 'HIGH' : 'MEDIUM';
        numericScore = Math.max(numericScore, 6);
        reasons.add('Short password (less than 8 characters)');
    } else if (passwordLength < 12) {
        numericScore = Math.max(numericScore, 3);
        reasons.add('Consider a longer password for better security');
    }

    // If no specific reasons were found but risk is elevated, add a generic one.
    if (reasons.size === 0 && riskScore !== 'LOW') {
        reasons.add('Weak password characteristics detected.');
    }
    
    if (reasons.size === 0) {
        reasons.add('No immediate risks detected.');
    }

    return {
        riskScore: riskScore,
        numericScore: numericScore,
        reasons: Array.from(reasons)
    };
}
