import { secrets } from "./secrets";
import { AnsweredClue, Clue, error, ERROR, HTTPStatus, isError, mutateError, Word } from "./types";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

const prompt_parts: {
  clue_trial: ChatCompletionMessageParam[],
  clue_generation: ChatCompletionMessageParam[],
} = {
  clue_trial: [
    {role: "system", content: "You are given a set A, of English words. You are also given another English word, W, and a number, N. Output, in order of most similar to least similar, the N words from A that are the most similar to W."},
    {role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nW: watch\n\nN: 2"},
    {role: "assistant", content: "film, cloud"},
    {role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nW: sport\n\nN: 1"},
    {role: "assistant", content: "squash"},
    {role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nW: injury\n\nN: 2"},
    {role: "assistant", content: "snap, ambulance"},
    {role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nW: monarchy\n\nN: 2"},
    {role: "assistant", content: "queen, caesar"},
    {role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nW: vehicle\n\nN: 3"},
    {role: "assistant", content: "ambulance, wagon, trunk"},
    {role: "user", content: "coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nQ: law\n\nN: 2"},
    {role: "assistant", content: "judge, code"},
    {role: "user", content: "coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nQ: animal\n\nN: 3"},
    {role: "assistant", content: "lamb, ant, vet"},
    {role: "user", content: "coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nQ: music\n\nN: 2"},
    {role: "assistant", content: "parade, church"},
    {role: "user", content: "coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nQ: beverage\n\nN: 2"},
    {role: "assistant", content: "coffee, milk"},
    {role: "user", content: "coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nQ: beverage\n\nN: 3"},
    {role: "assistant", content: "coffee, milk, pitcher"},
    {role: "user", content: "coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ]\n\nQ: baseball\n\nN: 2"},
    {role: "assistant", content: "glove, club"},
  ],
  clue_generation: [
    {role: "system", content: "You will be given a set, A, of English words. You will also be given a subset of A, called B. Output one English word, W, that is both not in A and connects the meanings of the words in B while not connecting to any of the meanings of the words in A."},
    {role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nB: film, cloud"},
    {role: "assistant", content: "watch"},
    {role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nB: squash"},
    {role: "assistant", content: "sport"},
    {role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nB: ambulance, snap"},
    {role: "assistant", content: "injury"},
    {role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nB: queen, caesar}"},
    {role: "assistant", content: "monarchy"},
    {role: "user", content: "A: boot, chick, squash, ambulance, egg, rust, queen, pillow, film, bikini, driver, panda, date, caesar, wagon, trunk, rose, snap, cross, dice, himalayas, mail, rock, cloud, potter\n\nB: wagon, trunk, ambulance"},
    {role: "assistant", content: "vehicle"},
    {role: "user", content: "A: coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nB: judge, code"},
    {role: "assistant", content: "law"},
    {role: "user", content: "A: coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nB: ant, vet, lamb"},
    {role: "assistant", content: "animal"},
    {role: "user", content: "A: coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nB: church, organ"},
    {role: "assistant", content: "music"},
    {role: "user", content: "A: coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nB: milk, pitcher, coffee"},
    {role: "assistant", content: "beverage"},
    {role: "user", content: "A: coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nB: kung-fu"},
    {role: "assistant", content: "panda"},
    {role: "user", content: "A: coffee, ring, wing, pitcher, geyser, kung-fu, ant, part, lamb, ear, church, olympus, glove, parade, code, milk, club, satellite, sumo, step, vet, mill, judge, pad, organ\n\nB: milk, coffee"},
    {role: "assistant", content: "beverage"},
  ],
};

const getOpenAI = () => {
  return new OpenAI({ apiKey: secrets.openai_key });
}

export const clueGeneration = async (all_words: Word[], combinations: Word[][]): Promise<AnsweredClue[] | ERROR> => {  
  const openai = getOpenAI();

  let full_L = [];

  for (let combination of combinations) {
    const completion = await openai.chat.completions.create({
      messages: [
        ...prompt_parts.clue_generation,
        {role: "user", content: `A: ${
          all_words.join(", ")
        }\n\nB:${
          combination.join(", ")
        }`}
      ],
      seed: 69420,
      temperature: 0,
      model: "gpt-3.5-turbo",
    });
  
    const result = completion.choices[0].message.content;
  
    if (!result) {
      return error("0xcG111241242", HTTPStatus.BAD_GATEWAY, "Unexpected AI Output Format");
    }

    full_L.push(result);
  }

  return full_L.map((clue_word, i) => {
    return <AnsweredClue>{
      word: clue_word,
      intended: combinations[i],
      quantity: combinations[i].length,
    };
  });
};

export const clueTrial = async (all_words: Word[], clue_options: Clue[]): Promise<Word[][] | ERROR> => {
  let full_P = [];
  
  const openai = getOpenAI();

  for (let clue of clue_options) {
    const completion = await openai.chat.completions.create({
      messages: [
        ...prompt_parts.clue_trial,
        {role: "user", content: `A: ${
          all_words
        }\n\nW: ${clue.word}\n\nN: ${clue.quantity + 1}`}
      ],
      temperature: 0,
      seed: 69420,
      model: "gpt-3.5-turbo",
    });
  
    const result = completion.choices[0].message.content;
  
    if (!result) {
      return error("0xcG111241242", HTTPStatus.BAD_GATEWAY, "Unexpected AI Output Format");
    }

    full_P.push(result.split(/, */g));
  }

  return full_P;
};





