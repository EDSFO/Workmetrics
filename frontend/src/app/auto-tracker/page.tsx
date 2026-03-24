'use client';

import AutoTracker from '@/components/AutoTracker';

export default function AutoTrackerPage() {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Rastreador Automático</h1>
        <AutoTracker />
      </div>
    </div>
  );
}
