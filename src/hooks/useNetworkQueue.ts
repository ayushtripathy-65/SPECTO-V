import { useState, useEffect, useCallback, useRef } from 'react';

export interface QueuedRequest {
  id: string;
  endpoint: string;
  payload: Record<string, any>;
  timestamp: string;
  label: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
}

export function useNetworkQueue(onDrainRequest?: (req: QueuedRequest) => Promise<boolean>) {
  const [isPhysicalOnline, setIsPhysicalOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [lastPingTime, setLastPingTime] = useState<string>('');
  const [queuedRequests, setQueuedRequests] = useState<QueuedRequest[]>([]);
  const isDrainingRef = useRef(false);

  const effectiveOnline = isPhysicalOnline && !isSimulatedOffline;

  // Actual ping checker
  const performPing = useCallback(async () => {
    if (isSimulatedOffline) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('/api/health', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        setIsPhysicalOnline(true);
        setLastPingTime(new Date().toLocaleTimeString());
      } else {
        setIsPhysicalOnline(false);
      }
    } catch {
      setIsPhysicalOnline(false);
    }
  }, [isSimulatedOffline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsPhysicalOnline(true);
      performPing();
    };
    const handleOffline = () => setIsPhysicalOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial ping & periodic check
    performPing();
    const interval = setInterval(performPing, 8000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [performPing]);

  // Queue a minimized payload
  const enqueueRequest = useCallback(
    (endpoint: string, payload: Record<string, any>, label: string) => {
      const newReq: QueuedRequest = {
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        endpoint,
        payload,
        timestamp: new Date().toLocaleTimeString(),
        label,
        status: 'PENDING',
      };
      setQueuedRequests(prev => [...prev, newReq]);
      return newReq;
    },
    []
  );

  // Drain the queue automatically when coming back online
  useEffect(() => {
    if (effectiveOnline && queuedRequests.length > 0 && !isDrainingRef.current && onDrainRequest) {
      isDrainingRef.current = true;
      const processQueue = async () => {
        const remaining: QueuedRequest[] = [];
        for (const req of queuedRequests) {
          try {
            const success = await onDrainRequest(req);
            if (!success) {
              remaining.push({ ...req, status: 'FAILED' });
            }
          } catch {
            remaining.push({ ...req, status: 'FAILED' });
          }
        }
        setQueuedRequests(remaining);
        isDrainingRef.current = false;
      };
      processQueue();
    }
  }, [effectiveOnline, queuedRequests, onDrainRequest]);

  const clearQueue = useCallback(() => {
    setQueuedRequests([]);
  }, []);

  return {
    isPhysicalOnline,
    isSimulatedOffline,
    setIsSimulatedOffline,
    effectiveOnline,
    lastPingTime,
    queuedRequests,
    enqueueRequest,
    clearQueue,
    performPing,
  };
}
