// lib/reportUtils.js - Report and Auto-Fix Utilities

const fs = require('fs');
const path = require('path');

async function writeReport(category, results) {
  const reportPath = './reports/test_report.md';
  
  let report = '';
  if (fs.existsSync(reportPath)) {
    report = fs.readFileSync(reportPath, 'utf8');
  } else {
    report = '# ✅ TEST RAPORU\n\n';
  }

  report += `\n### ${category}\n\n`;
  
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    report += `- [${result.status === 'pass' ? 'x' : ' '}] ${result.test} — ${icon} ${result.status === 'pass' ? 'Passed' : 'Failed'}\n`;
    
    if (result.status === 'fail') {
      report += `  ↪️ Sebep: ${result.message}\n`;
    }
  });

  report += '\n---\n';
  
  fs.writeFileSync(reportPath, report);
}

async function suggestFixes(category, failedTests) {
  const fixPath = './reports/autofix_suggestions.md';
  
  let suggestions = '';
  if (fs.existsSync(fixPath)) {
    suggestions = fs.readFileSync(fixPath, 'utf8');
  } else {
    suggestions = '# 🔧 Auto-Fix Önerileri\n\n';
  }

  suggestions += `\n## 📂 ${category}\n\n`;
  
  failedTests.forEach(test => {
    const fix = analyzeFix(test);
    suggestions += `### 🔹 Hata: ${test.test}\n`;
    suggestions += `**Sebep:** ${test.message}\n\n`;
    suggestions += `**Önerilen Çözüm:**\n${fix}\n\n`;
  });

  suggestions += '---\n';
  
  fs.writeFileSync(fixPath, suggestions);
}

function analyzeFix(test) {
  const message = test.message.toLowerCase();
  
  if (message.includes('cors')) {
    return '```js\n// server.js\nconst allowedOrigins = [\'https://adminara.onrender.com\'];\napp.use(cors({ origin: allowedOrigins, credentials: true }));\n```';
  }
  
  if (message.includes('reconnect') || message.includes('disconnect')) {
    return '```js\n// socket-client.js\nsocket.on("disconnect", () => {\n  setTimeout(() => socket.connect(), 2000);\n});\n```';
  }
  
  if (message.includes('timeout')) {
    return '```js\n// Timeout değerini artır\nconst timeout = 15000; // 15 saniye\n```';
  }
  
  if (message.includes('ice') || message.includes('webrtc')) {
    return '```js\n// webrtc.js\nsetTimeout(() => {\n  if (pc.iceGatheringState !== "complete") {\n    pc.setConfiguration({ iceServers: [{ urls: "turn:server" }] });\n  }\n}, 5000);\n```';
  }
  
  if (message.includes('validation') || message.includes('schema')) {
    return '```js\n// Joi validation schema ekle\nconst schema = Joi.object({ field: Joi.string().required() });\n```';
  }
  
  return '```\nManuel inceleme gerekli\n```';
}

module.exports = { writeReport, suggestFixes };
