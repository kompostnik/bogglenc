import wordsJson from './words.json';
import * as functions from 'firebase-functions';

export class Dictionary {
  private MAX_WORD_LENGTH = 16;
  private words: string[] = wordsJson;

  hasWord(word: string): boolean {
    functions.logger.debug(`Checking word: ${word}`);

    if (!word) {
      throw new Error('Missing word parameter!');
    }

    if (word.length > this.MAX_WORD_LENGTH) {
      throw new Error('Word is too long!');
    }

    return this.words.includes(word.toLowerCase());
  }

  // workaround for tests until we have DI
  addWord(word: string) {
    this.words.push(word);
  }

  wordsByCharacters(characters: string) {
    // Function to create character frequency map
    const createCharFrequency = (str: string) => {
      const frequencyMap = new Map();
      for (const char of str) {
        const count = frequencyMap.has(char) ? frequencyMap.get(char) : 0;
        frequencyMap.set(char, count + 1);
      }
      return frequencyMap;
    };

    const charactersFrequencyMap = createCharFrequency(characters);

    // Filtering words
    return this.words.filter(word => {
      const wordFrequencyMap = createCharFrequency(word);  // Frequency map for each word
      for (const char of word) {
        // Checking if each character frequency matches with characters frequency
        if (charactersFrequencyMap.has(char) && charactersFrequencyMap.get(char) === wordFrequencyMap.get(char)) {
          continue;
        } else {
          return false;  // If frequency doesn't match or character not present in characters, return false
        }
      }
      return true;  // If all characters' frequency match, then return true
    });
  }
}

export const dictionary = new Dictionary();
