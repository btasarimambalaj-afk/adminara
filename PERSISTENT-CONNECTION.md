# Persistent WebRTC Connection Strategy

## Goal
Create a persistent, never-breaking WebRTC connection between admin and customers.

## Current Problems
1. Peer connection closes after each call
2. New peer connection needed for each customer
3. Connection drops during network issues

## Solution: Persistent Connection Pool

### Architecture
```
Admin (Always Connected)
    ↓
Persistent Peer Connection
    ↓
Customer Queue (Multiple customers can wait)
```

### Implementation Strategy

1. **Admin Side**
   - Create peer connection on login
   - NEVER close peer connection
   - Reuse same connection for all customers
   - Auto-reconnect on failure

2. **Customer Side**
   - Create peer connection when admin available
   - Keep connection alive during call
   - Graceful disconnect after call ends

3. **Connection Monitoring**
   - Heartbeat every 5 seconds
   - Auto ICE restart on disconnect
   - Exponential backoff retry (1s, 2s, 4s, 8s)
   - Max 10 retry attempts

4. **State Management**
   - Connection state: connecting, connected, disconnected, failed
   - Track connection quality (RTT, packet loss)
   - Automatic quality adjustment

## Benefits
- Zero connection setup time
- No dropped calls
- Seamless customer transitions
- Better user experience
