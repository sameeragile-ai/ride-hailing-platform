import React, { useState } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { Trip, Dispute } from '../../lib/types';
import { movoStore } from '../../services/movoStore';

interface DisputeModalProps {
  trip: Trip;
  onClose: () => void;
}

export function DisputeModal({ trip, onClose }: DisputeModalProps) {
  const [reason, setReason] = useState<Dispute['reason']>('overcharged');
  const [description, setDescription] = useState('');
  const [claimedAmount, setClaimedAmount] = useState(
    (trip.fareBreakdown.total * 0.5).toFixed(2)
  );
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    movoStore.raiseDispute(
      trip.id,
      reason,
      description,
      parseFloat(claimedAmount) || 0
    );

    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E2]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="font-heading font-bold text-sm text-[#0E1116]">Trip Dispute & Support</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-bold text-sm text-slate-900">Dispute Ticket Logged</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Ticket forwarded to Movo Berlin Operations. Our support team will review driver telematics and issue resolution within 2 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500">Trip Reference:</span>{' '}
              <span className="font-mono font-medium text-slate-900">{trip.id}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Total Billed: <strong className="text-slate-900 tabular-nums">€{trip.fareBreakdown.total.toFixed(2)}</strong>
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Dispute Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF5A36]"
              >
                <option value="overcharged">Incorrect fare or unwarranted surcharge</option>
                <option value="driver_route">Driver took inefficient or roundabout route</option>
                <option value="cancelled_incorrectly">Driver requested rider cancellation</option>
                <option value="lost_item">Lost item left in vehicle</option>
                <option value="safety">Vehicle or safety conduct issue</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Requested Refund Amount (€)
              </label>
              <input
                type="number"
                step="0.01"
                max={trip.fareBreakdown.total}
                value={claimedAmount}
                onChange={(e) => setClaimedAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-[#FF5A36]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                Incident Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what happened during this trip..."
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF5A36]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Submit Dispute
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
