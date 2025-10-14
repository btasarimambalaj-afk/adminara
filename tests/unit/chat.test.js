const { createMockSocket } = require('../helpers/mocks');

describe('Chat System', () => {
  let mockSocket;
  let mockIo;
  let state;
  
  beforeEach(() => {
    mockSocket = createMockSocket();
    mockIo = {
      sockets: {
        sockets: new Map()
      }
    };
    state = {
      adminSocket: null,
      customerSockets: new Map(),
      connectionCount: 0
    };
  });
  
  test('should send chat message to room', (done) => {
    const handlers = require('../../socket/handlers');
    handlers(mockIo, mockSocket, state);
    
    mockSocket.to = jest.fn().mockReturnValue({
      emit: jest.fn((event, data) => {
        expect(event).toBe('chat:message');
        expect(data.message).toBe('Hello');
        expect(data.sender).toBe(mockSocket.id);
        done();
      })
    });
    
    mockSocket.emit('chat:send', { message: 'Hello' });
  });
  
  test('should reject messages over 500 chars', () => {
    const handlers = require('../../socket/handlers');
    handlers(mockIo, mockSocket, state);
    
    const longMessage = 'a'.repeat(501);
    const emitSpy = jest.fn();
    mockSocket.to = jest.fn().mockReturnValue({ emit: emitSpy });
    
    mockSocket.emit('chat:send', { message: longMessage });
    
    expect(emitSpy).not.toHaveBeenCalled();
  });
  
  test('should clear chat on call end', (done) => {
    const handlers = require('../../socket/handlers');
    handlers(mockIo, mockSocket, state);
    
    mockSocket.to = jest.fn().mockReturnValue({
      emit: jest.fn((event) => {
        if (event === 'chat:clear') {
          done();
        }
      })
    });
    
    mockSocket.emit('call:end');
  });
});
