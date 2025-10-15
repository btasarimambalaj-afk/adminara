// test-ai-analyzer.js - AI-Powered Test Analysis

class AITestAnalyzer {
  constructor() {
    this.patterns = {
      socket: {
        keywords: ['socket', 'disconnect', 'reconnect', 'connection'],
        solutions: [
          'socket.on("disconnect") event handler ekleyin',
          'Reconnect logic için exponential backoff kullanın',
          'pingInterval ve pingTimeout değerlerini optimize edin'
        ]
      },
      webrtc: {
        keywords: ['ice', 'candidate', 'peer', 'rtc', 'stun', 'turn'],
        solutions: [
          'ICE gathering timeout için TURN fallback ekleyin',
          'Perfect negotiation pattern kullanın',
          'setLocalDescription await ile çağrılmalı'
        ]
      },
      storage: {
        keywords: ['localstorage', 'sessionstorage', 'quota', 'storage'],
        solutions: [
          'QuotaExceededError için try-catch ekleyin',
          'JSON.parse için safe wrapper kullanın',
          'Storage capacity kontrolü yapın'
        ]
      },
      network: {
        keywords: ['fetch', 'timeout', 'network', 'offline'],
        solutions: [
          'Fetch için retry mechanism ekleyin',
          'Timeout değerini artırın (15s+)',
          'Offline detection için navigator.onLine kullanın'
        ]
      },
      validation: {
        keywords: ['validation', 'schema', 'joi', 'invalid'],
        solutions: [
          'Joi schema validation ekleyin',
          'Input sanitization için validator.js kullanın',
          'XSS/SQL injection kontrolü yapın'
        ]
      }
    };
  }

  analyze(failures) {
    const analysis = {
      summary: '',
      issues: [],
      recommendations: [],
      priority: 'low'
    };

    if (!failures || failures.length === 0) {
      analysis.summary = '✅ Tüm testler başarılı! Sistem sağlıklı çalışıyor.';
      return analysis;
    }

    // Analyze each failure
    failures.forEach(failure => {
      const issue = this.analyzeFailure(failure);
      analysis.issues.push(issue);
    });

    // Generate summary
    analysis.summary = this.generateSummary(failures);
    analysis.recommendations = this.generateRecommendations(analysis.issues);
    analysis.priority = this.calculatePriority(failures);

    return analysis;
  }

  analyzeFailure(failure) {
    const text = (failure.message || '').toLowerCase();
    let category = 'unknown';
    let solutions = ['Manuel inceleme gerekli'];

    // Match pattern
    for (const [key, pattern] of Object.entries(this.patterns)) {
      if (pattern.keywords.some(kw => text.includes(kw))) {
        category = key;
        solutions = pattern.solutions;
        break;
      }
    }

    return {
      test: failure.test,
      category,
      message: failure.message,
      solutions,
      severity: this.calculateSeverity(text)
    };
  }

  calculateSeverity(text) {
    if (text.includes('critical') || text.includes('security') || text.includes('crash')) {
      return 'critical';
    }
    if (text.includes('error') || text.includes('failed') || text.includes('timeout')) {
      return 'high';
    }
    if (text.includes('warning') || text.includes('deprecated')) {
      return 'medium';
    }
    return 'low';
  }

  generateSummary(failures) {
    const count = failures.length;
    const categories = {};
    
    failures.forEach(f => {
      const text = (f.message || '').toLowerCase();
      for (const [key, pattern] of Object.entries(this.patterns)) {
        if (pattern.keywords.some(kw => text.includes(kw))) {
          categories[key] = (categories[key] || 0) + 1;
          break;
        }
      }
    });

    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    
    if (topCategory) {
      return `⚠️ ${count} test başarısız. En çok ${topCategory[0]} kategorisinde sorun var (${topCategory[1]} adet).`;
    }
    
    return `⚠️ ${count} test başarısız. Detaylı analiz için raporları inceleyin.`;
  }

  generateRecommendations(issues) {
    const recommendations = new Set();
    
    issues.forEach(issue => {
      issue.solutions.forEach(sol => recommendations.add(sol));
    });

    return Array.from(recommendations).slice(0, 5);
  }

  calculatePriority(failures) {
    const hasCritical = failures.some(f => 
      (f.message || '').toLowerCase().includes('critical') ||
      (f.message || '').toLowerCase().includes('security')
    );
    
    if (hasCritical) return 'critical';
    if (failures.length > 5) return 'high';
    if (failures.length > 2) return 'medium';
    return 'low';
  }

  generateReport(analysis) {
    let html = '<div class="ai-analysis">';
    html += `<h3>🧠 AI Analiz Sonucu</h3>`;
    html += `<p class="summary">${analysis.summary}</p>`;
    
    if (analysis.recommendations.length > 0) {
      html += '<h4>💡 Öneriler:</h4><ul>';
      analysis.recommendations.forEach(rec => {
        html += `<li>${rec}</li>`;
      });
      html += '</ul>';
    }

    if (analysis.issues.length > 0) {
      html += '<h4>🔍 Detaylı Analiz:</h4>';
      analysis.issues.forEach(issue => {
        const severityIcon = {
          critical: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '🟢'
        }[issue.severity] || '⚪';
        
        html += `<div class="issue">`;
        html += `<strong>${severityIcon} ${issue.test}</strong>`;
        html += `<p>Kategori: ${issue.category}</p>`;
        html += `<p>Mesaj: ${issue.message}</p>`;
        html += '</div>';
      });
    }

    html += '</div>';
    return html;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AITestAnalyzer;
}
