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
exports.clueTrial = exports.clueGeneration = void 0;
const secrets_1 = require("./secrets");
const types_1 = require("./types");
const openai_1 = __importDefault(require("openai"));
const prompt_parts = {
    clue_trial: [
        { role: "system", content: "You are given a set A, of English words. You are also given another English word, W, and a number, N. Output, in order of most similar to least similar, the N words from A that are the most similar to W." },
        { role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nW: watch\n\nN: 2" },
        { role: "assistant", content: "film, cloud" },
        { role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nW: sport\n\nN: 1" },
        { role: "assistant", content: "squash" },
        { role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nW: injury\n\nN: 2" },
        { role: "assistant", content: "snap, ambulance" },
        { role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nW: monarchy\n\nN: 2" },
        { role: "assistant", content: "queen, caesar" },
        { role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nW: vehicle\n\nN: 3" },
        { role: "assistant", content: "ambulance, wagon, trunk" },
        { role: "user", content: "coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nQ: law\n\nN: 2" },
        { role: "assistant", content: "judge, code" },
        { role: "user", content: "coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nQ: animal\n\nN: 3" },
        { role: "assistant", content: "lamb, ant, vet" },
        { role: "user", content: "coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nQ: music\n\nN: 2" },
        { role: "assistant", content: "parade, church" },
        { role: "user", content: "coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nQ: beverage\n\nN: 2" },
        { role: "assistant", content: "coffee, milk" },
        { role: "user", content: "coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nQ: beverage\n\nN: 3" },
        { role: "assistant", content: "coffee, milk, pitcher" },
        { role: "user", content: "coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ]\n\nQ: baseball\n\nN: 2" },
        { role: "assistant", content: "glove, club" },
    ],
    clue_generation: [
        { role: "system", content: "You will be given a set, A, of English words. You will also be given a subset of A, called B. Output one English word, W, that is both not in A and connects the meanings of the words in B while not connecting to any of the meanings of the words in A." },
        { role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nB: film, cloud" },
        { role: "assistant", content: "watch" },
        { role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nB: squash" },
        { role: "assistant", content: "sport" },
        { role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nB: ambulance, snap" },
        { role: "assistant", content: "injury" },
        { role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nB: queen, caesar}" },
        { role: "assistant", content: "monarchy" },
        { role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nB: wagon, trunk, ambulance" },
        { role: "assistant", content: "vehicle" },
        { role: "user", content: "A: coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nB: judge, code" },
        { role: "assistant", content: "law" },
        { role: "user", content: "A: coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nB: ant, vet, lamb" },
        { role: "assistant", content: "animal" },
        { role: "user", content: "A: coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nB: church, organ" },
        { role: "assistant", content: "music" },
        { role: "user", content: "A: coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nB: milk, pitcher, coffee" },
        { role: "assistant", content: "beverage" },
        { role: "user", content: "A: coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nB: kung-fu" },
        { role: "assistant", content: "panda" },
        { role: "user", content: "A: coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nB: milk, coffee" },
        { role: "assistant", content: "beverage" },
    ],
};
const getOpenAI = () => {
    return new openai_1.default({ apiKey: secrets_1.secrets.openai_key });
};
const clueGeneration = (all_words, combinations) => __awaiter(void 0, void 0, void 0, function* () {
    const openai = getOpenAI();
    let full_L = [];
    for (let combination of combinations) {
        const completion = yield openai.chat.completions.create({
            messages: [
                ...prompt_parts.clue_generation,
                { role: "user", content: `A: ${all_words.join(", ")}\n\nB:${combination.join(", ")}` }
            ],
            seed: 69420,
            temperature: 0,
            model: "gpt-3.5-turbo",
        });
        const result = completion.choices[0].message.content;
        if (!result) {
            return (0, types_1.error)("0xcG111241242", types_1.HTTPStatus.BAD_GATEWAY, "Unexpected AI Output Format");
        }
        full_L.push(result);
    }
    return full_L.map((clue_word, i) => {
        return {
            word: clue_word,
            intended: combinations[i],
            quantity: combinations[i].length,
        };
    });
});
exports.clueGeneration = clueGeneration;
const clueTrial = (all_words, clue_options) => __awaiter(void 0, void 0, void 0, function* () {
    let full_P = [];
    const openai = getOpenAI();
    for (let clue of clue_options) {
        const completion = yield openai.chat.completions.create({
            messages: [
                ...prompt_parts.clue_trial,
                { role: "user", content: `A: ${all_words}\n\nW: ${clue.word}\n\nN: ${clue.quantity + 1}` }
            ],
            temperature: 0,
            seed: 69420,
            model: "gpt-3.5-turbo",
        });
        const result = completion.choices[0].message.content;
        if (!result) {
            return (0, types_1.error)("0xcG111241242", types_1.HTTPStatus.BAD_GATEWAY, "Unexpected AI Output Format");
        }
        full_P.push(result.split(/, */g));
    }
    return full_P;
});
exports.clueTrial = clueTrial;
