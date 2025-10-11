# Architecture Documentation

## System Overview

```mermaid
graph TB
    Customer[Customer Browser] -->|WebSocket| Server[Node.js Server]
    Admin[Admin Browser] -->|WebSocket| Server
    Server -->|Telegram API| Bot[Telegram Bot]
    Server -->|STUN/TURN| STUN[Google STUN]
    Customer <-->|WebRTC P2P| Admin
    
    Server -->|Metrics| Prometheus[Prometheus]
    Server -->|Errors| Sentry[Sentry]
    Server -->|Logs| Winston[Winston Logger]
```

## Component Architecture

```mermaid
graph LR
    subgraph Client
        UI[UI Layer]
        WebRTC[WebRTC Manager]
        Socket[Socket.IO Client]
    end
    
    subgraph Server
        Express[Express App]
        SocketIO[Socket.IO Server]
        Handlers[Event Handlers]
        Auth[Authentication]
        State[State Manager]
    end
    
    UI --> WebRTC
    UI --> Socket
    Socket <--> SocketIO
    SocketIO --> Handlers
    Handlers --> Auth
    Handlers --> State
```

## WebRTC Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant S as Server
    participant A as Admin
    
    C->>S: Connect WebSocket
    A->>S: Connect WebSocket
    
    C->>S: Join Room
    A->>S: Join Room (OTP Auth)
    
    S->>C: room:user:joined (admin)
    S->>A: room:user:joined (customer)
    
    C->>C: Create Peer Connection
    A->>A: Create Peer Connection
    
    C->>S: rtc:description (offer)
    S->>A: rtc:description (offer)
    
    A->>S: rtc:description (answer)
    S->>C: rtc:description (answer)
    
    C->>S: rtc:ice-candidate
    S->>A: rtc:ice-candidate
    
    A->>S: rtc:ice-candidate
    S->>C: rtc:ice-candidate
    
    C<-->A: WebRTC P2P Connection
```

## Perfect Negotiation Pattern

```mermaid
stateDiagram-v2
    [*] --> Stable
    Stable --> HaveLocalOffer: Customer creates offer
    HaveLocalOffer --> Stable: Admin sends answer
    
    Stable --> HaveRemoteOffer: Admin creates offer
    HaveRemoteOffer --> Stable: Customer sends answer
    
    HaveLocalOffer --> Stable: Collision (Customer rollback)
    HaveRemoteOffer --> Stable: Collision (Admin ignores)
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant S as Server
    participant T as Telegram
    
    A->>S: Request OTP
    S->>S: Generate 6-digit OTP
    S->>T: Send OTP via Telegram
    T->>Admin: OTP Message
    
    A->>S: Submit OTP
    S->>S: Verify OTP
    S->>S: Create Session Token
    S->>A: Session Token
    
    A->>S: Subsequent requests with token
    S->>S: Validate token
    S->>A: Authorized
```

## State Management

```mermaid
graph TD
    State[State Manager] --> Admin[adminSocket]
    State --> Customers[customerSockets Map]
    State --> Channel[channelStatus]
    State --> OTP[otpStore Map]
    State --> Sessions[sessionStore Map]
    
    Admin --> |null/Socket| AdminConn[Admin Connection]
    Customers --> |socketId: Socket| CustomerConn[Customer Connections]
    Channel --> |AVAILABLE/BUSY| Status[Channel Status]
    OTP --> |socketId: {otp, expires}| OTPData[OTP Data]
    Sessions --> |token: {socketId, expires}| SessionData[Session Data]
```

## Directory Structure

```
ALO/
├── public/              # Static files
│   ├── css/            # Stylesheets
│   ├── js/             # Client-side JavaScript
│   └── icons/          # Icons and images
├── socket/             # Socket.IO handlers
│   ├── handlers.js     # Room & WebRTC handlers
│   ├── admin-auth.js   # Admin authentication
│   └── otp.js          # OTP generation
├── utils/              # Utilities
│   ├── logger.js       # Winston logger
│   ├── metrics.js      # Prometheus metrics
│   ├── auth.js         # Session management
│   ├── rate-limiter.js # Rate limiting
│   ├── middleware.js   # Custom middleware
│   └── sentry.js       # Error tracking
├── routes/             # Express routes
├── tests/              # Test suites
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── e2e/           # E2E tests
└── docs/              # Documentation
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **WebSocket**: Socket.IO
- **Logger**: Winston
- **Metrics**: Prometheus (prom-client)
- **Security**: Helmet, CORS, Rate Limiting
- **Error Tracking**: Sentry

### Frontend
- **WebRTC**: Native WebRTC API
- **UI**: Vanilla JavaScript
- **CSS**: Custom CSS (Mobile-first)
- **PWA**: Service Worker, Manifest

### Testing
- **Unit/Integration**: Jest
- **E2E**: Playwright
- **Coverage**: Istanbul (via Jest)

### DevOps
- **CI/CD**: GitHub Actions
- **Container**: Docker
- **Hosting**: Render.com
- **Monitoring**: Sentry, Prometheus

## Security Layers

```mermaid
graph TB
    Request[Incoming Request] --> HTTPS[HTTPS/TLS]
    HTTPS --> Helmet[Helmet Security Headers]
    Helmet --> CORS[CORS Policy]
    CORS --> RateLimit[Rate Limiting]
    RateLimit --> CSRF[CSRF Protection]
    CSRF --> Auth[Authentication]
    Auth --> IPWhitelist[IP Whitelist]
    IPWhitelist --> Handler[Request Handler]
```

## Scaling Strategy

### Current (Single Instance)
- In-memory state
- Single server
- 0-500 users/day

### Future (Multi-Instance)
- Redis for state
- Load balancer
- Horizontal scaling
- 500+ users/day

## Performance Optimizations

1. **WebSocket Compression**: Level 9, threshold 0
2. **Static File Caching**: Cache-Control headers
3. **Gzip Compression**: Express compression
4. **Connection Pooling**: Socket.IO connection reuse
5. **Perfect Negotiation**: Minimal signaling overhead

## Monitoring & Observability

- **Metrics**: `/metrics` endpoint (Prometheus format)
- **Health Check**: `/health` endpoint
- **Logs**: Winston (file + console)
- **Error Tracking**: Sentry
- **Uptime**: Render.com health checks

## Deployment Pipeline

```mermaid
graph LR
    Dev[Development] -->|git push| GitHub[GitHub]
    GitHub -->|webhook| Actions[GitHub Actions]
    Actions -->|run tests| Tests[Jest + Playwright]
    Tests -->|success| Build[Docker Build]
    Build -->|deploy| Render[Render.com]
    Render -->|live| Production[Production]
```

## Future Enhancements

1. Redis cache for multi-instance support
2. PostgreSQL for call history
3. Admin dashboard with analytics
4. Multi-language support (i18n)
5. Advanced monitoring (New Relic/DataDog)
