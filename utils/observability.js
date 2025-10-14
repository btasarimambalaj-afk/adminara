// OpenTelemetry observability for Node.js (optional)
const logger = require('./logger');

let NodeTracerProvider, Resource, SemanticResourceAttributes;
let SimpleSpanProcessor, ConsoleSpanExporter;
let PrometheusExporter, MeterProvider, PeriodicExportingMetricReader;

try {
  NodeTracerProvider = require('@opentelemetry/sdk-trace-node').NodeTracerProvider;
  Resource = require('@opentelemetry/resources').Resource;
  SemanticResourceAttributes = require('@opentelemetry/semantic-conventions').SemanticResourceAttributes;
  SimpleSpanProcessor = require('@opentelemetry/sdk-trace-base').SimpleSpanProcessor;
  ConsoleSpanExporter = require('@opentelemetry/sdk-trace-base').ConsoleSpanExporter;
  PrometheusExporter = require('@opentelemetry/exporter-prometheus').PrometheusExporter;
  MeterProvider = require('@opentelemetry/sdk-metrics').MeterProvider;
  PeriodicExportingMetricReader = require('@opentelemetry/sdk-metrics').PeriodicExportingMetricReader;
} catch (err) {
  logger.warn('OpenTelemetry dependencies not installed - observability disabled');
}

let tracer = null;
let meter = null;
let initialized = false;

// Initialize OpenTelemetry
function initObservability(serviceName = 'adminara') {
  if (initialized) return { tracer, meter };
  
  if (!NodeTracerProvider) {
    logger.info('OpenTelemetry not available - skipping initialization');
    return { tracer: null, meter: null };
  }
  
  try {
    // Tracer setup
    const provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.3.8'
      })
    });
    
    // Console exporter for development
    if (process.env.NODE_ENV !== 'production') {
      provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
    }
    
    provider.register();
    tracer = provider.getTracer(serviceName);
    
    // Metrics setup
    const prometheusExporter = new PrometheusExporter({ port: 9464 }, () => {
      logger.info('Prometheus metrics available', { port: 9464, endpoint: '/metrics' });
    });
    
    const meterProvider = new MeterProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName
      }),
      readers: [new PeriodicExportingMetricReader({ exporter: prometheusExporter, exportIntervalMillis: 10000 })]
    });
    
    meter = meterProvider.getMeter(serviceName);
    
    initialized = true;
    logger.info('OpenTelemetry initialized', { serviceName });
    
    return { tracer, meter };
  } catch (err) {
    logger.error('OpenTelemetry initialization failed', { error: err.message });
    return { tracer: null, meter: null };
  }
}

// Start a new span
function startSpan(name, attributes = {}) {
  if (!tracer) {
    logger.warn('Tracer not initialized');
    return null;
  }
  
  return tracer.startSpan(name, {
    attributes: {
      ...attributes,
      timestamp: Date.now()
    }
  });
}

// Wrap async function with tracing
function traceAsync(name, fn) {
  if (!tracer) {
    // No tracing available, return original function
    return fn;
  }
  
  return async (...args) => {
    const span = startSpan(name);
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      if (span) {
        span.setAttribute('duration_ms', Date.now() - startTime);
        span.setAttribute('status', 'success');
        span.end();
      }
      return result;
    } catch (err) {
      if (span) {
        span.setAttribute('duration_ms', Date.now() - startTime);
        span.setAttribute('status', 'error');
        span.setAttribute('error.message', err.message);
        span.end();
      }
      throw err;
    }
  };
}

// Performance profiler
class PerformanceProfiler {
  constructor() {
    this.marks = new Map();
    this.measures = [];
  }
  
  mark(name) {
    this.marks.set(name, Date.now());
  }
  
  measure(name, startMark, endMark) {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark) || Date.now();
    
    if (!start) {
      logger.warn('Start mark not found', { startMark });
      return null;
    }
    
    const duration = end - start;
    this.measures.push({ name, duration, timestamp: Date.now() });
    
    logger.debug('Performance measure', { name, duration });
    return duration;
  }
  
  getMeasures() {
    return [...this.measures];
  }
  
  clear() {
    this.marks.clear();
    this.measures = [];
  }
  
  // Detect bottlenecks (>100ms)
  getBottlenecks(threshold = 100) {
    return this.measures.filter(m => m.duration > threshold);
  }
}

// Create custom metrics
function createMetrics(meter) {
  if (!meter) return {};
  
  return {
    webrtcConnectionTime: meter.createHistogram('webrtc_connection_time', {
      description: 'WebRTC connection establishment time',
      unit: 'ms'
    }),
    
    queueWaitTime: meter.createHistogram('queue_wait_time', {
      description: 'Customer queue wait time',
      unit: 'ms'
    }),
    
    jobProcessingTime: meter.createHistogram('job_processing_time', {
      description: 'Background job processing time',
      unit: 'ms'
    }),
    
    activeSpans: meter.createUpDownCounter('active_spans', {
      description: 'Number of active tracing spans'
    })
  };
}

module.exports = {
  initObservability,
  startSpan,
  traceAsync,
  PerformanceProfiler,
  createMetrics,
  getTracer: () => tracer,
  getMeter: () => meter
};
