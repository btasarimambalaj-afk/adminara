# Socket.IO API Documentation

## Connection

```javascript
const socket = io('https://adminara.onrender.com', {
  transports: ['websocket', 'polling'],
});
```

---

## Events

### Client → Server

#### `room:join` / `channel:join`

Join support room as customer or admin.

**Payload**:

```javascript
{
  isAdmin: boolean,        // true for admin, false for customer
  customerName?: string    // Customer name (optional)
}
```

**Response**: `room:joined`, `channel:joined`

---

#### `chat:send`

Send chat message.

**Payload**:

```javascript
{
  message: string,         // Max 500 chars
  timestamp?: number       // Optional timestamp
}
```

**Response**: `chat:message` (broadcast to room)

**Rate Limit**: 100 messages/minute

---

#### `rtc:description`

Send WebRTC offer/answer.

**Payload**:

```javascript
{
  description: {
    type: 'offer' | 'answer',
    sdp: string            // SDP string
  },
  restart?: boolean        // ICE restart flag
}
```

**Response**: `rtc:description` (to peer)

---

#### `rtc:ice:candidate`

Send ICE candidate.

**Payload**:

```javascript
{
  candidate: {
    candidate: string,
    sdpMid?: string,
    sdpMLineIndex?: number
  }
}
```

**Response**: `rtc:ice:candidate` (to peer)

---

#### `customer:update:name`

Update customer name.

**Payload**:

```javascript
{
  customerName: string; // Max 100 chars
}
```

**Response**: `customer:name:updated` (to admin)

---

#### `queue:get`

Get queue length.

**Response**: `queue:update`

---

#### `queue:pop`

Pop next customer from queue (admin only).

**Response**: `queue:ready` (to customer), `queue:update` (to admin)

---

#### `call:end`

End call and clear room.

**Response**: `call:ended`, `chat:clear` (broadcast)

---

### Server → Client

#### `room:joined` / `channel:joined`

Confirmation of room join.

**Payload**:

```javascript
{
  role: 'admin' | 'customer';
}
```

---

#### `room:user:joined`

Another user joined the room.

**Payload**:

```javascript
{
  role: 'admin' | 'customer',
  userId?: string,
  customerName?: string
}
```

---

#### `room:full` / `channel:busy`

Room is full (max 1 customer).

**Payload**:

```javascript
{
  message: string;
}
```

---

#### `queue:joined`

Customer added to queue.

**Payload**:

```javascript
{
  position: number; // Queue position
}
```

---

#### `queue:ready`

Customer's turn from queue.

---

#### `queue:update`

Queue length updated.

**Payload**:

```javascript
{
  queueLength: number;
}
```

---

#### `chat:message`

Chat message received.

**Payload**:

```javascript
{
  message: string,
  sender: string,          // Socket ID
  timestamp: number
}
```

---

#### `chat:clear`

Clear chat messages.

---

#### `rtc:description`

WebRTC offer/answer received.

**Payload**:

```javascript
{
  description: {
    type: 'offer' | 'answer',
    sdp: string
  },
  restart?: boolean
}
```

---

#### `rtc:ice:candidate`

ICE candidate received.

**Payload**:

```javascript
{
  candidate: RTCIceCandidate;
}
```

---

#### `ice:restart`

ICE restart requested.

**Payload**:

```javascript
{
  message: string;
}
```

---

#### `ice:failed`

ICE connection failed.

**Payload**:

```javascript
{
  state: string;
}
```

---

#### `call:ended`

Call ended by peer.

---

#### `user:disconnected`

User disconnected from room.

**Payload**:

```javascript
{
  userId: string;
}
```

---

#### `room:timeout`

Room timeout (1 minute inactivity).

**Payload**:

```javascript
{
  message: string;
}
```

---

#### `admin:session:active`

Admin login rejected (active session exists).

**Payload**:

```javascript
{
  message: string;
}
```

---

#### `customer:name:updated`

Customer name updated.

**Payload**:

```javascript
{
  userId: string,
  customerName: string
}
```

---

#### `server:shutdown`

Server shutting down.

**Payload**:

```javascript
{
  message: string;
}
```

---

#### `error`

Socket error.

**Payload**:

```javascript
{
  message: string;
}
```

---

## Rate Limiting

- **Socket events**: 100 events/minute per event type
- **Chat messages**: Max 500 characters
- **Customer name**: Max 100 characters

---

## Security

- **CSRF Protection**: Enabled in production
- **Input Validation**: Joi schemas for all events
- **SDP Validation**: Malicious pattern detection
- **Rate Limiting**: Per-socket, per-event

---

## Example Usage

### Customer Flow

```javascript
const socket = io('https://adminara.onrender.com');

// Join as customer
socket.emit('room:join', {
  isAdmin: false,
  customerName: 'John Doe',
});

// Listen for admin join
socket.on('room:user:joined', data => {
  if (data.role === 'admin') {
    console.log('Admin joined!');
  }
});

// Send chat message
socket.emit('chat:send', {
  message: 'Hello, I need help!',
});

// Listen for chat messages
socket.on('chat:message', data => {
  console.log(`${data.sender}: ${data.message}`);
});
```

### Admin Flow

```javascript
const socket = io('https://adminara.onrender.com', {
  auth: { isAdmin: true },
});

// Join as admin
socket.emit('room:join', {
  isAdmin: true,
});

// Listen for customer join
socket.on('room:user:joined', data => {
  if (data.role === 'customer') {
    console.log(`Customer joined: ${data.customerName}`);
  }
});

// Pop from queue
socket.emit('queue:pop');

// Listen for queue updates
socket.on('queue:update', data => {
  console.log(`Queue length: ${data.queueLength}`);
});
```

---

**Last Updated**: 2024
**Version**: 1.3.8
