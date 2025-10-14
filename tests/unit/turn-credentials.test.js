const { generateTurnCredentials, getICEServers } = require('../../utils/turn-credentials');

describe('TURN Credentials', () => {
  test('should generate dynamic credentials with TTL', () => {
    const secret = 'test-secret';
    const ttl = 300;
    const creds = generateTurnCredentials(secret, ttl);
    
    expect(creds.username).toMatch(/^\d+:hayday$/);
    expect(creds.credential).toBeDefined();
    expect(creds.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(creds.ttl).toBe(300);
  });
  
  test('should use default TTL of 300s', () => {
    const creds = generateTurnCredentials('secret');
    expect(creds.ttl).toBe(300);
  });
  
  test('should generate different credentials each time', () => {
    const creds1 = generateTurnCredentials('secret');
    const creds2 = generateTurnCredentials('secret');
    
    expect(creds1.username).not.toBe(creds2.username);
  });
  
  test('should get ICE servers with STUN', async () => {
    const servers = await getICEServers();
    
    expect(servers).toBeInstanceOf(Array);
    expect(servers.length).toBeGreaterThan(0);
    
    const stunServer = servers.find(s => s.urls.includes('stun:'));
    expect(stunServer).toBeDefined();
  });
  
  test('should cache ICE servers', async () => {
    const servers1 = await getICEServers();
    const servers2 = await getICEServers();
    
    expect(servers1).toEqual(servers2);
  });
});
