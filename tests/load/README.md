# Load Tests (k6)

## Installation

```bash
# Windows (Chocolatey)
choco install k6

# macOS (Homebrew)
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Run Tests

```bash
# HTTP Load Test
k6 run tests/load/http-load.js

# WebSocket Load Test
k6 run tests/load/websocket-load.js

# Custom URL
k6 run -e BASE_URL=https://adminara.onrender.com tests/load/http-load.js
k6 run -e WS_URL=wss://adminara.onrender.com tests/load/websocket-load.js

# Cloud Run (k6 Cloud)
k6 cloud tests/load/http-load.js
```

## Thresholds

- **HTTP**: p95 < 500ms, failure rate < 1%
- **WebSocket**: p95 connection < 1s, min 100 messages

## Stages

1. Ramp up: 30s-1m
2. Sustained: 1-2m at 50 users
3. Ramp down: 30s-1m
