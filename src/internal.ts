import { AnsweredClue, Word } from "./types";

export const generateCombinations = (good_cards: Word[]): Word[][] => {
  const slow_queue: Word[][] = []

  const result = [];
  const seen = new Set<string>();

  slow_queue.push(good_cards);
  result.push(slow_queue[0]);
  seen.add(good_cards.join(","));

  while (slow_queue.length) {
    const next_comb = slow_queue.shift();
    if (!next_comb) break;

    if (next_comb.length <= 1) continue;

    for (let exclude=0;exclude<next_comb.length;exclude++) {
      const child = [...next_comb.slice(0, exclude), ...next_comb.slice(exclude + 1)];
      const hashable = child.join(",");

      if (seen.has(hashable)) continue;
      result.push(child);
      seen.add(hashable);
      slow_queue.push(child);
    }
  }

  return [...result];
};

export const getClueScore = (clue: AnsweredClue, trial_output: Word[], good_cards: Word[], bad_cards: Word[], neutral_cards: Word[], assassin_cards: Word[], risk_factor: number): number => {
  const good_set = new Set(good_cards);
  const bad_set = new Set(bad_cards);
  const neutral_set = new Set(neutral_cards);
  const assassin_set = new Set(assassin_cards);
  const intended_set = new Set(clue.intended);

  const n = trial_output.length;

  if (n !== clue.intended.length + 1) return Number.NEGATIVE_INFINITY;
  
  let risk = 0;

  for (let i=0;i<n-1;i++) {
    const word = trial_output[i];
    const rsf = Math.pow((n - i - 1) / (n - 1), 2);
    if (good_set.has(word)) risk += 0.5 + 0.5 * rsf;             // 1.0  --> 0.5
    else if (neutral_set.has(word)) risk += 4.0 + 6.0 * rsf;     // 8.0  --> 4.0
    else if (bad_set.has(word)) risk += 8.0 + 8.0 * rsf;         // 12.0  --> 8.0
    else if (assassin_set.has(word)) risk += 30.0 + 10.0 * rsf;  // 40.0 --> 30.0
  }

  if (intended_set.has(trial_output[n - 1])) risk -= 0.5;

  return n - (1 - risk_factor) * risk - 1;
};
