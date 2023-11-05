import './test-init';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { dictionary } from '../src/dictionary';

describe('dictionary tests', () => {
  it('check word', async () => {
    expect(dictionary.hasWord('zvonček')).to.be.true;
    expect(dictionary.hasWord('asdfasdfasdf')).to.be.false;
  });
});
