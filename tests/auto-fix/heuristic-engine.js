// tests/auto-fix/heuristic-engine.js - Heuristic Analysis Engine

const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class HeuristicEngine {
  analyze(failure) {
    const fixes = [];

    // CORS fix
    if (failure.error.includes('CORS') || failure.error.includes('blocked by CORS')) {
      fixes.push({
        type: 'cors',
        file: 'server.js',
        action: 'add-cors-header',
        origin: this.extractOrigin(failure.context || failure.error),
        priority: 'high'
      });
    }

    // CSP fix
    if (failure.error.includes('CSP') || failure.error.includes('Content Security Policy')) {
      fixes.push({
        type: 'csp',
        file: 'server.js',
        action: 'update-csp-header',
        directive: this.extractCSPDirective(failure.error),
        priority: 'high'
      });
    }

    // ICE fallback fix
    if (failure.error.includes('ICE') && failure.error.includes('timeout')) {
      fixes.push({
        type: 'webrtc',
        file: 'public/js/webrtc.js',
        action: 'add-turn-fallback',
        timeout: 5000,
        priority: 'medium'
      });
    }

    // Socket reconnect fix
    if (failure.error.includes('socket') && failure.error.includes('disconnect')) {
      fixes.push({
        type: 'socket',
        file: failure.file || 'public/js/socket-client.js',
        action: 'add-reconnect-logic',
        maxRetries: 5,
        priority: 'medium'
      });
    }

    // Fetch retry fix
    if (failure.error.includes('fetch') && failure.error.includes('timeout')) {
      fixes.push({
        type: 'fetch',
        file: failure.file || 'public/js/api-client.js',
        action: 'add-retry-wrapper',
        maxRetries: 3,
        priority: 'low'
      });
    }

    // Validation schema fix
    if (failure.error.includes('validation') || failure.error.includes('schema')) {
      fixes.push({
        type: 'validation',
        file: failure.file,
        action: 'add-joi-schema',
        endpoint: this.extractEndpoint(failure.context),
        priority: 'medium'
      });
    }

    return fixes;
  }

  extractOrigin(text) {
    const match = text.match(/Origin[:\s]+['"]?(https?:\/\/[^\s'"]+)/i);
    return match ? match[1] : 'https://unknown-origin.com';
  }

  extractCSPDirective(error) {
    const match = error.match(/Refused to (load|execute) .* '([^']+)'/);
    return match ? match[2] : 'default-src';
  }

  extractEndpoint(context) {
    const match = context?.match(/\/api\/([^\s]+)/);
    return match ? match[1] : 'unknown';
  }

  prioritize(fixes) {
    const priority = { high: 3, medium: 2, low: 1 };
    return fixes.sort((a, b) => priority[b.priority] - priority[a.priority]);
  }
}

module.exports = HeuristicEngine;
