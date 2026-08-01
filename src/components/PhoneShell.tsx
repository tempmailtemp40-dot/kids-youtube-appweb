import React from 'react';
import { Smartphone, Battery, Wifi, Signal } from 'lucide-react';

interface PhoneShellProps {
  title: string;
  badgeText?: string;
  badgeColor?: string;
  children: React.ReactNode;
  headerColor?: string;
  isStandalone?: boolean;
}

export const PhoneShell: React.FC<PhoneShellProps> = ({
  title,
  badgeText,
  badgeColor = 'bg-red-600',
  children,
  headerColor = 'bg-zinc-900',
  isStandalone = false,
}) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={`mx-auto transition-all ${
        isStandalone
          ? 'w-full max-w-5xl rounded-3xl shadow-2xl border-4 border-zinc-800 overflow-hidden bg-zinc-950'
          : 'w-full max-w-md h-[820px] rounded-[42px] shadow-2xl border-[10px] border-zinc-800 bg-zinc-950 flex flex-col relative overflow-hidden'
      }`}
    >
      {/* Android Top Phone Speaker / Notch */}
      <div className="bg-zinc-950 pt-2 pb-1 px-6 flex justify-between items-center text-zinc-400 text-xs border-b border-zinc-800/80 select-none z-20">
        <span className="font-semibold text-[11px] text-zinc-200">{currentTime}</span>
        
        {/* Camera Hole */}
        <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 border border-zinc-700/80 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-950"></div>
        </div>

        <div className="flex items-center space-x-1.5 text-[11px]">
          <Wifi className="w-3.5 h-3.5 text-zinc-300" />
          <Signal className="w-3.5 h-3.5 text-zinc-300" />
          <div className="flex items-center space-x-0.5">
            <span className="text-[10px]">98%</span>
            <Battery className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          </div>
        </div>
      </div>

      {/* Android App Header Bar */}
      <div className={`${headerColor} text-white px-4 py-2.5 flex items-center justify-between border-b border-zinc-800 shadow-sm z-10 select-none`}>
        <div className="flex items-center space-x-2">
          <Smartphone className="w-4 h-4 text-zinc-400" />
          <h2 className="font-bold text-sm tracking-wide">{title}</h2>
        </div>
        {badgeText && (
          <span className={`${badgeColor} text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm`}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Phone App Content View Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-zinc-900 text-zinc-100 flex flex-col">
        {children}
      </div>

      {/* Android Bottom Navigation Gestures Bar */}
      <div className="bg-zinc-950 py-2 border-t border-zinc-800/80 flex justify-center items-center select-none z-20">
        <div className="w-32 h-1 bg-zinc-600/80 rounded-full"></div>
      </div>
    </div>
  );
};
