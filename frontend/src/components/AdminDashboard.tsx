import { X, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Order, Dispute, EscrowPayment } from '../types';
import api from '../lib/api';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const [tab, setTab] = useState<'escrow' | 'disputes'>('escrow');
  const [escrows, setEscrows] = useState<(EscrowPayment & { order?: Order })[]>([]);
  const [disputes, setDisputes] = useState<(Dispute & { order?: Order })[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'escrow') {
        const { data } = await api.get<{ data: (EscrowPayment & { order?: Order })[] }>('/admin/escrow-payments');
        setEscrows(data.data || []);
      } else {
        const { data } = await api.get<{ data: (Dispute & { order?: Order })[] }>('/admin/disputes');
        setDisputes(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, tab, fetchData]);

  const handleReleaseEscrow = async (escrowId: string, orderId: string) => {
    try {
      await api.post(`/admin/escrow/${escrowId}/release`, {
        orderId
      });

      fetchData();
    } catch (err) {
      console.error('Error releasing escrow:', err);
    }
  };

  const handleResolveDispute = async (disputeId: string, orderId: string) => {
    if (!resolution.trim()) return;

    try {
      await api.post(`/admin/disputes/${disputeId}/resolve`, {
        resolution,
        orderId
      });

      setSelectedDispute(null);
      setResolution('');
      fetchData();
    } catch (err) {
      console.error('Error resolving dispute:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 p-6 border-b-2 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Admin Dashboard</h2>
            <p className="text-slate-600 text-sm mt-1">Manage escrow and disputes</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-amber-200 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-slate-700" />
          </button>
        </div>

        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setTab('escrow')}
              className={`flex-1 px-6 py-4 font-bold text-center border-b-2 transition-colors ${
                tab === 'escrow'
                  ? 'border-amber-600 text-amber-600 bg-amber-50'
                  : 'border-transparent text-slate-700 hover:text-amber-600'
              }`}
            >
              <DollarSign className="h-5 w-5 inline mr-2" />
              Escrow Payments
            </button>
            <button
              onClick={() => setTab('disputes')}
              className={`flex-1 px-6 py-4 font-bold text-center border-b-2 transition-colors ${
                tab === 'disputes'
                  ? 'border-amber-600 text-amber-600 bg-amber-50'
                  : 'border-transparent text-slate-700 hover:text-amber-600'
              }`}
            >
              <AlertCircle className="h-5 w-5 inline mr-2" />
              Disputes
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-amber-200 border-t-amber-600 rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600">Loading...</p>
            </div>
          ) : tab === 'escrow' ? (
            <div className="space-y-4">
              {escrows.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p>No escrow payments currently held</p>
                </div>
              ) : (
                escrows.map((escrow) => (
                  <div key={escrow.id} className="border-2 border-slate-200 rounded-lg p-4 hover:border-amber-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-slate-900">Amount Held: ${escrow.amount.toLocaleString()}</p>
                        <p className="text-sm text-slate-600">Order ID: {escrow.order_id.slice(0, 8)}</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold border border-yellow-300">
                        HELD
                      </span>
                    </div>

                    <div className="text-sm text-slate-600 mb-4">
                      <p>Held since: {new Date(escrow.held_at).toLocaleDateString()}</p>
                    </div>

                    <button
                      onClick={() => handleReleaseEscrow(escrow.id, escrow.order_id)}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Release Payment to Seller</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p>No open disputes</p>
                </div>
              ) : (
                disputes.map((dispute) => (
                  <div key={dispute.id} className="border-2 border-slate-200 rounded-lg overflow-hidden hover:border-red-300 transition-colors">
                    <button
                      onClick={() => setSelectedDispute(selectedDispute === dispute.id ? null : dispute.id)}
                      className="w-full p-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 capitalize">Reason: {dispute.reason.replace('_', ' ')}</p>
                          <p className="text-sm text-slate-600 mt-1">{dispute.description}</p>
                          <p className="text-xs text-slate-500 mt-2">Raised: {new Date(dispute.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-300">
                          OPEN
                        </span>
                      </div>
                    </button>

                    {selectedDispute === dispute.id && (
                      <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Resolution
                          </label>
                          <textarea
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            placeholder="Enter resolution details and action taken..."
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => setSelectedDispute(null)}
                            className="flex-1 px-4 py-2 border-2 border-slate-300 text-slate-900 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleResolveDispute(dispute.id, dispute.order_id)}
                            disabled={!resolution.trim()}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Resolve Dispute
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
