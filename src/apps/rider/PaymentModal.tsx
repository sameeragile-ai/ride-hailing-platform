import React, { useState } from 'react';
import { CreditCard, Wallet, Banknote, Plus, Check, ShieldCheck, X } from 'lucide-react';
import { Rider } from '../../lib/types';
import { movoStore } from '../../services/movoStore';

interface PaymentModalProps {
  rider: Rider;
  selectedMethod: 'card' | 'wallet' | 'cash';
  onSelectMethod: (method: 'card' | 'wallet' | 'cash') => void;
  onClose: () => void;
}

export function PaymentModal({
  rider,
  selectedMethod,
  onSelectMethod,
  onClose,
}: PaymentModalProps) {
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [topUpAmount, setTopUpAmount] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Brand detection based on leading digits
  const getCardBrand = (num: string): 'visa' | 'mastercard' | 'amex' => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
    if (/^(34|37)/.test(clean)) return 'amex';
    return 'visa';
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.length < 16 || cardExpiry.length < 5 || cardCvc.length < 3) return;

    const brand = getCardBrand(cardNumber);
    const last4 = cardNumber.replace(/\s+/g, '').slice(-4);

    movoStore.addPaymentCard(rider.id, {
      brand,
      last4,
      expiry: cardExpiry,
    });

    setShowAddCard(false);
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setSuccessMsg('Card saved securely via 256-bit encryption');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleTopUpWallet = (amount: number) => {
    movoStore.topUpWallet(rider.id, amount);
    setTopUpAmount(null);
    setSuccessMsg(`Added €${amount.toFixed(2)} to Movo Wallet`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E2]">
          <h3 className="font-heading font-bold text-base text-[#0E1116]">Payment Methods</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Existing Methods */}
        <div className="mt-4 space-y-2.5">
          {/* Movo Wallet */}
          <div
            onClick={() => onSelectMethod('wallet')}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              selectedMethod === 'wallet'
                ? 'border-[#FF5A36] bg-[#FF5A36]/5'
                : 'border-[#E7E7E2] hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0E1116]">Movo Wallet</p>
                <p className="text-xs text-slate-500 tabular-nums">
                  Balance: €{rider.walletBalance.toFixed(2)}
                </p>
              </div>
            </div>
            {selectedMethod === 'wallet' && <Check className="w-4 h-4 text-[#FF5A36]" />}
          </div>

          {/* Quick Wallet Top Up Buttons */}
          <div className="flex items-center gap-2 pl-2">
            <span className="text-[10px] text-slate-400 font-medium uppercase">Top up:</span>
            {[10, 25, 50].map((amt) => (
              <button
                key={amt}
                onClick={() => handleTopUpWallet(amt)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
              >
                +€{amt}
              </button>
            ))}
          </div>

          {/* Saved Cards */}
          {rider.paymentMethods
            .filter((pm) => pm.type === 'card')
            .map((card) => (
              <div
                key={card.id}
                onClick={() => onSelectMethod('card')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedMethod === 'card'
                    ? 'border-[#FF5A36] bg-[#FF5A36]/5'
                    : 'border-[#E7E7E2] hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0E1116] uppercase">
                      {card.brand} •••• {card.last4}
                    </p>
                    <p className="text-[11px] text-slate-400">Expires {card.expiry}</p>
                  </div>
                </div>
                {selectedMethod === 'card' && <Check className="w-4 h-4 text-[#FF5A36]" />}
              </div>
            ))}

          {/* Cash */}
          <div
            onClick={() => onSelectMethod('cash')}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              selectedMethod === 'cash'
                ? 'border-[#FF5A36] bg-[#FF5A36]/5'
                : 'border-[#E7E7E2] hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0E1116]">Cash to Driver</p>
                <p className="text-[11px] text-slate-500">Pay directly upon arrival</p>
              </div>
            </div>
            {selectedMethod === 'cash' && <Check className="w-4 h-4 text-[#FF5A36]" />}
          </div>
        </div>

        {/* Add Card Toggle */}
        {!showAddCard ? (
          <button
            onClick={() => setShowAddCard(true)}
            className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Card</span>
          </button>
        ) : (
          <form onSubmit={handleSaveCard} className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">Secure Card Details</span>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>PCI-DSS</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">
                Card Number
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="4242 4242 4242 4242"
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-[#FF5A36]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">
                  MM / YY
                </label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={handleExpiryChange}
                  placeholder="08/28"
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-[#FF5A36]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">
                  CVC / CVV
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                  placeholder="•••"
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-[#FF5A36]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Maximilian Krause"
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF5A36]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddCard(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Save Card
              </button>
            </div>
          </form>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
        >
          Confirm Payment Method
        </button>
      </div>
    </div>
  );
}
