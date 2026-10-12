import React, { useState, useRef, useEffect } from 'react';
import { Send, X, ShieldAlert, Phone } from 'lucide-react';
import { ChatMessage, Driver } from '../../lib/types';
import { movoStore } from '../../services/movoStore';

interface ChatModalProps {
  driver: Driver;
  messages: ChatMessage[];
  onClose: () => void;
}

export function ChatModal({ driver, messages, onClose }: ChatModalProps) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    movoStore.sendChatMessage(input.trim(), 'rider');
    setInput('');
  };

  const quickReplies = [
    "I'm waiting at the main entrance",
    "Wearing a dark coat",
    "Running 1 minute late",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col h-[520px] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E7E7E2] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <img
              src={driver.avatar}
              alt={driver.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
            />
            <div>
              <h4 className="text-xs font-bold text-[#0E1116]">{driver.name}</h4>
              <p className="text-[11px] text-teal-700 font-medium">
                {driver.vehicle.make} {driver.vehicle.model} · {driver.vehicle.plate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${driver.phone}`}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200"
              title="Call driver"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F7F7F4]/60">
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} className="text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-200/70 text-[10px] text-slate-600 font-medium">
                    {msg.text}
                  </span>
                </div>
              );
            }
            const isMe = msg.sender === 'rider';
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs ${
                    isMe
                      ? 'bg-slate-900 text-white rounded-br-xs'
                      : 'bg-white border border-[#E7E7E2] text-[#0E1116] rounded-bl-xs shadow-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      isMe ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Quick reply chips */}
        <div className="px-3 py-2 bg-white border-t border-[#E7E7E2] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickReplies.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                movoStore.sendChatMessage(q, 'rider');
              }}
              className="px-2.5 py-1 text-[11px] rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 whitespace-nowrap shrink-0 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#E7E7E2] flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${driver.name.split(' ')[0]}...`}
            className="flex-1 px-3.5 py-2 text-xs bg-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF5A36] text-slate-800"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-9 h-9 rounded-xl bg-gradient-sunrise text-white flex items-center justify-center disabled:opacity-40 hover:opacity-95 shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
