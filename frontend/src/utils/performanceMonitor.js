// Performance monitoring utilities

class PerformanceMonitor {
  constructor() {
    this.apiCallCounts = new Map();
    this.renderCounts = new Map();
    this.lastLogTime = Date.now();
    this.logInterval = 10000; // Log every 10 seconds
  }

  // Track API calls
  trackApiCall(endpoint) {
    const count = this.apiCallCounts.get(endpoint) || 0;
    this.apiCallCounts.set(endpoint, count + 1);
    
    // Log if excessive calls detected
    if (count > 10) {
      console.warn(`🚨 Excessive API calls detected: ${endpoint} called ${count + 1} times`);
    }
  }

  // Track component renders
  trackRender(componentName) {
    const count = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, count + 1);
    
    // Log if excessive renders detected
    if (count > 50) {
      console.warn(`🚨 Excessive renders detected: ${componentName} rendered ${count + 1} times`);
    }
  }

  // Get performance summary
  getSummary() {
    const now = Date.now();
    const timeElapsed = (now - this.lastLogTime) / 1000;
    
    const summary = {
      timeElapsed: `${timeElapsed.toFixed(1)}s`,
      apiCalls: Object.fromEntries(this.apiCallCounts),
      renders: Object.fromEntries(this.renderCounts),
      totalApiCalls: Array.from(this.apiCallCounts.values()).reduce((a, b) => a + b, 0),
      totalRenders: Array.from(this.renderCounts.values()).reduce((a, b) => a + b, 0)
    };
    
    return summary;
  }

  // Log performance summary
  logSummary() {
    const summary = this.getSummary();
    
    console.group('📊 Performance Summary');
    console.log(`Time elapsed: ${summary.timeElapsed}`);
    console.log(`Total API calls: ${summary.totalApiCalls}`);
    console.log(`Total renders: ${summary.totalRenders}`);
    
    if (Object.keys(summary.apiCalls).length > 0) {
      console.log('API calls by endpoint:', summary.apiCalls);
    }
    
    if (Object.keys(summary.renders).length > 0) {
      console.log('Renders by component:', summary.renders);
    }
    
    // Performance warnings
    const warnings = [];
    
    Object.entries(summary.apiCalls).forEach(([endpoint, count]) => {
      if (count > 20) {
        warnings.push(`${endpoint}: ${count} calls (excessive)`);
      }
    });
    
    Object.entries(summary.renders).forEach(([component, count]) => {
      if (count > 100) {
        warnings.push(`${component}: ${count} renders (excessive)`);
      }
    });
    
    if (warnings.length > 0) {
      console.warn('⚠️ Performance warnings:', warnings);
    } else {
      console.log('✅ No performance issues detected');
    }
    
    console.groupEnd();
  }

  // Reset counters
  reset() {
    this.apiCallCounts.clear();
    this.renderCounts.clear();
    this.lastLogTime = Date.now();
  }

  // Start automatic logging
  startAutoLogging() {
    setInterval(() => {
      this.logSummary();
      this.reset();
    }, this.logInterval);
  }
}

// Create global instance
const performanceMonitor = new PerformanceMonitor();

// Auto-start in development mode
if (import.meta.env.DEV) {
  performanceMonitor.startAutoLogging();
  
  // Make available globally for debugging
  window.performanceMonitor = performanceMonitor;
}

export default performanceMonitor;

// Utility functions for easy tracking
export const trackApiCall = (endpoint) => performanceMonitor.trackApiCall(endpoint);
export const trackRender = (componentName) => performanceMonitor.trackRender(componentName);
export const getPerformanceSummary = () => performanceMonitor.getSummary();