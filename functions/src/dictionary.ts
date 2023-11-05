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
}

export const dictionary = new Dictionary();
