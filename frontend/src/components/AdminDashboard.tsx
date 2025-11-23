import { X, AlertCircle, CheckCircle, DollarSign, Users, Package, TrendingUp, Trash2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Order, Dispute, EscrowPayment } from '../types';
import api from '../lib/api';
import DisputeDetailsModal from './DisputeDetailsModal';
import AuditLogsPage from '../pages/AuditLogsPage';
import { toast } from "react-toastify"

// Using AuditLogsPage in the component below

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EscrowOrder {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  held_at: string;
  buyerSatisfaction?: 'pending' | 'satisfied' | 'fine' | 'disputed';
  order?: {
    id: string;
    buyer_id: string;
    seller_id: string;
    product_id: string;
    price: number;
    status: string;
  };
}

interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  createdAt: string;
}

interface AdminOrder {
  _id: string;
  productId: {
    _id: string;
    title: string;
    price: number;
  } | null;
  buyerId: {
    _id: string;
    username: string;
    email: string;
  } | null;
  sellerId: {
    _id: string;
    username: string;
    email: string;
  } | null;
  status: string;
  amount: number;
  escrowRelease: boolean;
  buyerSatisfaction: string;
  createdAt: string;
}

interface OrderStats {
  totalAmount: number;
  averageAmount: number;
  minAmount: number;
  maxAmount: number;
}

