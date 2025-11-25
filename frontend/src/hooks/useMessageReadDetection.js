import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';

/**
 * IMPROVED Automatic message read detection hook
 * 
 * Key improvements:
 * - Instant read detection (no 1-second delay)
 * - Batch processing to reduce socket emissions
 * - Simpler state management
 * - Better performance with debouncing
 * 
 * Usage:
 * const { observeMessage } = useMessageReadDetection(conversationId, isGroup);
 * <div ref={(el) => observeMessage(el, message)}>...</div>
 */
export const useMessageReadDetection = (conversationId, isGroup = false) => {
  const observerRef = useRef(null);
  const markedAsReadRef = useRef(new Set());
  const pendingReadsRef = useRef(new Set());
  const batchTimerRef = useRef(null);

  // Batch mark messages as read (reduces socket emissions)
  const flushPendingReads = useCallback(() => {
    if (pendingReadsRef.current.size === 0) return;

    const { socket } = useAuthStore.getState();
    if (!socket || !socket.connected || !conversationId) {
      pendingReadsRef.current.clear();
      return;
    }

    // Convert to array and emit batch
    const messageIds = Array.from(pendingReadsRef.current);
    
    // Emit batch read event
    socket.emit('markAsReadBatch', {
      messageIds,
      conversationId,
      isGroup
    });

    console.log('📖 Batch marked messages as read:', messageIds.length);

    // Add to marked set
    messageIds.forEach(id => markedAsReadRef.current.add(id));
    
    // Clear pending
    pendingReadsRef.current.clear();
  }, [conversationId, isGroup]);

  // Schedule batch flush
  const scheduleBatchFlush = useCallback(() => {
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
    }

    // Flush after 300ms of no new reads (debounce)
    batchTimerRef.current = setTimeout(() => {
      flushPendingReads();
    }, 300);
  }, [flushPendingReads]);

  // Initialize IntersectionObserver
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        let hasNewReads = false;

        entries.forEach((entry) => {
          const messageId = entry.target.dataset.messageId;
          const isOwnMessage = entry.target.dataset.isOwnMessage === 'true';
          
          // Don't mark own messages as read
          if (isOwnMessage || !messageId) {
            return;
          }

          // Already marked as read
          if (markedAsReadRef.current.has(messageId)) {
            return;
          }

          // Message is visible (at least 50% in viewport) - mark immediately
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            pendingReadsRef.current.add(messageId);
            hasNewReads = true;
          }
        });

        // Schedule batch flush if we have new reads
        if (hasNewReads) {
          scheduleBatchFlush();
        }
      },
      {
        threshold: [0.5], // Only trigger at 50% visibility
        rootMargin: '0px'
      }
    );

    return () => {
      // Cleanup
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      // Flush any pending reads before unmounting
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
      flushPendingReads();
    };
  }, [scheduleBatchFlush, flushPendingReads]);

  // Reset marked messages when conversation changes
  useEffect(() => {
    // Flush pending reads for previous conversation
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
    }
    flushPendingReads();
    
    // Clear marked set for new conversation
    markedAsReadRef.current.clear();
    pendingReadsRef.current.clear();
  }, [conversationId, flushPendingReads]);

  // Function to observe a message element
  const observeMessage = useCallback((element, message) => {
    if (!element || !message || !observerRef.current) {
      return;
    }

    const { authUser } = useAuthStore.getState();
    const senderId = typeof message.senderId === 'object' ? message.senderId._id : message.senderId;
    const isOwnMessage = senderId === authUser?._id;

    // Set data attributes for the observer
    element.dataset.messageId = message._id;
    element.dataset.isOwnMessage = isOwnMessage;

    // Start observing
    observerRef.current.observe(element);

    // Return cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.unobserve(element);
      }
    };
  }, []);

  return { observeMessage };
};
