import { prisma } from './db.js';

function scoreRisk({ exactReuseCount, sameStructureCount, passwordLength }) {
  let riskScore = 'LOW';
  let numericScore = 1;
  const reasons = [];

  if (exactReuseCount > 0) {
    riskScore = 'CRITICAL';
    numericScore = 10;
    reasons.push('Password hash already used on another site');
  }

  if (sameStructureCount > 2 && riskScore !== 'CRITICAL') {
    riskScore = 'HIGH';
    numericScore = Math.max(numericScore, 8);
    reasons.push('Highly repeated password structure detected');
  } else if (sameStructureCount > 0 && riskScore === 'LOW') {
    riskScore = 'MEDIUM';
    numericScore = Math.max(numericScore, 5);
    reasons.push('Password structure reused across sites');
  }

  if (passwordLength < 8) {
    if (riskScore === 'LOW') {
      riskScore = 'MEDIUM';
    }
    numericScore = Math.max(numericScore, 6);
    reasons.push('Short password length (less than 8)');
  }

  if (reasons.length === 0) {
    reasons.push('No immediate risks detected');
  }

  return { riskScore, numericScore, reasons };
}

export async function analyzeAndStoreFingerprint(payload) {
  const { userId, site, passwordHash, structure, tokens, passwordLength } = payload;

  const [exactReuseCount, sameStructureCount] = await Promise.all([
    prisma.passwordFingerprint.count({
      where: {
        userId,
        passwordHash,
        site: { not: site }
      }
    }),
    prisma.passwordFingerprint.count({
      where: {
        userId,
        structure,
        site: { not: site }
      }
    })
  ]);

  const risk = scoreRisk({ exactReuseCount, sameStructureCount, passwordLength });

  const fingerprint = await prisma.passwordFingerprint.create({
    data: {
      userId,
      site,
      passwordHash,
      structure,
      baseWord: tokens.baseWord || '',
      numbers: tokens.numbers || '',
      symbols: tokens.symbols || ''
    }
  });

  await prisma.riskEvent.create({
    data: {
      userId,
      site,
      riskScore: risk.riskScore,
      numericScore: risk.numericScore,
      reasonsJson: JSON.stringify(risk.reasons),
      fingerprintId: fingerprint.id
    }
  });

  return risk;
}
