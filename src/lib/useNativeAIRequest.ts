import { useEffect, useRef, useState } from 'react';

/** Own one authenticated native request and discard its response after cancellation. */
export default function useNativeAIRequest<T = unknown>() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);
  function clear() { setResult(null); setError(''); setStatus(''); }
  function cancel() {
    request.current?.abort(); request.current = null; setLoading(false); setResult(null); setError('');
    setStatus('Request canceled. Your inputs are ready to edit.');
  }
  async function run(action: (signal: AbortSignal) => Promise<T>) {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    clear(); setLoading(true);
    try {
      const response = await action(controller.signal);
      if (!controller.signal.aborted) setResult(response);
    } catch (cause: any) {
      if (!controller.signal.aborted) setError(cause?.response?.data?.error || cause?.message || 'Could not generate the report.');
    } finally {
      if (request.current === controller) { request.current = null; setLoading(false); }
    }
  }
  return { loading, result, error, status, run, clear, cancel, setStatus, setError };
}
