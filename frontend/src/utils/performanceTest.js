// Performance testing utilities

/**
 * Test friend status caching
 */
export const testFriendStatusCaching = async (userId) => {
  console.log('🧪 Testing friend status caching...');
  
  const friendStore = (await import('../store/useFriendStore')).default;
  
  // First call - should hit API
  console.time('First call (API)');
  const result1 = await friendStore.getState().getStatus(userId);
  console.timeEnd('First call (API)');
  
  // Second call - should use cache
  console.time('Second call (cached)');
  const result2 = await friendStore.getState().getStatus(userId);
  console.timeEnd('Second call (cached)');
  
  console.log('Results match:', JSON.stringify(result1) === JSON.stringify(result2));
  console.log('✅ Friend status caching test completed');
  
  return { result1, result2, cached: JSON.stringify(result1) === JSON.stringify(result2) };
};

/**
 * Test render performance
 */
export const testRenderPerformance = () => {
  console.log('🧪 Testing render performance...');
  
  const performanceMonitor = window.performanceMonitor;
  if (!performanceMonitor) {
    console.warn('Performance monitor not available');
    return;
  }
  
  const summary = performanceMonitor.getSummary();
  console.log('Current performance summary:', summary);
  
  // Check for performance issues
  const issues = [];
  
  Object.entries(summary.apiCalls || {}).forEach(([endpoint, count]) => {
    if (count > 20) {
      issues.push(`${endpoint}: ${count} calls (excessive)`);
    }
  });
  
  Object.entries(summary.renders || {}).forEach(([component, count]) => {
    if (count > 100) {
      issues.push(`${component}: ${count} renders (excessive)`);
    }
  });
  
  if (issues.length === 0) {
    console.log('✅ No performance issues detected');
  } else {
    console.warn('⚠️ Performance issues found:', issues);
  }
  
  return { summary, issues };
};

/**
 * Comprehensive performance test
 */
export const runPerformanceTest = async (userId = null) => {
  console.group('🚀 Running Comprehensive Performance Test');
  
  try {
    // Test 1: Render performance
    console.log('\n1. Testing render performance...');
    const renderTest = testRenderPerformance();
    
    // Test 2: Friend status caching (if userId provided)
    let cachingTest = null;
    if (userId) {
      console.log('\n2. Testing friend status caching...');
      cachingTest = await testFriendStatusCaching(userId);
    } else {
      console.log('\n2. Skipping caching test (no userId provided)');
    }
    
    // Test 3: Memory usage
    console.log('\n3. Checking memory usage...');
    const memoryInfo = performance.memory ? {
      usedJSHeapSize: `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      totalJSHeapSize: `${(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      jsHeapSizeLimit: `${(performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
    } : 'Memory info not available';
    
    console.log('Memory usage:', memoryInfo);
    
    // Test 4: Network performance
    console.log('\n4. Checking network performance...');
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const networkInfo = connection ? {
      effectiveType: connection.effectiveType,
      downlink: `${connection.downlink} Mbps`,
      rtt: `${connection.rtt} ms`
    } : 'Network info not available';
    
    console.log('Network info:', networkInfo);
    
    // Summary
    console.log('\n📊 Performance Test Summary:');
    console.log('- Render performance:', renderTest.issues.length === 0 ? '✅ Good' : '⚠️ Issues found');
    console.log('- Caching system:', cachingTest ? (cachingTest.cached ? '✅ Working' : '❌ Failed') : '⏭️ Skipped');
    console.log('- Memory usage:', memoryInfo !== 'Memory info not available' ? '✅ Available' : '⚠️ Limited');
    console.log('- Network info:', networkInfo !== 'Network info not available' ? '✅ Available' : '⚠️ Limited');
    
    const results = {
      renderTest,
      cachingTest,
      memoryInfo,
      networkInfo,
      timestamp: new Date().toISOString()
    };
    
    console.log('\n🎯 Full results:', results);
    
    return results;
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return { error: error.message };
  } finally {
    console.groupEnd();
  }
};

// Make available globally in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.testFriendStatusCaching = testFriendStatusCaching;
  window.testRenderPerformance = testRenderPerformance;
  window.runPerformanceTest = runPerformanceTest;
  
  console.log('🧪 Performance testing utilities loaded:');
  console.log('- window.testFriendStatusCaching(userId)');
  console.log('- window.testRenderPerformance()');
  console.log('- window.runPerformanceTest(userId)');
}