# WebRTC Connection Fix Plan

## Current Flow Issues

### Customer (index.html)
1. ✅ Page load → `joinChannelImmediately()`
2. ✅ Emit `room:join` with `isAdmin: false`
3. ✅ Start WebRTC → `getUserMedia()`
4. ✅ Create peer connection
5. ❌ **PROBLEM**: Peer connection created BEFORE admin joins

### Admin (admin.html)
1. ✅ OTP login
2. ✅ Emit `room:join` with `isAdmin: true`
3. ✅ Start WebRTC → `getUserMedia()`
4. ✅ Create peer connection
5. ❌ **PROBLEM**: Peer connection created but no negotiation trigger

## Root Cause
- Customer creates peer connection too early (before admin)
- Admin creates peer connection but `onnegotiationneeded` doesn't fire
- No tracks added = no negotiation trigger

## Solution
1. Customer: Wait for `room:user:joined` (admin) before creating peer connection
2. Admin: Create peer connection immediately (always ready)
3. Both: Add tracks BEFORE creating peer connection
4. Ensure `onnegotiationneeded` fires by adding tracks

## Implementation
- Fix customer flow: Create peer connection ONLY after admin joins
- Fix admin flow: Ensure tracks are added before peer connection
- Add connection state logging for debugging