export default function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const [tab, setTab] = useState<'escrow' | 'disputes' | 'users' | 'orders' | 'stats' | 'auditlogs'>('escrow');
  const [showAuditLogsPage, setShowAuditLogsPage] = useState(false);
  const [panelWidth, setPanelWidth] = useState(80); // Default width in percent
  const [isDragging, setIsDragging] = useState(false);
  const [escrows, setEscrows] = useState<EscrowOrder[]>([]);
  const [disputes, setDisputes] = useState<(Dispute & { order?: Order })[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [selectedDisputeForModal, setSelectedDisputeForModal] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Skip fetching if we're on the audit logs page
    if (tab === 'auditlogs') {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (tab === 'escrow') {
        const response = await api.get('/admins/escrow-payments');
        setEscrows(response.data.data || []);
      } else if (tab === 'disputes') {
        const response = await api.get('/admins/disputes');
        setDisputes(response.data.data || []);
      } else if (tab === 'users') {
        const response = await api.get('/admins/users');
        setUsers(response.data.data || []);
      } else if (tab === 'orders') {
        const response = await api.get('/admins/getorders');
        setOrders(response.data.data || []);
      } else if (tab === 'stats') {
        const response = await api.get('/admins/amount-stats');
        setStats(response.data.data || null);
      }
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      console.error('Error response:', err?.response);
      console.error('Error message:', err?.message);
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
      const response = await api.post(`/admins/escrow/${escrowId}/release`, {
        orderId
      });

      // Show seller payment information
      if (response.data.data?.sellerPaymentInfo) {
        const paymentInfo = response.data.data.sellerPaymentInfo;
        const gateway = paymentInfo.paymentGateway;
        let details = '';

        if (gateway === 'stripe') {
          details = `Stripe Account ID: ${paymentInfo.paymentDetails?.stripeAccountId || 'N/A'}`;
        } else {
          details = `Account Number: ${paymentInfo.paymentDetails?.accountNumber || 'N/A'}\nAccount Name: ${paymentInfo.paymentDetails?.accountName || 'N/A'}`;
        }

        toast.success(
          `✅ Escrow Released! Payment of PKR ${paymentInfo.amount.toLocaleString()} ready for ${paymentInfo.sellerName}`,
          {
            position: 'top-right',
            autoClose: 6000,
            hideProgressBar: false,
          }
        );

        // Log payment details to console for admin reference
        console.log('SELLER PAYMENT INFORMATION:', {
          seller: `${paymentInfo.sellerName} (${paymentInfo.sellerEmail})`,
          amount: `PKR ${paymentInfo.amount.toLocaleString()}`,
          gateway: gateway.toUpperCase(),
          details: details
        });
      }

      fetchData();
    } catch (err: any) {
      console.error('Error releasing escrow:', err);
      toast.error(err?.response?.data?.message || 'Failed to release escrow. Please check if the seller has configured payment settings.');
    }
  };

  const handleResolveDispute = async (disputeId: string, orderId: string) => {
    if (!resolution.trim()) return;

    try {
      await api.post(`/admins/disputes/${disputeId}/resolve`, {
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

  const handleRefundDispute = async (disputeId: string, resolution: string) => {
    try {
      await api.post(`/admins/disputes/${disputeId}/refund`, {
        resolution
      });
      toast.success('Dispute resolved - Refund to buyer processed!');
      setSelectedDisputeForModal(null);
      fetchData();
    } catch (err: any) {
      console.error('Error processing refund:', err);
      toast.error(err?.response?.data?.message || 'Failed to process refund');
    }
  };

  const handleReleaseEscrowDispute = async (disputeId: string, resolution: string) => {
    try {
      const response = await api.post(`/admins/disputes/${disputeId}/release-escrow`, {
        resolution
      });

      const paymentInfo = response.data.data?.sellerPaymentInfo;
      if (paymentInfo) {
        const gateway = paymentInfo.paymentGateway;
        let details = '';

        if (gateway === 'stripe') {
          details = `Stripe Account ID: ${paymentInfo.paymentDetails?.stripeAccountId || 'N/A'}`;
        } else {
          details = `Account Number: ${paymentInfo.paymentDetails?.accountNumber || 'N/A'}\nAccount Name: ${paymentInfo.paymentDetails?.accountName || 'N/A'}`;
        }

        toast.success(
          ` Dispute Resolved! Escrow of PKR ${paymentInfo.amount?.toLocaleString()} released to seller`,
          {
            position: 'top-right',
            autoClose: 6000,
            hideProgressBar: false,
          }
        );

        // Log payment details to console for admin reference
        console.log('DISPUTE RESOLVED - SELLER PAYMENT INFO:', {
          seller: `${paymentInfo.sellerName} (${paymentInfo.sellerEmail})`,
          amount: `PKR ${paymentInfo.amount?.toLocaleString()}`,
          gateway: gateway.toUpperCase(),
          details: details
        });
      }

      setSelectedDisputeForModal(null);
      fetchData();
    } catch (err: any) {
      console.error('Error releasing escrow:', err);
      toast.error(err?.response?.data?.message || 'Failed to release escrow');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.delete(`/admins/users/${userId}/force-delete`);
      setDeleteConfirm(null);
      // Optimistically remove the user from UI immediately
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
      // Then refresh the data
      await fetchData();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete user');
      // Refresh data even on error to ensure UI is in sync
      await fetchData();
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.patch(`/admins/FCO/${orderId}/cancel`);
      setCancelConfirm(null);
      // Optimistically update the order status immediately
      setOrders(prevOrders => prevOrders.map(order =>
        order._id === orderId ? { ...order, status: 'cancelled' } : order
      ));
      // Then refresh the data
      await fetchData();
    } catch (err: any) {
      console.error('Error canceling order:', err);
      toast.error(err?.response?.data?.message || 'Failed to cancel order');
      // Refresh data even on error to ensure UI is in sync
      await fetchData();
    }
  };

  // Add event listeners for drag functionality
  // MUST be before early return to comply with React Hooks rules
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as any);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  if (!isOpen) return null;

  // Debug logging to diagnose blank screen issue
  console.log('AdminDashboard render:', { isOpen, tab, showAuditLogsPage, loading, escrowsLength: escrows.length });

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const container = document.querySelector('.admin-panel-container') as HTMLElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    if (!rect) return;

    // Calculate width based on window width and current mouse position
    const windowWidth = window.innerWidth;
    const distanceFromRight = windowWidth - e.clientX;
    const newWidth = (distanceFromRight / windowWidth) * 100;

    if (newWidth > 40 && newWidth < 95) {
      setPanelWidth(newWidth);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="admin-panel-container absolute right-0 top-0 h-full bg-white shadow-2xl flex flex-col"
        style={{ width: `${panelWidth}%` }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute left-0 top-0 h-full w-1 bg-amber-400 hover:bg-amber-600 cursor-col-resize transition-colors z-20"
          title="Drag to resize panel width"
        />

        <div className="sticky top-0 p-6 pl-7 border-b-2 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 z-10 flex items-center justify-between">
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

        <div className="border-b border-slate-200 pl-1">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setTab('escrow')}
              className={`flex-1 px-4 py-3 font-bold text-center border-b-2 transition-colors whitespace-nowrap ${tab === 'escrow'
                ? 'border-amber-600 text-amber-600 bg-amber-50'
                : 'border-transparent text-slate-700 hover:text-amber-600'
                }`}
            >
              <DollarSign className="h-4 w-4 inline mr-1" />
              <span className="text-sm">Escrow</span>
            </button>
            <button
              onClick={() => setTab('disputes')}
              className={`flex-1 px-4 py-3 font-bold text-center border-b-2 transition-colors whitespace-nowrap ${tab === 'disputes'
                ? 'border-amber-600 text-amber-600 bg-amber-50'
                : 'border-transparent text-slate-700 hover:text-amber-600'
                }`}
            >
              <AlertCircle className="h-4 w-4 inline mr-1" />
              <span className="text-sm">Disputes</span>
            </button>
            <button
              onClick={() => setTab('users')}
              className={`flex-1 px-4 py-3 font-bold text-center border-b-2 transition-colors whitespace-nowrap ${tab === 'users'
                ? 'border-amber-600 text-amber-600 bg-amber-50'
                : 'border-transparent text-slate-700 hover:text-amber-600'
                }`}
            >
              <Users className="h-4 w-4 inline mr-1" />
              <span className="text-sm">Users</span>
            </button>
            <button
              onClick={() => setTab('orders')}
              className={`flex-1 px-4 py-3 font-bold text-center border-b-2 transition-colors whitespace-nowrap ${tab === 'orders'
                ? 'border-amber-600 text-amber-600 bg-amber-50'
                : 'border-transparent text-slate-700 hover:text-amber-600'
                }`}
            >
              <Package className="h-4 w-4 inline mr-1" />
              <span className="text-sm">Orders</span>
            </button>
            <button
              onClick={() => setTab('stats')}
              className={`flex-1 px-4 py-3 font-bold text-center border-b-2 transition-colors whitespace-nowrap ${tab === 'stats'
                ? 'border-amber-600 text-amber-600 bg-amber-50'
                : 'border-transparent text-slate-700 hover:text-amber-600'
                }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-1" />
              <span className="text-sm">Stats</span>
            </button>
            <button
              onClick={() => {
                setTab('auditlogs');
                setShowAuditLogsPage(true);
              }}
              className={`flex-1 px-4 py-3 font-bold text-center border-b-2 transition-colors whitespace-nowrap ${tab === 'auditlogs'
                ? 'border-amber-600 text-amber-600 bg-amber-50'
                : 'border-transparent text-slate-700 hover:text-amber-600'
                }`}
            >
              <Package className="h-4 w-4 inline mr-1" />
              <span className="text-sm">Audit Logs</span>
            </button>
          </div>
        </div>

        <div className="p-6 pl-7 flex-1 overflow-y-auto">
          {showAuditLogsPage || tab === 'auditlogs' ? (
            <AuditLogsPage
              onBack={() => {
                setShowAuditLogsPage(false);
                setTab('escrow');
              }}
            />
          ) : loading ? (
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
                        <p className="font-bold text-slate-900">Amount Held: PKR {escrow.amount.toLocaleString()}</p>
                        <p className="text-sm text-slate-600">Order ID: {escrow.order_id.slice(0, 8)}</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold border border-yellow-300">
                        HELD
                      </span>
                    </div>

                    <div className="text-sm text-slate-600 mb-3">
                      <p>Held since: {new Date(escrow.held_at).toLocaleDateString()}</p>
                    </div>

                    {/* Buyer Satisfaction Status */}
                    <div className="mb-4 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">Buyer Feedback:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${escrow.buyerSatisfaction === 'satisfied'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : escrow.buyerSatisfaction === 'fine'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : escrow.buyerSatisfaction === 'disputed'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-gray-100 text-gray-800 border border-gray-300'
                          }`}>
                          {escrow.buyerSatisfaction === 'satisfied' ? '😊 Satisfied - Can Release' :
                            escrow.buyerSatisfaction === 'fine' ? '👍 Fine' :
                              escrow.buyerSatisfaction === 'disputed' ? '⚠️ Disputed' :
                                '⏳ Pending Response'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReleaseEscrow(escrow.id, escrow.order_id)}
                      disabled={escrow.buyerSatisfaction !== 'satisfied' && escrow.buyerSatisfaction !== 'fine'}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={escrow.buyerSatisfaction === 'pending' ? 'Waiting for buyer feedback' : escrow.buyerSatisfaction === 'disputed' ? 'Resolve dispute first' : 'Release payment to seller'}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Release Payment to Seller</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : tab === 'disputes' ? (
            <>
              <div className="space-y-4">
                {disputes.length === 0 ? (
                  <div className="text-center py-12 text-slate-600">
                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p>No open disputes</p>
                  </div>
                ) : (
                  disputes.map((dispute) => (
                    <div key={dispute.id} className="border-2 border-red-200 rounded-lg overflow-hidden hover:border-red-400 transition-colors bg-white">
                      <div className="p-4 flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 capitalize">Reason: {dispute.reason.replace('_', ' ')}</p>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{dispute.description}</p>
                          <p className="text-xs text-slate-500 mt-2">Raised: {new Date(dispute.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-300 whitespace-nowrap">
                            OPEN
                          </span>
                          <button
                            onClick={() => setSelectedDisputeForModal(dispute.id)}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors whitespace-nowrap"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Dispute Details Modal */}
              <DisputeDetailsModal
                disputeId={selectedDisputeForModal || ''}
                isOpen={!!selectedDisputeForModal}
                onClose={() => setSelectedDisputeForModal(null)}
                onRefund={handleRefundDispute}
                onReleaseEscrow={handleReleaseEscrowDispute}
                onRefreshList={fetchData}
              />
            </>
          ) : tab === 'users' ? (
            <div className="space-y-4">
              {users.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p>No users found</p>
                </div>
              ) : (
                users.map((user) => (
                  <div key={user._id} className="border-2 border-slate-200 rounded-lg p-4 hover:border-amber-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-bold text-slate-900">{user.username}</p>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : user.role === 'seller'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-green-100 text-green-800 border border-green-300'
                            }`}>
                            {user.role?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">{user.email}</p>
                        <p className="text-xs text-slate-500">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>

                      {user.role !== 'admin' && (
                        deleteConfirm === user._id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-sm font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition-colors"
                            >
                              Confirm Delete
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(user._id)}
                            className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : tab === 'orders' ? (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p>No orders found</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order._id} className="border-2 border-slate-200 rounded-lg p-4 hover:border-amber-300 transition-colors">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">Order #{order._id.slice(-8)}</p>
                          {order.productId && (
                            <p className="text-sm text-slate-700 mt-1">{order.productId.title}</p>
                          )}
                          <p className="text-sm text-slate-600 mt-1">
                            Amount: PKR {order.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${order.status === 'Completed'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : order.status === 'Disputed'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : order.status === 'Refunded'
                                ? 'bg-gray-100 text-gray-800 border-gray-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`}>
                            {order.status}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${order.escrowRelease
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {order.escrowRelease ? 'Released' : 'Held'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 border-t pt-2">
                        {order.buyerId && (
                          <div>
                            <span className="font-semibold">Buyer:</span> {order.buyerId.username}
                          </div>
                        )}
                        {order.sellerId && (
                          <div>
                            <span className="font-semibold">Seller:</span> {order.sellerId.username}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold">Buyer Satisfaction:</span> {order.buyerSatisfaction}
                        </div>
                        <div>
                          <span className="font-semibold">Created:</span> {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {(order.status === 'pending' || order.status === 'shipped') && (
                        <div className="border-t pt-2">
                          {cancelConfirm === order._id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setCancelConfirm(null)}
                                className="flex-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order._id)}
                                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                              >
                                Confirm Force Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCancelConfirm(order._id)}
                              className="w-full px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold text-sm transition-colors"
                            >
                              Force Cancel Order
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : tab === 'stats' ? (
            <div className="space-y-6">
              {!stats || !stats.totalAmount ? (
                <div className="text-center py-12 text-slate-600">
                  <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p>No statistics available</p>
                  <p className="text-sm text-slate-500 mt-2">Create some orders to see statistics</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-600">Total Order Value</h3>
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-black text-green-700">
                      PKR {stats.totalAmount.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-600">Average Order Value</h3>
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-black text-blue-700">
                      PKR {stats.averageAmount.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-600">Minimum Order Value</h3>
                      <Package className="h-5 w-5 text-amber-600" />
                    </div>
                    <p className="text-3xl font-black text-amber-700">
                      PKR {stats.minAmount.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-600">Maximum Order Value</h3>
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-3xl font-black text-purple-700">
                      PKR {stats.maxAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-semibold">Unknown tab: {tab}</p>
              <p className="text-sm text-slate-500 mt-2">Please refresh and try again</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
