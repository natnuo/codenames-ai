"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const types_1 = require("./types");
const internal_1 = require("./internal");
const prompts_1 = require("./prompts");
const PORT = 3000;
const app = (0, express_1.default)();
// approximate maximum cost per game playing as both teams' operatives: $0.0002125
app.get("/api/generate-operative-move/:all_words/:clue_word/:clue_number/:reguesses_us/:reguesses_them/:us/:them", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Filter Inputs
    let params = {
        all_words: (0, types_1.processWordListParam)(req.params.all_words),
        clue_word: req.params.clue_word,
        clue_number: parseInt(req.params.clue_number),
        reguesses_us: (0, types_1.processWordListParam)(req.params.reguesses_us),
        reguesses_them: (0, types_1.processWordListParam)(req.params.reguesses_them),
        us: parseInt(req.params.us),
        them: parseInt(req.params.them)
    };
    const trial_outputs = yield (0, prompts_1.clueTrial)(params.all_words, [{ word: params.clue_word, quantity: params.clue_number }]);
    if ((0, types_1.isError)(trial_outputs)) {
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
    let rgs = [];
    if (params.us > params.them && params.reguesses_us.length > 0) {
        rgs = [params.reguesses_us.shift()];
    }
    guesses.push(...rgs);
    let next_links = [];
    for (let i = 0; i <= guesses.length; i++) {
        params.all_words = i > 0 ? params.all_words.filter((v) => { return v !== guesses[i]; }) : params.all_words;
        next_links.push(`${(_a = process.env.HOSTNAME) !== null && _a !== void 0 ? _a : "localhost:3000"}/api/generate-operative-move/${params.all_words}/INSERT_CLUE_WORD/INSERT_CLUE_NUMBER/ ${params.reguesses_them}/ ${[...trial_outputs[0].slice(i + 1), ...params.reguesses_us]}/${params.them}/${params.us - i}`);
    }
    res.send({
        guesses: [...new Set(guesses)],
        next_links
    });
}));
// approximate maximum cost per game playing as both teams' spymasters: $0.063
app.get("/api/generate-spymaster-move/:good_cards/:bad_cards/:neutral_cards/:assassin_cards", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Filter Inputs
    let params = {
        good_cards: (0, types_1.processWordListParam)(req.params.good_cards),
        bad_cards: (0, types_1.processWordListParam)(req.params.bad_cards),
        neutral_cards: (0, types_1.processWordListParam)(req.params.neutral_cards),
        assassin_cards: (0, types_1.processWordListParam)(req.params.assassin_cards),
    };
    params.risk_factor = (params.good_cards.length - params.bad_cards.length) / (params.bad_cards.length);
    // if (Number.isNaN(params.risk_factor)) {
    //   console.log("Scores are is not all numbers",);
    //   res.sendStatus(HTTPStatus.BAD_REQUEST);
    //   return;
    // }
    if (params.good_cards.length === 0 || params.bad_cards.length === 0) {
        console.log("Either no good cards or no bad cards", params.good_cards, params.bad_cards);
        res.sendStatus(types_1.HTTPStatus.BAD_REQUEST);
        return;
    }
    const all_words = [
        ...params.good_cards,
        ...params.bad_cards,
        ...params.neutral_cards,
        ...params.assassin_cards
    ];
    if (new Set(all_words).size !== all_words.length) {
        console.log("Duplicate words inputted");
        res.sendStatus(types_1.HTTPStatus.BAD_REQUEST);
        return;
    }
    if (all_words.length > 25) {
        console.log("Too many words");
        res.sendStatus(types_1.HTTPStatus.BAD_REQUEST);
        return;
    }
    const combinations = (0, internal_1.generateCombinations)(params.good_cards);
    console.log("combinations", combinations);
    const clue_options = yield (0, prompts_1.clueGeneration)(all_words, combinations);
    console.log("clue_options", clue_options);
    if ((0, types_1.isError)(clue_options)) {
        console.log(clue_options);
        res.sendStatus(clue_options.status);
        return;
    }
    if (clue_options.length === 0) {
        console.log("clue_options is of zero length... did chatgpt output in an unexpected format?");
        res.sendStatus(types_1.HTTPStatus.INTERNAL_SERVER_ERROR);
        return;
    }
    const trial_outputs = yield (0, prompts_1.clueTrial)(all_words, clue_options);
    console.log("trial_outputs", trial_outputs);
    if ((0, types_1.isError)(trial_outputs)) {
        console.log(trial_outputs);
        res.sendStatus(trial_outputs.status);
        return;
    }
    let max_clue = clue_options[0], max_score = Number.NEGATIVE_INFINITY, max_trial = trial_outputs[0];
    for (let i = 0; i < trial_outputs.length; i++) {
        const score = (0, internal_1.getClueScore)(clue_options[i], trial_outputs[i], params.good_cards, params.bad_cards, params.neutral_cards, params.assassin_cards, params.risk_factor);
        if (score > max_score) {
            max_clue = clue_options[i];
            max_trial = trial_outputs[i];
            max_score = score;
        }
    }
    res.send(Object.assign(Object.assign({}, max_clue), { score: max_score, max_trial }));
}));
app.listen(PORT, () => {
    console.log("Listening on port", PORT);
});
