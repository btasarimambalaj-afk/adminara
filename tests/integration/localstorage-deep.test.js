// tests/integration/localstorage-deep.test.js - LocalStorage Deep Tests

describe('LocalStorage Deep Tests', () => {
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = (() => {
      let store = {};
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; }
      };
    })();
    global.localStorage = mockLocalStorage;
  });

  test('Capacity full test', () => {
    const largeData = 'x'.repeat(5 * 1024 * 1024); // 5MB
    
    try {
      localStorage.setItem('large', largeData);
      const retrieved = localStorage.getItem('large');
      expect(retrieved.length).toBe(largeData.length);
    } catch (err) {
      expect(err.name).toBe('QuotaExceededError');
    }
  });

  test('JSON parse error scenario', () => {
    localStorage.setItem('invalid', '{broken json}');
    
    expect(() => {
      JSON.parse(localStorage.getItem('invalid'));
    }).toThrow();
  });

  test('Safe JSON parse with fallback', () => {
    localStorage.setItem('invalid', '{broken json}');
    
    const safeGet = (key, fallback = null) => {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch {
        return fallback;
      }
    };

    const result = safeGet('invalid', { default: true });
    expect(result).toEqual({ default: true });
  });

  test('Data persistence simulation', () => {
    const data = { user: 'test', session: '123' };
    localStorage.setItem('session', JSON.stringify(data));
    
    const retrieved = JSON.parse(localStorage.getItem('session'));
    expect(retrieved).toEqual(data);
  });
});
