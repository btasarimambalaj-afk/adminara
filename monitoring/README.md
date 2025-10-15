# AdminAra Monitoring Stack

Prometheus + Grafana monitoring for AdminAra WebRTC application.

## Quick Start

```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Stop monitoring stack
docker-compose -f docker-compose.monitoring.yml down

# View logs
docker-compose -f docker-compose.monitoring.yml logs -f
```

## Access

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
  - Username: `admin`
  - Password: `admin`

## Dashboard

### AdminAra - System Overview

- **Active WebSocket Connections**: Real-time connection count
- **HTTP Request Rate**: Requests per second by method/path
- **WebRTC ICE Success Rate**: Connection success percentage
- **Queue Length**: Waiting customers count

## Prometheus Queries

```promql
# Uptime percentage (last 24h)
100 * (1 - (sum(rate(http_requests_total{status=~"5.."}[24h])) / sum(rate(http_requests_total[24h]))))

# Active connections
websocket_connections_total
webrtc_connections_active

# Response time p95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# Session completion rate
100 * (business_sessions_completed_total / business_sessions_total)
```

## Configuration

### Prometheus

- Config: `monitoring/prometheus.yml`
- Scrape interval: 15s
- Retention: 15 days (default)

### Grafana

- Datasources: `monitoring/grafana/datasources/`
- Dashboards: `monitoring/grafana/dashboards/`
- Auto-provisioned on startup

## Metrics Endpoint

AdminAra exposes metrics at `/metrics` with Basic Auth:

- Username: `admin`
- Password: `secret` (change in production!)

## Production Notes

1. **Change default passwords**:
   - Grafana admin password (GF_SECURITY_ADMIN_PASSWORD)
   - Metrics endpoint auth (METRICS_USERNAME, METRICS_PASSWORD)

2. **Persistent storage**:
   - Prometheus data: `prometheus-data` volume
   - Grafana data: `grafana-data` volume

3. **Resource limits**:
   - Add memory/CPU limits in docker-compose.monitoring.yml
   - Adjust Prometheus retention period

4. **Alerting**:
   - Configure Grafana alerts for critical metrics
   - Set up notification channels (email, Slack, etc.)

## Troubleshooting

```bash
# Check if metrics endpoint is accessible
curl -u admin:secret http://localhost:3000/metrics

# Check Prometheus targets
# Visit: http://localhost:9090/targets

# Check Grafana datasource
# Visit: http://localhost:3001/datasources

# Restart services
docker-compose -f docker-compose.monitoring.yml restart
```
