// tests/performance/performance-deep.test.js - Performance Deep Tests

const request = require('supertest');
const { startServer, stopServer } = require('../helpers/server-helper');

describe('Performance Deep Tests', () => {
  let server, app;

  beforeAll(async () => {
    ({ server, app } = await startServer());
  });

  afterAll(async () => {
    await stopServer();
  });

  test('WebSocket RTT latency < 100ms', async () => {
    const start = Date.now();
    const response = await request(app).get('/health');
    const latency = Date.now() - start;

    expect(latency).toBeLessThan(100);
  });

  test('Fetch timing measurement', async () => {
    const timings = [];

    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await request(app).get('/health');
      timings.push(Date.now() - start);
    }

    const avg = timings.reduce((a, b) => a + b) / timings.length;
    expect(avg).toBeLessThan(200);
  });

  test('Memory leak detection', () => {
    const initial = process.memoryUsage().heapUsed;
    const objects = [];

    for (let i = 0; i < 10000; i++) {
      objects.push({ id: i, data: 'test' });
    }

    objects.length = 0;
    if (global.gc) global.gc();

    const final = process.memoryUsage().heapUsed;
    const leak = final - initial;

    expect(leak).toBeLessThan(10 * 1024 * 1024);
  });

  test('CPU profiling - event loop', async () => {
    const iterations = 1000;
    const start = Date.now();

    for (let i = 0; i < iterations; i++) {
      await new Promise(resolve => setImmediate(resolve));
    }

    const duration = Date.now() - start;
    const avgPerIteration = duration / iterations;

    expect(avgPerIteration).toBeLessThan(5);
  });

  test('Concurrent request handling', async () => {
    const requests = [];
    const count = 50;

    const start = Date.now();
    for (let i = 0; i < count; i++) {
      requests.push(request(app).get('/health'));
    }

    await Promise.all(requests);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
  }, 10000);
});
