'use client';

import React from 'react';

interface Props {
  isConnected: boolean;
}

export const RealtimeStatusBadge: React.FC<Props> = ({ isConnected }) => {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border bg-white shadow-sm">
      <span className="relative flex h-2.5 w-2.5">
        {isConnected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            isConnected ? 'bg-emerald-500' : 'bg-amber-400'
          }`}
        ></span>
      </span>
      <span className={isConnected ? 'text-emerald-700' : 'text-amber-700'}>
        {isConnected ? 'Supabase Realtime Activo' : 'Conectando WebSocket...'}
      </span>
    </div>
  );
};
