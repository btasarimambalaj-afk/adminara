// tests/auto-fix/failure-aggregator.js

class FailureAggregator {
  constructor() {
    this.failures = [];
  }

  addFailure(test, error, context = {}) {
    this.failures.push({
      test: test.name || test,
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    });
  }

  categorize() {
    return {
      cors: this.failures.filter(f => f.error.includes('CORS')),
      csp: this.failures.filter(f => f.error.includes('CSP')),
      ice: this.failures.filter(f => f.error.includes('ICE')),
      timeout: this.failures.filter(f => f.error.includes('timeout')),
      validation: this.failures.filter(f => f.error.includes('validation'))
    };
  }

  getSummary() {
    const categories = this.categorize();
    return {
      total: this.failures.length,
      byCategory: Object.keys(categories).reduce((acc, key) => {
        acc[key] = categories[key].length;
        return acc;
      }, {})
    };
  }
}

module.exports = FailureAggregator;
