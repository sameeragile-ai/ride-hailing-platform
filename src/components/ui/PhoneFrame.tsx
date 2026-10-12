import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

export interface PhoneFrameProps {
  type: 'ios' | 'android';
  title?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

export function PhoneFrame({
  type,
  title,
  badge,
  children,
}: PhoneFrameProps) {
  // Current time formatted for realistic phone clock
  const timeStr = '09:41';

  if (type === 'ios') {
    return (
      <div className="flex flex-col items-center">
        {/* Header label above device */}
        {title && (
          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              {title}
            </span>
            {badge && (
              <span className="text-[10px] font-medium text-slate-500">
                · {badge}
              </span>
            )}
          </div>
        )}

        {/* iPhone Chassis */}
        <div className="relative w-[375px] h-[780px] bg-black rounded-[50px] p-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.1)_inset] border-4 border-[#2c2c2e]">
          {/* Subtle volume / power buttons on outer edges */}
          <div className="absolute -left-[6px] top-28 h-10 w-[3px] bg-[#3a3a3c] rounded-l-sm" />
          <div className="absolute -left-[6px] top-42 h-10 w-[3px] bg-[#3a3a3c] rounded-l-sm" />
          <div className="absolute -right-[6px] top-32 h-14 w-[3px] bg-[#3a3a3c] rounded-r-sm" />

          {/* Screen Content Container */}
          <div className="relative w-full h-full bg-[#F7F7F4] rounded-[40px] overflow-hidden flex flex-col select-none">
            {/* iOS Status Bar */}
            <div className="relative z-50 flex items-center justify-between px-7 pt-3.5 pb-2 text-[13px] font-semibold text-slate-900 pointer-events-none bg-transparent">
              <span>{timeStr}</span>
              {/* Dynamic Island */}
              <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-24 h-6 bg-black rounded-full flex items-center justify-end pr-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1c1c1e] ring-1 ring-[#2c2c2e]" />
              </div>
              <div className="flex items-center gap-1.5 text-slate-800">
                <Signal className="w-3.5 h-3.5 stroke-[2.5]" />
                <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
                <Battery className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* App Viewport */}
            <div className="relative flex-1 overflow-hidden flex flex-col">
              {children}
            </div>

            {/* iOS Home Indicator Bar */}
            <div className="relative z-50 h-5 w-full flex items-center justify-center pointer-events-none bg-transparent">
              <div className="w-32 h-1 bg-slate-900/30 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android Chassis
  return (
    <div className="flex flex-col items-center">
      {/* Header label above device */}
      {title && (
        <div className="mb-2.5 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            {title}
          </span>
          {badge && (
            <span className="text-[10px] font-medium text-slate-500">
              · {badge}
            </span>
          )}
        </div>
      )}

      {/* Android Chassis */}
      <div className="relative w-[375px] h-[780px] bg-[#1a1c20] rounded-[42px] p-[8px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.08)_inset] border-4 border-[#2a2d33]">
        {/* Physical buttons */}
        <div className="absolute -right-[6px] top-28 h-12 w-[3px] bg-[#3a3d45] rounded-r-sm" />
        <div className="absolute -right-[6px] top-44 h-20 w-[3px] bg-[#3a3d45] rounded-r-sm" />

        {/* Screen Content Container */}
        <div className="relative w-full h-full bg-[#F7F7F4] rounded-[34px] overflow-hidden flex flex-col select-none">
          {/* Android Status Bar with centered punch-hole camera */}
          <div className="relative z-50 flex items-center justify-between px-6 pt-2.5 pb-2 text-[12px] font-medium text-slate-800 pointer-events-none bg-transparent">
            <span>09:41</span>
            {/* Camera punch-hole */}
            <div className="w-3.5 h-3.5 bg-black rounded-full ring-1 ring-slate-800" />
            <div className="flex items-center gap-1.5 text-slate-700">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* App Viewport */}
          <div className="relative flex-1 overflow-hidden flex flex-col">
            {children}
          </div>

          {/* Android Gesture Navigation Bar */}
          <div className="relative z-50 h-4 w-full flex items-center justify-center pointer-events-none bg-transparent">
            <div className="w-20 h-1 bg-slate-900/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
