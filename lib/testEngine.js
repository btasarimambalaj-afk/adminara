// lib/testEngine.js - Advanced Test Engine

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const categoryTestMap = {
  'Temel Kontroller': 'tests/integration/socket-deep.test.js tests/integration/fetch-deep.test.js',
  'API Endpoints': 'tests/integration/api-deep.test.js tests/integration/schema-validation-deep.test.js',
  'Bağlantı Testleri': 'tests/integration/socket-connection-deep.test.js',
  'Güvenlik Testleri': 'tests/security/csp-cors-deep.test.js tests/security/otp-security-deep.test.js',
  'WebRTC Detaylı': 'tests/integration/webrtc-lifecycle-deep.test.js',
  'Performans Testleri': 'tests/performance/performance-deep.test.js',
  'UI/UX Testleri': 'tests/e2e/ui-ux-deep.test.js',
  'State Management': 'tests/integration/state-management-deep.test.js'
};

async function runTests(category) {
  const testFiles = categoryTestMap[category];
  
  if (!testFiles) {
    return [{ test: category, status: 'skip', message: 'No tests defined' }];
  }

  try {
    const { stdout, stderr } = await execPromise(`npm test -- ${testFiles}`);
    return parseTestResults(stdout, stderr);
  } catch (error) {
    return parseTestResults(error.stdout || '', error.stderr || '', true);
  }
}

function parseTestResults(stdout, stderr, hasError = false) {
  const results = [];
  const lines = (stdout + stderr).split('\n');
  
  for (const line of lines) {
    if (line.includes('✓') || line.includes('PASS')) {
      results.push({ test: line.trim(), status: 'pass', message: 'Test passed' });
    } else if (line.includes('✕') || line.includes('FAIL')) {
      results.push({ test: line.trim(), status: 'fail', message: extractErrorMessage(lines, line) });
    }
  }
  
  if (results.length === 0 && hasError) {
    results.push({ test: 'Unknown', status: 'fail', message: stderr || 'Test execution failed' });
  }
  
  return results;
}

function extractErrorMessage(lines, failLine) {
  const index = lines.indexOf(failLine);
  const nextLines = lines.slice(index + 1, index + 5);
  return nextLines.join(' ').trim() || 'Test failed';
}

module.exports = { runTests };
