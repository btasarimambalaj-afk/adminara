// test-exporter.js - Advanced Report Exporter

class TestExporter {
  exportMarkdown(results) {
    let md = '# Test Raporu\n\n';
    md += `**Tarih**: ${new Date().toLocaleString('tr-TR')}\n`;
    md += `**Toplam Test**: ${results.total}\n`;
    md += `**Başarılı**: ${results.passed} (${Math.round(results.passed/results.total*100)}%)\n`;
    md += `**Başarısız**: ${results.failed} (${Math.round(results.failed/results.total*100)}%)\n\n`;

    md += '## Kategoriler\n\n';
    Object.entries(results.categories || {}).forEach(([cat, data]) => {
      const icon = data.failed === 0 ? '✅' : '⚠️';
      md += `### ${icon} ${cat}\n`;
      md += `- Toplam: ${data.total}\n`;
      md += `- Başarılı: ${data.passed}\n`;
      md += `- Başarısız: ${data.failed}\n\n`;
    });

    if (results.failures && results.failures.length > 0) {
      md += '## Başarısız Testler\n\n';
      results.failures.forEach(f => {
        md += `### ❌ ${f.test}\n`;
        md += `**Mesaj**: ${f.message}\n\n`;
      });
    }

    this.download('test-report.md', md, 'text/markdown');
  }

  exportCSV(results) {
    let csv = 'Kategori,Test,Durum,Mesaj\n';
    
    Object.entries(results.categories || {}).forEach(([cat, data]) => {
      data.tests?.forEach(test => {
        const status = test.passed ? 'Başarılı' : 'Başarısız';
        const message = (test.message || '').replace(/,/g, ';');
        csv += `"${cat}","${test.name}","${status}","${message}"\n`;
      });
    });

    this.download('test-report.csv', csv, 'text/csv');
  }

  exportJSON(results) {
    const json = JSON.stringify(results, null, 2);
    this.download('test-report.json', json, 'application/json');
  }

  async exportZIP(results, logs = []) {
    // Simple ZIP creation (requires JSZip library)
    if (typeof JSZip === 'undefined') {
      alert('JSZip kütüphanesi yüklü değil. ZIP export için gerekli.');
      return;
    }

    const zip = new JSZip();
    
    // Add report files
    this.exportMarkdown(results);
    zip.file('report.md', this.generateMarkdownContent(results));
    zip.file('report.json', JSON.stringify(results, null, 2));
    zip.file('report.csv', this.generateCSVContent(results));
    
    // Add logs
    if (logs.length > 0) {
      const logsFolder = zip.folder('logs');
      logs.forEach((log, i) => {
        logsFolder.file(`log-${i+1}.txt`, log);
      });
    }

    // Generate and download
    const content = await zip.generateAsync({type: 'blob'});
    this.downloadBlob('test-reports.zip', content);
  }

  generateMarkdownContent(results) {
    let md = '# Test Raporu\n\n';
    md += `**Tarih**: ${new Date().toLocaleString('tr-TR')}\n`;
    md += `**Toplam**: ${results.total}\n`;
    md += `**Başarılı**: ${results.passed}\n`;
    md += `**Başarısız**: ${results.failed}\n`;
    return md;
  }

  generateCSVContent(results) {
    let csv = 'Kategori,Test,Durum,Mesaj\n';
    Object.entries(results.categories || {}).forEach(([cat, data]) => {
      data.tests?.forEach(test => {
        csv += `"${cat}","${test.name}","${test.passed ? 'OK' : 'FAIL'}","${test.message || ''}"\n`;
      });
    });
    return csv;
  }

  download(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    this.downloadBlob(filename, blob);
  }

  downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestExporter;
}
