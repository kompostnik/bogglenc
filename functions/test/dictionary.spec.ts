import './test-init';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { dictionary } from '../src/dictionary';

describe('dictionary tests', () => {
  it('check word', async () => {
    expect(dictionary.hasWord('zvonček')).to.be.true;
    expect(dictionary.hasWord('asdfasdfasdf')).to.be.false;
  });

  it('find word by characters', async () => {
    expect(dictionary.wordsByCharacters('vonekzč')).to.not.be.empty;
    expect(dictionary.wordsByCharacters('xxxxxxx')).to.be.empty;
  });

  it('find words by character count', async () => {
    const words = dictionary.wordsByCharacters('ipnzjtkažčrleuii');
    expect(words).not.to.contain('abece')
    expect(words).to.contain('krt')
  });
});
