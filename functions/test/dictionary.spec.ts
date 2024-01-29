import './test-init';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { dictionary } from '../src/dictionary';

describe('dictionary tests', () => {
  it('check word', async () => {
    console.time('check word execution time');

    expect(dictionary.hasWord('zvonček')).to.be.true;
    expect(dictionary.hasWord('asdfasdfasdf')).to.be.false;

    console.timeEnd('check word execution time');
  });

  it('find word by characters', async () => {
    console.time('find word by characters execution time');

    expect(dictionary.wordsByCharacters('vonekzč')).to.not.be.empty;
    expect(dictionary.wordsByCharacters('xxxxxxx')).to.be.empty;

    console.timeEnd('find word by characters execution time');
  });


  it('find words by character count', async () => {
    console.time('find words by character count execution time');

    const words = dictionary.wordsByCharacters('ipnzjtkažčrleuii');
    expect(words).not.to.contain('abece')
    expect(words).to.contain('krt');

    console.timeEnd('find words by character count execution time');
  });
});