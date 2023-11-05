import './test-init';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import * as gameFunctions from '../src/game';
import { Game, GameEntity } from '../src/game';
import { db } from '../src/admin';
import * as crypto from 'crypto';
import { dictionary } from '../src/dictionary';
import * as playerService from '../src/player';

describe('game tests', () => {
  it('startGame', async () => {
    const game = await gameFunctions.startGame();

    expect(game.id).to.be.a('string').and.not.be.empty;
    expect(game.board).to.be.an('array').and.have.lengthOf(16);
    game.board.forEach((letter) => {
      expect(letter.score).to.be.a('number').and.be.greaterThan(0);
      expect(letter.char).to.be.a('string').and.have.lengthOf(1);
    });
    expect(game.score).to.equal(0);
    expect(game.wordCount).to.equal(0);
    expect(game.leaderboardRank).to.be.null;
    expect(game.name).to.be.null;
    expect(game.startedAt).to.be.a('number');
    expect(game.endedAt).to.be.null;
    expect(game.endedAndNamed).to.be.false;
  });

  it('guessTheWord correct', async () => {
    // Arrange
    const game = await gameFunctions.startGame();
    const [word, letterIndexes] = await mockWord(game);

    // Act
    const result = await gameFunctions.guessTheWord(game.id, letterIndexes);

    // Assert
    expect(result.word).to.equal(word);
    expect(result.correct).to.be.true;
    expect(result.scoreForWord).to.be.a('number').and.be.greaterThan(0);
    expect(result.scoreForLetters).to.be.a('number').and.be.greaterThan(0);
    expect(result.scoreForLength).to.be.a('number').and.be.greaterThan(0);
    expect(result.scoreForLetters + result.scoreForLength).to.be.equal(
      result.scoreForWord,
    );
    expect(result.game.score).to.be.equal(result.scoreForWord);
    expect(result.game.wordCount).to.be.equal(1);
    expect(result.game.endedAt).to.be.null;
  });

  it('guessTheWord wrong', async () => {
    // Arrange
    const game = await gameFunctions.startGame();
    const [word, letterIndexes] = await mockWord(game, 'wrong');

    // Act
    const result = await gameFunctions.guessTheWord(game.id, letterIndexes);

    // Assert
    expect(result.word).to.equal(word);
    expect(result.correct).to.be.false;
    expect(result.scoreForWord).to.be.a('number').and.be.equal(0);
    expect(result.game.score).to.be.a('number').and.be.equal(0);
    expect(result.game.wordCount).to.be.a('number').and.be.equal(0);
    expect(result.game.endedAt).to.be.null;
  });

  it('gameOver', async () => {
    // Arrange
    const game = await gameFunctions.startGame();
    const [_, letterIndexes] = await mockWord(game);
    const result = await gameFunctions.guessTheWord(game.id, letterIndexes);

    // Act
    const endedGame = await gameFunctions.gameOver(game.id);
    expect(endedGame.score).to.be.equal(result.scoreForWord);
    expect(endedGame.wordCount).to.be.equal(1);
    expect(endedGame.endedAt).to.be.a('number');
    expect(endedGame.leaderboardRank).to.be.a('number');
    expect(endedGame.endedAndNamed).to.be.false;
  });

  it('guessTheWord game ends', async () => {
    // Arrange
    const game = await gameFunctions.startGame();
    const gameEntity: GameEntity = {
      ...game,
      playerUid: null,
      wordCount: 99,
      score: 100,
    };
    await db.collection('games').doc(game.id).set(gameEntity);
    const [_, letterIndexes] = await mockWord(game);

    // Act
    const result = await gameFunctions.guessTheWord(game.id, letterIndexes);
    expect(result.game.wordCount).to.be.equal(100);
    expect(result.game.endedAt).to.be.a('number');
  });

  it('getLeaderboard', async () => {
    // Arrange
    const game = await gameFunctions.startGame();
    const [_, letterIndexes] = await mockWord(game);
    await gameFunctions.guessTheWord(game.id, letterIndexes);
    const endedGame = await gameFunctions.gameOver(game.id);

    const playerUid = crypto.randomUUID().slice(-6);
    const playerName = `Testko_${playerUid}`;
    await playerService.submitProfile(playerUid, playerName);
    await gameFunctions.assignToPlayer(game.id, playerUid);

    // Act
    const leaderboard = await gameFunctions.getLeaderboard();

    // Assert
    expect(leaderboard).to.be.an('array').and.not.be.empty;
    const leaderboardEntry = leaderboard.find((item) => item.id === game.id);
    expect(leaderboardEntry?.name).to.equal(playerName);
    expect(leaderboardEntry?.score).to.equal(endedGame.score);
    leaderboard.forEach((item) => {
      expect(item.endedAt).to.be.a('number');
      expect(item.endedAndNamed).to.be.true;
    });
  });
});

/**
 * Reads the first 5 letters from the game board, optionally adds them to the dictionary and
 * returns their indexes.
 */
async function mockWord(
  game: Game,
  type: 'correct' | 'wrong' = 'correct',
): Promise<[string, number[]]> {
  const word = game.board
    .slice(0, 5)
    .map((letter) => letter.char)
    .join('');
  if (type === 'correct') {
    dictionary.addWord(word);
  }
  return [word, [0, 1, 2, 3, 4]];
}
