// testRunner.js - Advanced Test Runner with Auto-Fix

const { runTests } = require('./lib/testEngine');
const { writeReport, suggestFixes } = require('./lib/reportUtils');
const testConfig = require('./test.config.json');
const fs = require('fs');

async function main() {
  console.log('🚀 Derin Test Başlatıldı...\n');

  // Clear previous reports
  if (fs.existsSync('./reports/test_report.md')) {
    fs.unlinkSync('./reports/test_report.md');
  }
  if (fs.existsSync('./reports/autofix_suggestions.md')) {
    fs.unlinkSync('./reports/autofix_suggestions.md');
  }

  const summary = {
    total: 0,
    passed: 0,
    failed: 0,
    categories: []
  };

  for (let partIndex = 0; partIndex < testConfig.testCategories.length; partIndex++) {
    const category = testConfig.testCategories[partIndex];
    console.log(`\n📂 PART-${partIndex + 1}: ${category}`);

    const results = await runTests(category);
    
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    
    summary.total += results.length;
    summary.passed += passed;
    summary.failed += failed;
    summary.categories.push({ category, passed, failed, total: results.length });

    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);

    await writeReport(category, results);

    const failedTests = results.filter(r => r.status === 'fail');
    if (testConfig.autoFix && failedTests.length > 0) {
      console.log('  🔧 Auto-Fix Aktif. Hatalar analiz ediliyor...');
      await suggestFixes(category, failedTests);
    }
  }

  console.log('\n\n📊 GENEL ÖZET');
  console.log('═'.repeat(50));
  console.log(`Toplam Test: ${summary.total}`);
  console.log(`✅ Başarılı: ${summary.passed} (${Math.round(summary.passed/summary.total*100)}%)`);
  console.log(`❌ Başarısız: ${summary.failed} (${Math.round(summary.failed/summary.total*100)}%)`);
  console.log('═'.repeat(50));

  console.log('\n📂 Kategori Detayları:');
  summary.categories.forEach(cat => {
    const status = cat.failed === 0 ? '✅' : '⚠️';
    console.log(`  ${status} ${cat.category}: ${cat.passed}/${cat.total}`);
  });

  console.log('\n📄 Raporlar:');
  console.log('  - Test Raporu: ./reports/test_report.md');
  console.log('  - Auto-Fix Önerileri: ./reports/autofix_suggestions.md');
  console.log('\n✅ Test süreci tamamlandı.\n');
}

main().catch(console.error);
