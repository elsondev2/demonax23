// Quick call testing utility

/**
 * Quick test to verify incoming call modal works
 */
export const quickIncomingCallTest = () => {
  console.log('🚀 QUICK INCOMING CALL TEST');
  console.log('===========================');
  
  try {
    // Check if stores are available
    if (!window.useCallStore) {
      console.error('❌ Call store not available');
      return false;
    }
    
    const callStore = window.useCallStore;
    
    // 1. Reset state
    console.log('1. Resetting call state...');
    callStore.getState().endCall('cleanup');
    
    // 2. Force incoming call
    setTimeout(() => {
      console.log('2. Triggering incoming call...');
      
      const mockCall = {
        from: 'quick-test-caller',
        callType: 'voice',
        offer: { type: 'offer', sdp: 'mock-sdp' },
        callerInfo: {
          _id: 'quick-test-caller',
          fullName: 'Quick Test Caller',
          profilePic: null
        }
      };
      
      // Set state directly
      callStore.setState({
        callStatus: 'ringing',
        callDirection: 'incoming',
        caller: mockCall.from,
        callerInfo: mockCall.callerInfo,
        callType: mockCall.callType,
        incomingOffer: mockCall.offer,
        showIncomingCall: true,
        showCallModal: true,
        lastUpdate: Date.now()
      });
      
      console.log('3. State set, checking result...');
      
      // Check result
      setTimeout(() => {
        const state = callStore.getState();
        const modal = document.querySelector('[data-call-modal="incoming"]');
        
        console.log('4. Test Results:');
        console.log('   - Call Status:', state.callStatus);
        console.log('   - Show Incoming Call:', state.showIncomingCall);
        console.log('   - Show Call Modal:', state.showCallModal);
        console.log('   - Modal in DOM:', !!modal);
        
        if (state.showIncomingCall && modal) {
          console.log('✅ SUCCESS: Incoming call modal is working!');
          console.log('   You should see the modal with accept/reject buttons');
          return true;
        } else {
          console.log('❌ FAILED: Modal not showing properly');
          if (!state.showIncomingCall) {
            console.log('   Issue: showIncomingCall is false');
          }
          if (!modal) {
            console.log('   Issue: Modal not found in DOM');
          }
          return false;
        }
      }, 300);
      
    }, 100);
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return false;
  }
};

/**
 * Monitor call state for stability
 */
export const monitorCallState = (duration = 5000) => {
  console.log('🔍 MONITORING CALL STATE FOR', duration / 1000, 'SECONDS');
  console.log('==========================================');
  
  const callStore = window.useCallStore;
  if (!callStore) {
    console.error('❌ Call store not available');
    return;
  }
  
  const startTime = Date.now();
  const stateChanges = [];
  
  const checkState = () => {
    const state = callStore.getState();
    const elapsed = Date.now() - startTime;
    
    stateChanges.push({
      time: elapsed,
      callStatus: state.callStatus,
      showIncomingCall: state.showIncomingCall,
      showCallModal: state.showCallModal,
      lastUpdate: state.lastUpdate
    });
    
    console.log(`[${elapsed}ms]`, {
      callStatus: state.callStatus,
      showIncomingCall: state.showIncomingCall,
      showCallModal: state.showCallModal
    });
  };
  
  // Check every 100ms
  const interval = setInterval(checkState, 100);
  
  // Stop after duration
  setTimeout(() => {
    clearInterval(interval);
    
    console.log('==========================================');
    console.log('📊 MONITORING COMPLETE');
    console.log('Total state changes:', stateChanges.length);
    
    // Analyze stability
    const statusChanges = stateChanges.filter((s, i) => 
      i > 0 && s.callStatus !== stateChanges[i-1].callStatus
    );
    
    const modalToggles = stateChanges.filter((s, i) => 
      i > 0 && s.showIncomingCall !== stateChanges[i-1].showIncomingCall
    );
    
    console.log('Status changes:', statusChanges.length);
    console.log('Modal toggles:', modalToggles.length);
    
    if (statusChanges.length === 0 && modalToggles.length === 0) {
      console.log('✅ STATE IS STABLE - No unexpected changes');
    } else {
      console.log('⚠️ STATE IS UNSTABLE - Unexpected changes detected');
      console.log('Status changes:', statusChanges);
      console.log('Modal toggles:', modalToggles);
    }
  }, duration);
};

// Make available globally
if (typeof window !== 'undefined') {
  window.quickIncomingCallTest = quickIncomingCallTest;
  window.monitorCallState = monitorCallState;
  console.log('🧪 Quick call test loaded:');
  console.log('- window.quickIncomingCallTest() - Test modal');
  console.log('- window.monitorCallState(5000) - Monitor state stability');
}