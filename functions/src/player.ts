import { db } from './admin';
import { Game, GameEntity } from './game';
import { entityToGame, entityToPlayerProfile } from './mappers';

export interface PlayerProfile {
  nickname: string;
  topGame?: Game;
}

export interface PlayerProfileEntity extends PlayerProfile {
  uid: string;
  nicknameLowercase: string;
}

export const ERR_NICKNAME_INVALID = 'Invalid nickname!';
export const ERR_NICKNAME_TAKEN = 'Nickname already taken!';

export async function readProfile(
  nickname: string,
): Promise<PlayerProfile | null> {
  const playerProfileEntity = await readProfileEntity(nickname);
  return playerProfileEntity
    ? entityToPlayerProfile(playerProfileEntity)
    : null;
}

export async function readProfileEntity(
  nickname: string,
): Promise<PlayerProfileEntity | null> {
  const nicknameLowercase = nickname.trim().toLowerCase();

  const playerProfileEntity: PlayerProfileEntity = (
    await db
      .collection('players')
      .where('nicknameLowercase', '==', nicknameLowercase)
      .limit(1)
      .get()
  ).docs[0]?.data() as PlayerProfileEntity;

  return playerProfileEntity ?? null;
}

export async function readProfileByUid(
  uid: string,
): Promise<PlayerProfile | null> {
  const playerProfileEntity = await readProfileEntityByUid(uid);
  return playerProfileEntity
    ? entityToPlayerProfile(playerProfileEntity)
    : null;
}

export async function readProfileEntityByUid(
  uid: string,
): Promise<PlayerProfileEntity | null> {
  const playerProfileEntity: PlayerProfileEntity = (
    await db.collection('players').doc(uid).get()
  ).data() as PlayerProfileEntity;
  return playerProfileEntity ?? null;
}

export async function submitProfile(
  uid: string,
  nickname: string,
): Promise<PlayerProfile> {
  const nicknameTrimmed = nickname.trim();

  const valid = /^([\w\\.]{1,20})$/.test(nicknameTrimmed);
  if (!valid) {
    throw ERR_NICKNAME_INVALID;
  }

  const nicknameLowercase = nicknameTrimmed.toLowerCase();

  const playersByNickname = (
    await db
      .collection('players')
      .where('nicknameLowercase', '==', nicknameLowercase)
      .count()
      .get()
  ).data().count;

  if (playersByNickname > 0) {
    throw ERR_NICKNAME_TAKEN;
  }

  const existingPlayerProfileEntity = (
    await db.collection('players').doc(uid).get()
  )?.data() as PlayerProfileEntity;

  let playerProfileEntity: PlayerProfileEntity;
  if (existingPlayerProfileEntity) {
    playerProfileEntity = {
      ...existingPlayerProfileEntity,
      nickname: nicknameTrimmed,
      nicknameLowercase,
    };
    // TODO update names in all player's games
  } else {
    playerProfileEntity = {
      uid,
      nickname: nicknameTrimmed,
      nicknameLowercase,
    };
  }

  await db.collection('players').doc(uid).set(playerProfileEntity);

  return entityToPlayerProfile(playerProfileEntity);
}

export async function updateTopGame(game: GameEntity): Promise<PlayerProfile> {
  if (!game.playerUid) {
    throw new Error('Game has no playerUid!');
  }

  const playerProfileEntity = await readProfileEntityByUid(game.playerUid);
  if (!playerProfileEntity) {
    throw new Error('Player not found!');
  }

  if (
    !playerProfileEntity.topGame ||
    game.score > playerProfileEntity.topGame.score
  ) {
    playerProfileEntity.topGame = entityToGame(game);
    await db
      .collection('players')
      .doc(playerProfileEntity.uid)
      .set(playerProfileEntity);
  }

  return entityToPlayerProfile(playerProfileEntity);
}
