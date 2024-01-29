import './test-init';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import * as playerService from '../src/player';
import { PlayerProfileEntity } from '../src/player';
import * as crypto from 'crypto';
import { db } from '../src/admin';

describe('player profile tests', () => {
  it('createProfile', async () => {
    // Arrange
    const uid = crypto.randomUUID();
    const nickname =
      '   TEST_' + crypto.randomUUID().replace(/-/g, '').substring(0, 15);

    // Act
    const playerProfile = await playerService.submitProfile(uid, nickname);

    // Assert
    expect(playerProfile.nickname).to.equal(nickname.trim());
    const entity: PlayerProfileEntity = (
      await db.collection('players').doc(uid).get()
    ).data() as PlayerProfileEntity;
    expect(entity.uid).to.equal(uid);
    expect(entity.nickname).to.equal(nickname.trim());
    expect(entity.nicknameLowercase).to.equal(
      nickname.trim().toLocaleLowerCase(),
    );
  });

  it('createProfile (duplicate)', async () => {
    const uid1 = crypto.randomUUID();
    const nickname = crypto.randomUUID().replace(/-/g, '').substring(0, 20);
    await playerService.submitProfile(uid1, nickname);

    const uid2 = crypto.randomUUID();
    try {
      await playerService.submitProfile(uid2, nickname);
    } catch (err) {
      expect(err).to.equal('Nickname already taken!');
    }
  });

  it('createProfile (update existing profile)', async () => {
    const uid = crypto.randomUUID();
    const nickname1 = crypto.randomUUID().replace(/-/g, '').substring(0, 20);
    await playerService.submitProfile(uid, nickname1);

    const nickname2 = crypto.randomUUID().replace(/-/g, '').substring(0, 20);
    const playerProfile = await playerService.submitProfile(uid, nickname2);

    expect(playerProfile.nickname).to.equal(nickname2);
  });

  it('createProfile (nickname too long)', async () => {
    const uid = crypto.randomUUID();
    const nickname = 'a'.repeat(21);

    try {
      await playerService.submitProfile(uid, nickname);
    } catch (err) {
      expect(err).to.equal('Invalid nickname!');
    }
  });

  it('createProfile (nickname has invalid characters)', async () => {
    const uid = crypto.randomUUID();
    const nickname = 'John!!!';

    try {
      await playerService.submitProfile(uid, nickname);
    } catch (err) {
      expect(err).to.equal('Invalid nickname!');
    }
  });

  it('readProfile ', async () => {
    const uid = crypto.randomUUID();
    const nickname =
      '   TEST_' + crypto.randomUUID().replace(/-/g, '').substring(0, 15);
    await playerService.submitProfile(uid, nickname);

    const playerProfile = await playerService.readProfile(nickname);

    expect(playerProfile?.nickname).to.equal(nickname.trim());
  });

  it('readProfile (not found)', async () => {
    const nickname = crypto.randomUUID().replace(/-/g, '').substring(0, 20);

    const playerProfile = await playerService.readProfile(nickname);

    expect(playerProfile).to.be.null;
  });
});
