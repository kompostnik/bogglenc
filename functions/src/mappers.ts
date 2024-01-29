import { Game, GameEntity } from './game';
import { PlayerProfile, PlayerProfileEntity } from './player';

export function entityToGame(gameEntity: GameEntity): Game {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { playerUid, ...game } = gameEntity;
  return game;
}

export function entityToPlayerProfile(
  entity: PlayerProfileEntity,
): PlayerProfile {
  return {
    nickname: entity.nickname,
    topGame: entity.topGame,
  };
}
