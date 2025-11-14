'use client';

import { useEffect, useRef, useState } from 'react';
import { useSarcasticPopup } from '@/components/sarcastic-popup';

const INTERVAL_MS = 60_000; // 1 minute

export function DemotivationTimer() {
  const { showWarning, PopupComponent } = useSarcasticPopup();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [enabled] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const fetchAndShow = async () => {
      try {
        const res = await fetch('/api/demotivational-quote', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const msg: string | undefined = data?.quote;
        if (msg && typeof msg === 'string') {
          showWarning(msg);
        }
      } catch {}
    };

    // Show first after 1 minute to avoid immediate annoyance
    timerRef.current = setInterval(fetchAndShow, INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, showWarning]);

  return <>{PopupComponent}</>;
}

