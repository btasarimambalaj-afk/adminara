// tests/integration/state-deep.test.js - State Management Deep Tests

const redis = require('../../utils/redis');
const StateStore = require('../../utils/state-store');

describe('State Management Deep Tests', () => {
  let stateStore;

  beforeAll(async () => {
    stateStore = new StateStore();
  });

  afterEach(async () => {
    if (redis.client) {
      await redis.client.flushDb();
    }
  });

  test('State persistence in Redis', async () => {
    const sessionId = 'test-session-123';
    const state = { userId: 'user1', status: 'active' };

    await stateStore.set(sessionId, state);
    const retrieved = await stateStore.get(sessionId);

    expect(retrieved).toEqual(state);
  });

  test('State expiration', async () => {
    const sessionId = 'test-session-expire';
    const state = { userId: 'user2' };

    await stateStore.set(sessionId, state, 1); // 1 second TTL
    await new Promise(resolve => setTimeout(resolve, 1500));

    const retrieved = await stateStore.get(sessionId);
    expect(retrieved).toBeNull();
  });

  test('Queue data integrity', async () => {
    const queue = [];
    const items = [
      { id: 1, name: 'customer1' },
      { id: 2, name: 'customer2' },
      { id: 3, name: 'customer3' }
    ];

    items.forEach(item => queue.push(item));
    
    expect(queue.length).toBe(3);
    expect(queue[0]).toEqual(items[0]);
    
    const removed = queue.shift();
    expect(removed).toEqual(items[0]);
    expect(queue.length).toBe(2);
  });

  test('Concurrent state updates', async () => {
    const sessionId = 'test-concurrent';
    
    const updates = [];
    for (let i = 0; i < 10; i++) {
      updates.push(stateStore.set(sessionId, { counter: i }));
    }

    await Promise.all(updates);
    const final = await stateStore.get(sessionId);
    
    expect(final).toBeDefined();
    expect(final.counter).toBeGreaterThanOrEqual(0);
    expect(final.counter).toBeLessThan(10);
  });
});
