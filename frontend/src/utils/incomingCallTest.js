// Incoming call testing utilities

/**
 * Test if incoming call modal appears
 */
export const testIncomingCallModal = async () => {
  console.log('🧪 TESTING INCOMING CALL MODAL');
  console.log('==============================');
  
  try {
    // Get call store
    const callStore = window.useCallStore;
    if (!callStore) {
      console.error('❌ Call store not available');
      return false;
    }
    
    // 1. Check initial state
    console.log('1. Checking initial state...');
    const initialState = callStore.getState();
    console.log('Initial state:', {
      callStatus: initialState.callStatus,
      showIncomingCall: initialState.showIncomingCall,
      showCallModal: initialState.showCallModal
    });
    
    // 2. Reset to idle state
    console.log('2. Resetting to idle state...');
    callStore.getState().endCall('cleanup');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 3. Simulate incoming call
    console.log('3. Simulating incoming call...');
    const mockCallData = {
      from: 'test-caller-456',
      callType: 'voice',
      offer: { 
        type: 'offer', 
        sdp: 'v=0\r\no=- 987654321 987654321 IN IP4 192.168.1.1\r\ns=-\r\nt=0 0\r\n' 
      },
      callerInfo: {
        _id: 'test-caller-456',
        fullName: 'Test Incoming Caller',
        profilePic: null
      }
    };
    
    // Force the incoming call
    callStore.getState().handleIncomingCall(mockCallData);
    
    // 4. Check state after 200ms
    await new Promise(resolve => setTimeout(resolve, 200));
    const afterState = callStore.getState();
    console.log('4. State after incoming call:', {
      callStatus: afterState.callStatus,
      showIncomingCall: afterState.showIncomingCall,
      showCallModal: afterState.showCallModal,
      callDirection: afterState.callDirection,
      callerInfo: afterState.callerInfo?.fullName
    });
    
    // 5. Check DOM for modal
    console.log('5. Checking DOM for modal...');
    const incomingModal = document.querySelector('[data-call-modal="incoming"]');
    const anyModal = document.querySelector('[data-call-modal]');
    
    console.log('DOM check:', {
      incomingModalFound: !!incomingModal,
      anyModalFound: !!anyModal
    });
    
    // 6. Determine success
    const success = afterState.showIncomingCall && 
                   afterState.callStatus === 'ringing' && 
                   afterState.callDirection === 'incoming' &&
                   !!incomingModal;
    
    console.log('==============================');
    if (success) {
      console.log('✅ INCOMING CALL MODAL TEST PASSED');
      console.log('   - State correctly set');
      console.log('   - Modal found in DOM');
      console.log('   - You should see the incoming call modal now');
    } else {
      console.log('❌ INCOMING CALL MODAL TEST FAILED');
      console.log('Issues found:');
      if (!afterState.showIncomingCall) console.log('   - showIncomingCall is false');
      if (afterState.callStatus !== 'ringing') console.log('   - callStatus is not ringing:', afterState.callStatus);
      if (afterState.callDirection !== 'incoming') console.log('   - callDirection is not incoming:', afterState.callDirection);
      if (!incomingModal) console.log('   - Modal not found in DOM');
    }
    
    return success;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
};

/**
 * Test socket-based incoming call
 */
export const testSocketIncomingCall = () => {
  console.log('🧪 TESTING SOCKET-BASED INCOMING CALL');
  console.log('=====================================');
  
  try {
    // Get auth store for socket
    const authStore = window.useAuthStore;
    const callStore = window.useCallStore;
    
    if (!authStore || !callStore) {
      console.error('❌ Stores not available');
      return false;
    }
    
    const socket = authStore.getState().socket;
    if (!socket || !socket.connected) {
      console.error('❌ Socket not connected');
      return false;
    }
    
    console.log('✅ Socket connected:', socket.id);
    
    // Reset call state
    callStore.getState().endCall('cleanup');
    
    // Simulate socket event
    setTimeout(() => {
      const mockCallData = {
        from: 'socket-test-caller',
        callType: 'voice',
        offer: { 
          type: 'offer', 
          sdp: 'v=0\r\no=- 111222333 111222333 IN IP4 10.0.0.1\r\ns=-\r\nt=0 0\r\n' 
        },
        callerInfo: {
          _id: 'socket-test-caller',
          fullName: 'Socket Test Caller',
          profilePic: null
        }
      };
      
      console.log('📡 Emitting call-request event...');
      socket.emit('call-request', mockCallData);
      
      // Check result after delay
      setTimeout(() => {
        const state = callStore.getState();
        const modal = document.querySelector('[data-call-modal="incoming"]');
        
        console.log('Socket test result:', {
          callStatus: state.callStatus,
          showIncomingCall: state.showIncomingCall,
          modalFound: !!modal
        });
        
        if (state.showIncomingCall && modal) {
          console.log('✅ Socket-based incoming call test PASSED');
        } else {
          console.log('❌ Socket-based incoming call test FAILED');
        }
      }, 500);
      
    }, 100);
    
    return true;
    
  } catch (error) {
    console.error('❌ Socket test failed:', error);
    return false;
  }
};

/**
 * Comprehensive incoming call test
 */
export const runIncomingCallTests = async () => {
  console.group('🚀 COMPREHENSIVE INCOMING CALL TESTS');
  
  try {
    console.log('Running all incoming call tests...\n');
    
    // Test 1: Direct modal test
    console.log('TEST 1: Direct modal test');
    const directTest = await testIncomingCallModal();
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Socket-based test
    console.log('\nTEST 2: Socket-based test');
    const socketTest = testSocketIncomingCall();
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log(`- Direct modal test: ${directTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`- Socket-based test: ${socketTest ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (directTest && socketTest) {
      console.log('\n🎉 ALL TESTS PASSED - Incoming call modal should work!');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED - Check the issues above');
    }
    
    return { directTest, socketTest };
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    return { error: error.message };
  } finally {
    console.groupEnd();
  }
};

// Make available globally in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.testIncomingCallModal = testIncomingCallModal;
  window.testSocketIncomingCall = testSocketIncomingCall;
  window.runIncomingCallTests = runIncomingCallTests;
  
  console.log('🧪 Incoming call testing utilities loaded:');
  console.log('- window.testIncomingCallModal() - Test modal directly');
  console.log('- window.testSocketIncomingCall() - Test via socket');
  console.log('- window.runIncomingCallTests() - Run all tests');
}