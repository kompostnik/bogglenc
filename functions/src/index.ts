import * as functions from 'firebase-functions';
import cors from 'cors';
import * as gameService from './game';
import * as playerService from './player';

/**
 * Starts a new game.
 * Use GET.
 *
 * @returns {Game}
 */
export const startGame = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    cors()(req, res, async () => {
      const game = await gameService.startGame();
      res.status(200).json(game);
    });
  });

/**
 * Ends the game.
 * Use POST or PUT.
 * Expected request body:
 * <pre>
 * { gameId: string; }
 * </pre>
 *
 * @returns {Game}
 */
export const gameOver = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    cors()(req, res, async () => {
      const requestData = req.body as {
        gameId: string;
      };

      const game = await gameService.gameOver(requestData.gameId);

      functions.logger.info(`Ended the game: ${game.id}`, game);

      res.status(200).send(game);
    });
  });

/**
 * Verifies a word and updates the game state.
 * Use POST or PUT.
 * Expected request body:
 * <pre>
 * { gameId: string; letterIndexes: number[]; }
 * </pre>
 *
 * @returns {CheckWordResult}
 */
export const guessTheWord = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    cors()(req, res, async () => {
      const requestData = req.body as {
        gameId: string;
        letterIndexes: number[];
      };

      const result = await gameService.guessTheWord(
        requestData.gameId,
        requestData.letterIndexes,
      );

      functions.logger.info(`Guessing the word: ${result.word}`, result);

      res.status(200).send(result);
    });
  });

/**
 * List up to 50 top games where names were submitted.
 * Use GET
 * @returns {Game[]}
 */
export const getLeaderboard = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    cors()(req, res, async () => {
      const leaderboard = await gameService.getLeaderboard();
      res.status(200).send(leaderboard);
    });
  });

/**
 * Reads a player's profile
 * Use POST or PUT.
 * Expected request body:
 * <pre>
 * { nickname: string; }
 * </pre>
 *
 * @returns {PlayerProfile}
 *  or HTTP status 409 if nickname does not exist
 */
export const readPlayerProfile = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    cors()(req, res, async () => {
      const requestData = req.body as {
        nickname: string;
      };

      functions.logger.info('Reading player profile: ', requestData);

      const result = await playerService.readProfile(requestData.nickname);

      if (result) {
        res.status(200).send(result);
      } else {
        res.status(404).send();
      }
    });
  });

/**
 * Creates or updates a player's profile.
 * Use POST or PUT.
 * Expected request body:
 * <pre>
 * { uid: string; nickname: string; }
 * </pre>
 *
 * @returns {PlayerProfile}
 *  or HTTP status 409 if nickname is taken
 *  or HTTP status 400 if nickname is not valid (length, allowed characters)
 */
export const submitPlayerProfile = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    cors()(req, res, async () => {
      const requestData = req.body as {
        uid: string;
        nickname: string;
      };

      functions.logger.info('Submitting player profile: ', requestData);

      try {
        const result = await playerService.submitProfile(
          requestData.uid,
          requestData.nickname,
        );
        res.status(200).send(result);
      } catch (err) {
        if (err === playerService.ERR_NICKNAME_TAKEN) {
          res.status(409).send(err);
        } else if (err === playerService.ERR_NICKNAME_INVALID) {
          res.status(400).send(err);
        }
      }
    });
  });

/**
 * Associates a game with a player
 * Use POST or PUT.
 * Expected request body:
 * <pre>
 * { gameId: string; playerUid: string; }
 * </pre>
 *
 * @returns {Game}
 */
export const assignGameToPlayer = functions
  .region('europe-west1')
  .https.onRequest((req, res) => {
    cors()(req, res, async () => {
      const requestData = req.body as {
        gameId: string;
        playerUid: string;
      };

      functions.logger.info('Assigning game to player: ', requestData);

      const result = await gameService.assignToPlayer(
        requestData.gameId,
        requestData.playerUid,
      );

      functions.logger.info('Assigned game to player: ', result);

      res.status(200).send(result);
    });
  });
