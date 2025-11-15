import React, { useState } from 'react';
import { XIcon, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import IOSModal from './IOSModal';
import { runAudioTests, quickAudioTest } from '../utils/audioTest';

const AudioTestModal = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const runTests = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      const testResults = await runAudioTests();
      setResults(testResults);
    } catch (error) {
      setResults({
        error: true,
        message: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runQuickTest = async () => {
    setIsRunning(true);
    
    try {
      const success = await quickAudioTest();
      setResults({
        quickTest: true,
        success,
        message: success ? 'Audio access successful!' : 'Audio access failed'
      });
    } catch (error) {
      setResults({
        quickTest: true,
        success: false,
        message: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
      case true:
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'failed':
      case false:
        return <XCircle className="w-4 h-4 text-error" />;
      default:
        return <AlertCircle className="w-4 h-4 text-warning" />;
    }
  };

  if (!isOpen) return null;

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="flex flex-col h-full bg-base-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <div className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Audio & WebRTC Test</h3>
          </div>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Test Buttons */}
            <div className="flex gap-2">
              <button
                className="btn btn-primary"
                onClick={runQuickTest}
                disabled={isRunning}
              >
                {isRunning ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Quick Test'
                )}
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={runTests}
                disabled={isRunning}
              >
                {isRunning ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Full Test'
                )}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {results.error && (
                  <div className="alert alert-error">
                    <XCircle className="w-5 h-5" />
                    <span>Test failed: {results.message}</span>
                  </div>
                )}

                {results.quickTest && (
                  <div className={`alert ${results.success ? 'alert-success' : 'alert-error'}`}>
                    {getStatusIcon(results.success)}
                    <span>{results.message}</span>
                  </div>
                )}

                {results.microphone && (
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title flex items-center gap-2">
                        {getStatusIcon(results.microphone.success)}
                        Microphone Test
                      </h4>
                      
                      {results.microphone.success ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(results.microphone.recordingSupported)}
                            <span>Voice Recording: {results.microphone.recordingSupported ? 'Supported' : 'Not Supported'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(results.microphone.callSupported)}
                            <span>Voice Calls: {results.microphone.callSupported ? 'Supported' : 'Not Supported'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(results.microphone.advancedProcessing)}
                            <span>Advanced Processing: {results.microphone.advancedProcessing ? 'Available' : 'Not Available'}</span>
                          </div>
                          <div className="text-sm opacity-70">
                            Best Format: {results.microphone.bestFormat?.mimeType} @ {results.microphone.bestFormat?.audioBitsPerSecond}bps
                          </div>
                        </div>
                      ) : (
                        <div className="text-error">
                          {results.microphone.message}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {results.webrtc && (
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title flex items-center gap-2">
                        {getStatusIcon(results.webrtc.success)}
                        WebRTC Connection Test
                      </h4>
                      
                      {results.webrtc.success ? (
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium">STUN Servers: </span>
                            <span className="text-success">{results.webrtc.workingStunServers} working</span>
                          </div>
                          
                          {results.webrtc.stunResults?.map((result, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              {getStatusIcon(result.status)}
                              <span>{result.server}</span>
                            </div>
                          ))}
                          
                          {results.webrtc.turnResults?.map((result, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              {getStatusIcon(result.status)}
                              <span>{result.server}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-error">
                          WebRTC test failed: {results.webrtc.error}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {results.browser && (
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title">Browser Support</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(results.browser.webrtcSupport)}
                          <span>WebRTC: {results.browser.webrtcSupport ? 'Supported' : 'Not Supported'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(results.browser.getUserMediaSupport)}
                          <span>getUserMedia: {results.browser.getUserMediaSupport ? 'Supported' : 'Not Supported'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(results.browser.audioContextSupport)}
                          <span>AudioContext: {results.browser.audioContextSupport ? 'Supported' : 'Not Supported'}</span>
                        </div>
                        <div className="text-xs opacity-70 mt-2">
                          {results.browser.userAgent}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title">Test Instructions</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Quick Test:</strong> Tests basic microphone access with enhanced constraints.</p>
                  <p><strong>Full Test:</strong> Comprehensive test of microphone, WebRTC, and browser capabilities.</p>
                  <p><strong>Note:</strong> You may be prompted to allow microphone access during testing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </IOSModal>
  );
};

export default AudioTestModal;