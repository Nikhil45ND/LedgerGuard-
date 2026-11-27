import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { acquireLock, releaseLock } from '../src/services/lockService.js';

describe('Distributed Lock Service (services/lockService.js)', () => {

  test('acquires a lock successfully on an unlocked key', async () => {
    const lockKey = 'test:resource:1';
    const lock = await acquireLock(lockKey, 2000);

    assert.equal(lock.acquired, true);
    assert.ok(lock.token);
    assert.equal(typeof lock.release, 'function');

    // Clean up
    await lock.release();
  });

  test('blocks concurrent access to the same key while locked (mutual exclusion)', async () => {
    const lockKey = 'test:resource:concurrent';
    
    // First requester acquires lock
    const firstLock = await acquireLock(lockKey, 2000);
    assert.equal(firstLock.acquired, true);

    // Second concurrent requester tries to acquire the same lock
    const secondLock = await acquireLock(lockKey, 2000);
    assert.equal(secondLock.acquired, false, 'Second lock must be rejected while first is held');
    assert.equal(secondLock.token, null);

    // After first requester releases, the key becomes available again
    await firstLock.release();

    const thirdLock = await acquireLock(lockKey, 2000);
    assert.equal(thirdLock.acquired, true, 'Lock should be acquirable after release');
    await thirdLock.release();
  });

  test('allows simultaneous locks on different keys', async () => {
    const lockA = await acquireLock('test:tenantA:key', 2000);
    const lockB = await acquireLock('test:tenantB:key', 2000);

    assert.equal(lockA.acquired, true);
    assert.equal(lockB.acquired, true);

    await lockA.release();
    await lockB.release();
  });

  test('refuses to release lock if security token does not match', async () => {
    const lockKey = 'test:token:mismatch';
    const lock = await acquireLock(lockKey, 2000);
    assert.equal(lock.acquired, true);

    // Attempt release with invalid token
    const released = await releaseLock(lockKey, 'wrong-bogus-token');
    assert.equal(released, false, 'Must not release with incorrect token');

    // Proper release with correct token succeeds
    const properRelease = await releaseLock(lockKey, lock.token);
    assert.equal(properRelease, true);
  });

});
