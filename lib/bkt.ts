import { BKTParameters, ConceptMastery } from './types';

/**
 * Standard Bayesian Knowledge Tracing (Corbett & Anderson, 1995)
 *
 * Formulas:
 * 1. Posterior after correct response:
 *    P(L_t | Correct) = (P(L_t) * (1 - P(S))) / (P(L_t) * (1 - P(S)) + (1 - P(L_t)) * P(G))
 *
 * 2. Posterior after incorrect response:
 *    P(L_t | Incorrect) = (P(L_t) * P(S)) / (P(L_t) * P(S) + (1 - P(L_t)) * (1 - P(G)))
 *
 * 3. Learning transition update for next observation:
 *    P(L_{t+1}) = P(L_t | Obs) + (1 - P(L_t | Obs)) * P(T)
 */

export function calculateBKTUpdate(
  currentP: number,
  isCorrect: boolean,
  params: BKTParameters
): {
  posteriorGivenObs: number;
  newMastery: number;
  delta: number;
} {
  const { pT, pS, pG } = params;
  
  // Guard against numerical instability
  const pKnown = Math.min(Math.max(currentP, 0.001), 0.999);
  
  let posteriorGivenObs: number;
  
  if (isCorrect) {
    const num = pKnown * (1 - pS);
    const denom = pKnown * (1 - pS) + (1 - pKnown) * pG;
    posteriorGivenObs = denom > 0 ? num / denom : pKnown;
  } else {
    const num = pKnown * pS;
    const denom = pKnown * pS + (1 - pKnown) * (1 - pG);
    posteriorGivenObs = denom > 0 ? num / denom : pKnown;
  }

  // Apply learning transition P(T)
  const newMastery = posteriorGivenObs + (1 - posteriorGivenObs) * pT;
  const clampedNewMastery = Math.min(Math.max(newMastery, 0.01), 0.99);
  const delta = clampedNewMastery - currentP;

  return {
    posteriorGivenObs,
    newMastery: Number(clampedNewMastery.toFixed(4)),
    delta: Number(delta.toFixed(4)),
  };
}

/**
 * Simulates an array of responses to visualize BKT probability progression
 */
export function simulateBKTTurns(
  initialP: number,
  responses: boolean[],
  params: BKTParameters
): { step: number; isCorrect: boolean; mastery: number }[] {
  let current = initialP;
  const trajectory = [{ step: 0, isCorrect: true, mastery: current }];

  responses.forEach((isCorrect, index) => {
    const result = calculateBKTUpdate(current, isCorrect, params);
    current = result.newMastery;
    trajectory.push({
      step: index + 1,
      isCorrect,
      mastery: current,
    });
  });

  return trajectory;
}

export type MasteryLevel = 'Novice' | 'Developing' | 'Competent' | 'Mastered';

export function getMasteryLevel(prob: number): {
  level: MasteryLevel;
  colorClass: string;
  bgClass: string;
  badgeClass: string;
  description: string;
} {
  if (prob >= 0.85) {
    return {
      level: 'Mastered',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10 border-emerald-500/30',
      badgeClass: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/40',
      description: 'Robust recall with high retention and minimal slip probability.',
    };
  }
  if (prob >= 0.65) {
    return {
      level: 'Competent',
      colorClass: 'text-sky-400',
      bgClass: 'bg-sky-500/10 border-sky-500/30',
      badgeClass: 'text-sky-400 border-sky-500/20 bg-sky-950/40',
      description: 'Good conceptual grasp; occasional reinforcement recommended.',
    };
  }
  if (prob >= 0.40) {
    return {
      level: 'Developing',
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10 border-amber-500/30',
      badgeClass: 'text-amber-400 border-amber-500/20 bg-amber-950/40',
      description: 'Foundational comprehension formed; actively bridging misconceptions.',
    };
  }
  return {
    level: 'Novice',
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10 border-rose-500/30',
    badgeClass: 'text-rose-400 border-rose-500/20 bg-rose-950/40',
    description: 'Requires primary exposition and source-grounded diagnostic drills.',
  };
}

export function computeOverallMastery(concepts: ConceptMastery[]): {
  averageMastery: number;
  masteredCount: number;
  developingCount: number;
  strugglingCount: number;
} {
  if (concepts.length === 0) {
    return { averageMastery: 0, masteredCount: 0, developingCount: 0, strugglingCount: 0 };
  }
  const sum = concepts.reduce((acc, c) => acc + c.currentMastery, 0);
  const averageMastery = Number((sum / concepts.length).toFixed(3));
  const masteredCount = concepts.filter(c => c.currentMastery >= 0.85).length;
  const developingCount = concepts.filter(c => c.currentMastery >= 0.4 && c.currentMastery < 0.85).length;
  const strugglingCount = concepts.filter(c => c.currentMastery < 0.4).length;

  return {
    averageMastery,
    masteredCount,
    developingCount,
    strugglingCount,
  };
}
