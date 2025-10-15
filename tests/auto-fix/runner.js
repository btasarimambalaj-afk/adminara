#!/usr/bin/env node
// tests/auto-fix/runner.js - Auto-Fix Runner

const FailureAggregator = require('./failure-aggregator');
const AutoFixer = require('./auto-fixer');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔧 Auto-Fix Runner Starting...\n');

  // Check for test results
  const resultsPath = path.join(__dirname, '../results/failures.json');
  
  if (!fs.existsSync(resultsPath)) {
    console.log('⚠️  No test failures found. Run tests first with: npm run test:deep');
    process.exit(0);
  }

  // Load failures
  const failures = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  console.log(`📋 Found ${failures.length} test failures\n`);

  // Aggregate and categorize
  const aggregator = new FailureAggregator();
  failures.forEach(f => aggregator.addFailure(f.test, f.error, f.context));

  const summary = aggregator.getSummary();
  console.log('📊 Failure Summary:');
  Object.entries(summary.byCategory).forEach(([category, count]) => {
    if (count > 0) {
      console.log(`   ${category}: ${count}`);
    }
  });
  console.log('');

  // Apply fixes
  const fixer = new AutoFixer();
  const fixes = [];

  // Generate fixes based on categories
  const categories = aggregator.categorize();
  
  if (categories.cors.length > 0) {
    fixes.push({ type: 'cors', origin: 'http://localhost:3000' });
  }
  
  if (categories.timeout.length > 0) {
    fixes.push({ type: 'timeout', timeout: 10000, file: 'tests/integration' });
  }

  if (fixes.length === 0) {
    console.log('✅ No automatic fixes available for these failures');
    process.exit(0);
  }

  console.log(`🛠️  Applying ${fixes.length} fixes...\n`);
  const results = await fixer.applyFixes(fixes);

  results.forEach(({ fix, result }) => {
    if (result.success) {
      console.log(`✅ ${fix.type}: ${result.changes}`);
    } else {
      console.log(`❌ ${fix.type}: ${result.reason}`);
    }
  });

  console.log('\n✨ Auto-fix complete!');
}

main().catch(console.error);
