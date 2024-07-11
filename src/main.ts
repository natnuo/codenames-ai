import express from "express";
import { HTTPStatus, isError, processWordListParam, Word } from "./types";
import { generateCombinations, getClueScore } from "./internal";
import { clueGeneration, clueTrial } from "./prompts";

const PORT = 3000;

const app = express();

// approximate maximum cost per game playing as both teams' operatives: $0.0002125
app.get("/api/generate-operative-move/:all_words/:clue_word/:clue_number/:reguesses_us/:reguesses_them/:us/:them", async (req, res) => {
  // Filter Inputs
  let params: {
    all_words: Word[],
    clue_word: Word,
    clue_number: number,
    reguesses_us: Word[],
    reguesses_them: Word[],
    us: number,
    them: number
  } = {
    all_words: processWordListParam(req.params.all_words),
    clue_word: req.params.clue_word,
    clue_number: parseInt(req.params.clue_number),
    reguesses_us: processWordListParam(req.params.reguesses_us),
    reguesses_them: processWordListParam(req.params.reguesses_them),
    us: parseInt(req.params.us),
    them: parseInt(req.params.them)
  }

  const trial_outputs = await clueTrial(params.all_words, [{word: params.clue_word, quantity: params.clue_number}]);

  if (isError(trial_outputs)) {
    console.log(trial_outputs);
    res.sendStatus(trial_outputs.status);
    return;
  }

  let guesses = [
    ...trial_outputs[0].slice(0, -1)
  ];

  params.reguesses_us = params.reguesses_us.filter((s) => {
    return !guesses.includes(s) && params.all_words.includes(s);
  });

  let rgs: Word[] = [];
  if (params.us > params.them && params.reguesses_us.length > 0) {
    rgs = [<Word>params.reguesses_us.shift()];
  }

  guesses.push(...rgs);

  let next_links = [];

  for (let i=0;i<=guesses.length;i++) {
    params.all_words = i > 0 ? params.all_words.filter((v) => { return v !== guesses[i] }) : params.all_words;
    next_links.push(
      `${process.env.HOSTNAME ?? "localhost:3000"}/api/generate-operative-move/${params.all_words}/INSERT_CLUE_WORD/INSERT_CLUE_NUMBER/ ${params.reguesses_them}/ ${
        [...trial_outputs[0].slice(i+1), ...params.reguesses_us]
      }/${params.them}/${params.us - i}`
    );
  }

  res.send({
    guesses: [...new Set(guesses)],
    next_links
  });
});

// approximate maximum cost per game playing as both teams' spymasters: $0.063
app.get("/api/generate-spymaster-move/:good_cards/:bad_cards/:neutral_cards/:assassin_cards", async (req, res) => {
  // Filter Inputs
  let params: {
    good_cards: Word[],
    bad_cards: Word[],
    neutral_cards: Word[],
    assassin_cards: Word[],
    risk_factor?: number
  } = {
    good_cards: processWordListParam(req.params.good_cards),
    bad_cards: processWordListParam(req.params.bad_cards),
    neutral_cards: processWordListParam(req.params.neutral_cards),
    assassin_cards: processWordListParam(req.params.assassin_cards),
  }

  params.risk_factor = (params.good_cards.length - params.bad_cards.length) / (params.bad_cards.length);

  // if (Number.isNaN(params.risk_factor)) {
  //   console.log("Scores are is not all numbers",);
  //   res.sendStatus(HTTPStatus.BAD_REQUEST);
  //   return;
  // }

  if (params.good_cards.length === 0 || params.bad_cards.length === 0) {
    console.log("Either no good cards or no bad cards", params.good_cards, params.bad_cards);
    res.sendStatus(HTTPStatus.BAD_REQUEST);
    return;
  }

  const all_words: Word[] = [
    ...params.good_cards,
    ...params.bad_cards,
    ...params.neutral_cards,
    ...params.assassin_cards
  ];

  if (
    new Set(all_words).size !== all_words.length
  ) {
    console.log("Duplicate words inputted");
    res.sendStatus(HTTPStatus.BAD_REQUEST);
    return;
  }

  if (all_words.length > 25) {
    console.log("Too many words");
    res.sendStatus(HTTPStatus.BAD_REQUEST);
    return;
  }

  const combinations = generateCombinations(params.good_cards);

  console.log("combinations", combinations);

  const clue_options = await clueGeneration(all_words, combinations);

  console.log("clue_options", clue_options);

  if (isError(clue_options)) {
    console.log(clue_options);
    res.sendStatus(clue_options.status);
    return;
  }
  if (clue_options.length === 0) {
    console.log("clue_options is of zero length... did chatgpt output in an unexpected format?");
    res.sendStatus(HTTPStatus.INTERNAL_SERVER_ERROR);
    return;
  }

  const trial_outputs = await clueTrial(all_words, clue_options);

  console.log("trial_outputs", trial_outputs);

  if (isError(trial_outputs)) {
    console.log(trial_outputs);
    res.sendStatus(trial_outputs.status);
    return;
  }
  
  let max_clue = clue_options[0], max_score = Number.NEGATIVE_INFINITY, max_trial = trial_outputs[0];
  for (let i=0;i<trial_outputs.length;i++) {
    const score = getClueScore(clue_options[i], trial_outputs[i], params.good_cards, params.bad_cards, params.neutral_cards, params.assassin_cards, params.risk_factor);
    
    if (score > max_score) {
      max_clue = clue_options[i];
      max_trial = trial_outputs[i];
      max_score = score;
    }
  }

  res.send({ ...max_clue, score: max_score, max_trial });
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
