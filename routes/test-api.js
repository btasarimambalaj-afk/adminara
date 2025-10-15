const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * POST /api/test/run
 * Run automated test suite and return results
 */
router.post('/run', async (req, res) => {
  try {
    // Run test suite
    execSync('node scripts/test-runner-simple.js', {
      cwd: path.join(__dirname, '..'),
      timeout: 30000
    });
    
    // Read results
    const resultsPath = path.join(__dirname, '../reports/test_results.json');
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({
      error: 'Test execution failed',
      message: error.message,
      summary: { passed: 0, failed: 0, total: 0, duration: '0s', coverage: '0%' }
    });
  }
});

/**
 * GET /api/test/results
 * Get latest test results
 */
router.get('/results', (req, res) => {
  try {
    const resultsPath = path.join(__dirname, '../reports/test_results.json');
    if (!fs.existsSync(resultsPath)) {
      return res.status(404).json({ error: 'No test results found' });
    }
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read test results' });
  }
});

/**
 * GET /api/test/report
 * Get latest test report (markdown)
 */
router.get('/report', (req, res) => {
  try {
    const reportPath = path.join(__dirname, '../reports/test_report.md');
    if (!fs.existsSync(reportPath)) {
      return res.status(404).send('No test report found');
    }
    const report = fs.readFileSync(reportPath, 'utf8');
    res.setHeader('Content-Type', 'text/markdown');
    res.send(report);
  } catch (error) {
    res.status(500).send('Failed to read test report');
  }
});

module.exports = router;
