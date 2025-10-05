import { useCallback, useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/useChatStore';

/**
 * Hook to diagnose message rendering issues by comparing
 * expected messages vs actually rendered messages
 */
export const useMessageRenderingDiagnostics = (containerRef) => {
    const { messages, diagnoseMessageRendering, updateRenderingStats } = useChatStore();
    const [renderingStats, setRenderingStats] = useState({
        expectedCount: 0,
        renderedCount: 0,
        mismatch: false,
        reasons: []
    });

    const lastCheckRef = useRef(0);

    const checkMessageRendering = useCallback(() => {
        if (!containerRef?.current) return;

        const expectedCount = messages.length;
        const container = containerRef.current;

        // Count actual rendered message elements
        // Look for elements with message-specific attributes or classes
        const renderedMessages = container.querySelectorAll('[data-message-id], .message-item, [role="listitem"]');
        const renderedCount = renderedMessages.length;

        const mismatch = expectedCount !== renderedCount;
        const reasons = [];

        if (mismatch) {
            // Analyze potential reasons for mismatch
            if (renderedCount === 0 && expectedCount > 0) {
                reasons.push('No messages rendered despite having messages in store');
                reasons.push('Check if message container is properly mounted');
                reasons.push('Verify message rendering component is working');
            } else if (renderedCount < expectedCount) {
                reasons.push(`${expectedCount - renderedCount} messages missing from DOM`);
                reasons.push('Some messages may have rendering errors');
                reasons.push('Check for conditional rendering logic');
                reasons.push('Verify message data integrity');
            } else if (renderedCount > expectedCount) {
                reasons.push(`${renderedCount - expectedCount} extra elements in DOM`);
                reasons.push('Possible duplicate message rendering');
                reasons.push('Check for memory leaks or stale elements');
            }

            // Check for common rendering issues
            const messagesWithoutIds = Array.from(renderedMessages).filter(el => !el.getAttribute('data-message-id'));
            if (messagesWithoutIds.length > 0) {
                reasons.push(`${messagesWithoutIds.length} rendered messages missing data-message-id`);
            }

            // Check for invisible messages
            const invisibleMessages = Array.from(renderedMessages).filter(el => {
                const style = window.getComputedStyle(el);
                return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
            });
            if (invisibleMessages.length > 0) {
                reasons.push(`${invisibleMessages.length} messages are hidden/invisible`);
            }

            // Run store diagnostics if there's a mismatch
            diagnoseMessageRendering();
        }

        const newStats = {
            expectedCount,
            renderedCount,
            mismatch,
            reasons,
            lastCheck: new Date().toISOString()
        };

        setRenderingStats(newStats);
        updateRenderingStats(newStats);

        // Log significant mismatches
        if (mismatch && Math.abs(expectedCount - renderedCount) > 1) {
            console.warn('🚨 Message Rendering Mismatch:', newStats);
        }

        lastCheckRef.current = Date.now();
    }, [containerRef, messages, diagnoseMessageRendering, updateRenderingStats]);

    // Manual check function
    const forceCheck = () => {
        checkMessageRendering();
    };

    return {
        renderingStats,
        forceCheck
    };
};

export default useMessageRenderingDiagnostics;