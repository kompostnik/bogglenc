import wordsJson from './words.json';
import * as functions from 'firebase-functions';

export class Dictionary {
  private MAX_WORD_LENGTH = 16;
  private words: string[] = wordsJson;

  private createCharFrequency(str: string): Map<string, number> {
    const frequencyMap = new Map();
    for (const char of str) {
      const count = frequencyMap.get(char) || 0;
      frequencyMap.set(char, count + 1);
    }
    return frequencyMap;
  }

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

  public wordsByCharacters(characters: string): string[] {
    // Filter out words that are definitely too long
    const viableWords = this.words.filter(word => word.length <= characters.length);

    // Create a set of characters for constant lookups
    const charsSet = new Set(characters);

    // Create the frequency map of the character string
    const charactersFrequencyMap = this.createCharFrequency(characters);

    // Filter the words
    return viableWords.filter(word => {
      // Check each character of the word
      for (const char of word) {
        // If character is not present in the set or its frequency is larger than in characters string, drop the word
        if (!charsSet.has(char) || ((charactersFrequencyMap.get(char) || 0) < this.countCharacterInString(char, word))) {
          return false;  // Early rejection
        }
      }
      return true;
    });
  }

  private countCharacterInString(char: string, word: string): number {
    return Array.from(word).filter(c => c === char).length;
  }
}

export const dictionary = new Dictionary();
