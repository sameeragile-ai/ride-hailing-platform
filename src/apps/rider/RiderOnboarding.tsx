import React, { useState } from 'react';
import { ArrowRight, Phone, CheckCircle, ShieldCheck } from 'lucide-react';
import { Rider } from '../../lib/types';

interface RiderOnboardingProps {
  onComplete: (data: { name: string; phone: string; avatar: string }) => void;
  onSkip: () => void;
}

export function RiderOnboarding({ onComplete, onSkip }: RiderOnboardingProps) {
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phone, setPhone] = useState('+49 176 8920194');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('Maximilian Krause');
  const [avatar, setAvatar] = useState(
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&h=256&q=80'
  );

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length > 6) setStep('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) setStep('profile');
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete({ name, phone, avatar });
    }
  };

  return (
    <div className="h-full w-full bg-[#F7F7F4] p-5 flex flex-col justify-between overflow-y-auto">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-sunrise flex items-center justify-center text-white font-heading font-black text-sm shadow-xs">
              M
            </div>
            <span className="font-heading font-bold text-sm tracking-tight text-[#0E1116]">Movo Rider</span>
          </div>
          <button
            onClick={onSkip}
            className="text-xs text-slate-500 font-medium hover:text-slate-900"
          >
            Demo Sign-In
          </button>
        </div>

        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#0E1116]">What's your number?</h2>
              <p className="text-xs text-slate-500 mt-1">
                We'll text you a verification code to confirm your ride account.
              </p>
            </div>

            <div className="pt-2">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Mobile Number
              </label>
              <div className="flex items-center border border-slate-200 bg-white rounded-xl px-3 py-2.5 focus-within:border-[#FF5A36]">
                <span className="text-xs font-medium text-slate-500 mr-2">🇩🇪</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+49 176..."
                  required
                  className="w-full text-xs bg-transparent focus:outline-none font-medium text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#0E1116]">Enter 6-digit code</h2>
              <p className="text-xs text-slate-500 mt-1">
                Sent to {phone}. <span className="font-semibold text-teal-700">Hint: 482910</span> (any 6 digits work!)
              </p>
            </div>

            <div className="pt-2">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="482910"
                autoFocus
                required
                className="w-full text-center tracking-[0.5em] text-lg font-mono py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF5A36]"
              />
              <div className="mt-2 flex justify-between items-center text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => setOtp('482910')}
                  className="text-teal-700 font-medium hover:underline"
                >
                  Auto-fill code
                </button>
                <span>Resend in 30s</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={otp.length !== 6}
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-40 transition-colors shadow-sm"
            >
              <span>Verify & Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#0E1116]">Set up your profile</h2>
              <p className="text-xs text-slate-500 mt-1">
                Drivers will see your first name when picking you up.
              </p>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <img
                src={avatar}
                alt="Profile"
                className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-xs"
              />
              <div className="text-xs text-slate-500">
                <p className="font-medium text-slate-700">Photo verified</p>
                <p className="text-[11px]">Berlin passenger ID</p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
                className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF5A36]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-sunrise text-white font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-sm"
            >
              <span>Start Riding with Movo</span>
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>

      <div className="pt-4 border-t border-slate-200/60 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Movo Berlin Mobility Guarantee</span>
        </div>
      </div>
    </div>
  );
}
