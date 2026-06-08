export interface Score {
  home: number;
  away: number;
}

export type Outcome = "home" | "away" | "draw";

export function getOutcome(score: Score): Outcome {
  if (score.home > score.away) return "home";
  if (score.home < score.away) return "away";
  return "draw";
}

export function calculatePoints(prediction: Score, actual: Score): number {
  // Exact score: 10 points
  if (prediction.home === actual.home && prediction.away === actual.away) {
    return 10;
  }

  const predictedOutcome = getOutcome(prediction);
  const actualOutcome = getOutcome(actual);
  const oneTeamCorrect =
    prediction.home === actual.home || prediction.away === actual.away;

  // Wrong outcome
  if (predictedOutcome !== actualOutcome) {
    return oneTeamCorrect ? 1 : 0;
  }

  // Correct outcome: 5 base points
  let points = 5;

  // +2 if goal difference also correct
  const predDiff = prediction.home - prediction.away;
  const actualDiff = actual.home - actual.away;
  if (predDiff === actualDiff) points += 2;

  // +1 if exact goals for one team (but not exact score, already handled above)
  if (oneTeamCorrect) points += 1;

  return points;
}

export function pointsBreakdown(prediction: Score, actual: Score): string {
  const pts = calculatePoints(prediction, actual);
  if (pts === 10) return "Exact score!";
  if (pts === 0) return "Nothing correct";
  if (pts === 1) return "1 team score correct";

  const parts: string[] = ["Correct outcome"];
  const predDiff = prediction.home - prediction.away;
  const actualDiff = actual.home - actual.away;
  if (predDiff === actualDiff) parts.push("correct goal diff");
  if (prediction.home === actual.home || prediction.away === actual.away)
    parts.push("1 team score correct");
  return parts.join(" + ");
}
