import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import EscrowReleasePopup from './EscrowReleasePopup';
import { toast } from "react-toastify"

interface DisputeDetails {
  id: string;
  reason: string;
  description: string;
  status: string;
  resolution: string;
  evidence: string[];
  createdAt: string;
  resolvedAt?: string;
  order?: {
    id: string;
    productId: string;
    status: string;
    amount: number;
    transactionId: string;
    createdAt: string;
  };
  buyer?: {
    id: string;
    username: string;
    email: string;
  };
  seller?: {
    id: string;
    username: string;
    email: string;
    paymentGateway: string;
    paymentDetails: {
      accountNumber?: string;
      accountName?: string;
      stripeAccountType?: string;
      stripeConnectedAccountId?: string;
      stripeOnboardingStatus?: string;
      stripeOnboardingUrl?: string;
    };
  };
}

interface DisputeDetailsModalProps {
  disputeId: string;
  isOpen: boolean;
  onClose: () => void;
  onRefund: (disputeId: string, resolution: string) => void;
  onReleaseEscrow: (disputeId: string, resolution: string) => void;
  onRefreshList: () => void;
}

export default function DisputeDetailsModal({
  disputeId,
  isOpen,
  onClose,
  onRefund,
  onReleaseEscrow,
  onRefreshList,
}: DisputeDetailsModalProps) {
  const [dispute, setDispute] = useState<DisputeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [resolution, setResolution] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'refund' | 'release' | null>(null);
  const [showEscrowPopup, setShowEscrowPopup] = useState(false);

  useEffect(() => {
    if (isOpen && disputeId) {
      fetchDisputeDetails();
    }
  }, [isOpen, disputeId]);

  const fetchDisputeDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admins/disputes/${disputeId}`);
      const data = response.data as { data: DisputeDetails };
      setDispute(data.data);
      setResolution('');
    } catch (err) {
      console.error('Error fetching dispute details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!resolution.trim()) {
      toast.error('Please enter resolution notes');
      return;
    }
    setActionLoading(true);
    try {
      await onRefund(disputeId, resolution);
      await fetchDisputeDetails();
      onRefreshList();
    } catch (err) {
      console.error('Error processing refund:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!resolution.trim()) {
      toast.error('Please enter resolution notes');
      return;
    }
    setActionLoading(true);
    try {
      await onReleaseEscrow(disputeId, resolution);
      // Show the celebration popup
      setShowEscrowPopup(true);
      // Wait for animation then refresh
      setTimeout(() => {
        fetchDisputeDetails();
        onRefreshList();
        setShowEscrowPopup(false);
      }, 3000);
    } catch (err) {
      console.error('Error releasing escrow:', err);
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="absolute w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl z-50">
          {/* Header */}
          <div className="sticky top-0 p-6 border-b border-slate-200 bg-gradient-to-r from-red-50 to-red-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Dispute Details</h2>
              <p className="text-slate-600 text-sm mt-1">ID: {dispute?.id?.slice(0, 8)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-200 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-slate-700" />
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin h-12 w-12 border-4 border-red-200 border-t-red-600 rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600">Loading dispute details...</p>
            </div>
          ) : dispute ? (
            <div className="p-6 space-y-6">
              {/* Dispute Status and Basic Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${dispute.status === 'Open' ? 'bg-red-100 text-red-800 border border-red-300' :
                        dispute.status === 'Resolved' ? 'bg-green-100 text-green-800 border border-green-300' :
                          dispute.status === 'Refunded' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                            'bg-gray-100 text-gray-800 border border-gray-300'
                      }`}>
                      {dispute.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Created</p>
                    <p className="text-sm text-slate-900 mt-1">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason and Description */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-slate-600 mb-2">Reason</p>
                <p className="text-slate-900 font-semibold capitalize mb-4">{dispute.reason.replace(/_/g, ' ')}</p>
                <p className="text-sm font-semibold text-slate-600 mb-2">Description</p>
                <p className="text-slate-900 whitespace-pre-wrap">{dispute.description}</p>
              </div>

              {/* Buyer and Seller Information */}
              <div className="grid grid-cols-2 gap-4">
                {/* Buyer Info */}
                {dispute.buyer && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-slate-600 mb-3">Buyer Information</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-600">Name</p>
                        <p className="text-sm font-semibold text-slate-900">{dispute.buyer.username}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Email</p>
                        <p className="text-sm text-slate-900">{dispute.buyer.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">ID</p>
                        <p className="text-xs text-slate-700 font-mono">{dispute.buyer.id}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seller Info */}
                {dispute.seller && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-slate-600 mb-3">Seller Information</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-600">Name</p>
                        <p className="text-sm font-semibold text-slate-900">{dispute.seller.username}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Email</p>
                        <p className="text-sm text-slate-900">{dispute.seller.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Payment Gateway</p>
                        <p className="text-sm font-semibold text-blue-700">{dispute.seller.paymentGateway?.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Seller Payment Details */}
              {dispute.seller && dispute.seller.paymentDetails && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-slate-600 mb-3">
                    Seller Payment Details - {dispute.seller.paymentGateway?.toUpperCase()} (Active)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Show account details for easypaisa/jazzcash */}
                    {(dispute.seller.paymentGateway === 'easypaisa' || dispute.seller.paymentGateway === 'jazzcash') && (
                      <>
                        {dispute.seller.paymentDetails.accountNumber && (
                          <div>
                            <p className="text-xs text-slate-600">Account Number</p>
                            <p className="text-sm font-mono text-slate-900">{dispute.seller.paymentDetails.accountNumber}</p>
                          </div>
                        )}
                        {dispute.seller.paymentDetails.accountName && (
                          <div>
                            <p className="text-xs text-slate-600">Account Name</p>
                            <p className="text-sm font-semibold text-slate-900">{dispute.seller.paymentDetails.accountName}</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Show Stripe details for stripe gateway */}
                    {dispute.seller.paymentGateway === 'stripe' && (
                      <>
                        {dispute.seller.paymentDetails.stripeConnectedAccountId && (
                          <div className="col-span-2">
                            <p className="text-xs text-slate-600">Stripe Connected Account ID</p>
                            <p className="text-sm font-mono text-slate-900">{dispute.seller.paymentDetails.stripeConnectedAccountId}</p>
                          </div>
                        )}
                        {dispute.seller.paymentDetails.stripeAccountType && (
                          <div>
                            <p className="text-xs text-slate-600">Account Type</p>
                            <p className="text-sm font-semibold text-slate-900 capitalize">{dispute.seller.paymentDetails.stripeAccountType}</p>
                          </div>
                        )}
                        {dispute.seller.paymentDetails.stripeOnboardingStatus && (
                          <div>
                            <p className="text-xs text-slate-600">Onboarding Status</p>
                            <p className="text-sm font-semibold text-slate-900 capitalize">{dispute.seller.paymentDetails.stripeOnboardingStatus}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Order Information */}
              {dispute.order && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-slate-600 mb-3">Order Information</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600">Order ID</p>
                      <p className="text-xs text-slate-700 font-mono">{dispute.order.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Amount</p>
                      <p className="text-sm font-semibold text-slate-900">PKR {dispute.order.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Order Status</p>
                      <p className="text-sm font-semibold text-slate-900">{dispute.order.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Created</p>
                      <p className="text-sm text-slate-900">{new Date(dispute.order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Evidence Gallery */}
              {dispute.evidence && dispute.evidence.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-slate-600 mb-3">Evidence ({dispute.evidence.length} file(s))</p>
                  <div className="grid grid-cols-4 gap-3">
                    {dispute.evidence.map((evidence, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setFullscreenImage(evidence);
                          setCurrentImageIndex(index);
                        }}
                        className="relative group cursor-pointer"
                      >
                        <img
                          src={evidence}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-slate-300 group-hover:border-slate-500 transition-all"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Resolution (if resolved) */}
              {dispute.resolution && dispute.status !== 'Open' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-slate-600 mb-2">Resolution</p>
                  <p className="text-slate-900 whitespace-pre-wrap">{dispute.resolution}</p>
                  {dispute.resolvedAt && (
                    <p className="text-xs text-slate-600 mt-2">
                      Resolved on: {new Date(dispute.resolvedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons - 3 Step Workflow */}
              {dispute.status === 'Open' && (
                <div className="space-y-4 border-t border-slate-200 pt-6">
                  {/* Step 1: Choose Action */}
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-3">Step 1: Choose Action</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedAction(selectedAction === 'refund' ? null : 'refund')}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all border-2 ${selectedAction === 'refund'
                            ? 'bg-red-100 border-red-600 text-red-700'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-red-400'
                          }`}
                      >
                        💰 Refund to Buyer
                      </button>
                      <button
                        onClick={() => setSelectedAction(selectedAction === 'release' ? null : 'release')}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all border-2 ${selectedAction === 'release'
                            ? 'bg-green-100 border-green-600 text-green-700'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-green-400'
                          }`}
                      >
                        🔓 Release to Seller
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Enter Resolution Notes (only if action is selected) */}
                  {selectedAction && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">
                        Step 2: Enter Resolution Notes
                      </p>
                      <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="Describe the resolution and reason for this action..."
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Step 3: Confirm & Resolve (only if action and notes are provided) */}
                  {selectedAction && resolution.trim() && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-slate-700 mb-3">
                        Step 3: Confirm & Resolve
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedAction(null);
                            setResolution('');
                          }}
                          disabled={actionLoading}
                          className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (selectedAction === 'refund') {
                              handleRefund();
                            } else {
                              handleReleaseEscrow();
                            }
                          }}
                          disabled={actionLoading}
                          className={`flex-1 px-4 py-2 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 ${selectedAction === 'refund'
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                          {actionLoading ? 'Processing...' : (
                            selectedAction === 'refund' ? '✓ Confirm Refund' : '✓ Confirm Release & Resolve'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-slate-600">Failed to load dispute details</p>
            </div>
          )}
        </div>

        {/* Fullscreen Image Modal */}
        {fullscreenImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setFullscreenImage(null)}
          >
            <div className="relative w-11/12 h-11/12 flex flex-col items-center justify-center">
              <img
                src={fullscreenImage}
                alt="Fullscreen evidence"
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />

              {/* Navigation */}
              {dispute?.evidence && dispute.evidence.length > 1 && (
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newIndex = currentImageIndex === 0 ? dispute.evidence.length - 1 : currentImageIndex - 1;
                      setCurrentImageIndex(newIndex);
                      setFullscreenImage(dispute.evidence[newIndex]);
                    }}
                    className="p-2 bg-white/20 hover:bg-white/40 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </button>
                  <span className="text-white font-semibold">
                    {currentImageIndex + 1} / {dispute.evidence.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newIndex = currentImageIndex === dispute.evidence.length - 1 ? 0 : currentImageIndex + 1;
                      setCurrentImageIndex(newIndex);
                      setFullscreenImage(dispute.evidence[newIndex]);
                    }}
                    className="p-2 bg-white/20 hover:bg-white/40 rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-6 w-6 text-white" />
                  </button>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={() => setFullscreenImage(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Escrow Release Celebration Popup */}
      <EscrowReleasePopup
        isVisible={showEscrowPopup}
        sellerName={dispute?.seller?.username || 'Seller'}
        amount={dispute?.order?.amount || 0}
        onConfirm={() => {
          setShowEscrowPopup(false);
          setSelectedAction(null);
          setResolution('');
        }}
        onCancel={() => {
          setShowEscrowPopup(false);
          setSelectedAction(null);
          setResolution('');
        }}
        isLoading={actionLoading}
      />
    </>
  );
}
