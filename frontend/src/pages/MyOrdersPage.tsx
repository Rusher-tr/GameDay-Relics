import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, Truck, CheckCircle, XCircle, AlertCircle, ArrowRight, ThumbsUp, Meh } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';
import DisputeForm from '../components/DisputeForm';
import {toast} from "react-toastify"
interface Order {
  _id: string;
  productId: Product | null;
  buyerId: string;
  sellerId: {
    _id: string;
    username: string;
    email: string;
  } | null;
  transactionId: string | null;
  status: 'pending' | 'Escrow' | 'Held' | 'shipped' | 'Completed' | 'Disputed' | 'Refunded';
  amount: number;
  escrowRelease: boolean;
  buyerSatisfaction: 'pending' | 'satisfied' | 'fine' | 'disputed';
  shippingProvider: string | null;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/mine');
      // Backend returns: { statusCode, data: orders, message, success }
      setOrders(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err?.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetchOrders();
  }, [user, navigate]);

  const handleMarkSatisfaction = async (orderId: string, satisfaction: 'satisfied' | 'fine') => {
    setActionLoading(orderId);
    try {
      await api.post(`/orders/${orderId}/satisfaction`, { satisfaction });
      await fetchOrders(); // Refresh orders
    } catch (err: any) {
      console.error('Error marking satisfaction:', err);
      toast.error(err?.response?.data?.message || 'Failed to mark satisfaction');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenDispute = (orderId: string) => {
    setDisputeOrderId(orderId);
  };

  const handleDisputeSuccess = async () => {
    await fetchOrders(); // Refresh orders after dispute is raised
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'Escrow':
      case 'Held':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-600" />;
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Disputed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'Refunded':
        return <XCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Escrow':
      case 'Held':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Disputed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Refunded':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Orders</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="bg-slate-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Package className="h-12 w-12 text-slate-400" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              No Orders Yet
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              You haven't placed any orders yet. Start shopping to see your orders here!
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
            >
              <span>Start Shopping</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            My Orders
          </h1>
          <p className="text-lg text-slate-600">
            Track and manage your purchases
          </p>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-slate-200"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Product Info */}
                  <div className="flex gap-4 flex-1">
                    {order.productId && (
                      <>
                        <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={order.productId.images[0] || 'https://images.pexels.com/photos/3886244/pexels-photo-3886244.jpeg'}
                            alt={order.productId.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-900 mb-1">
                            {order.productId.title}
                          </h3>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                            {order.productId.description}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span>Order ID: #{order._id.slice(-8)}</span>
                            <span>•</span>
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </>
                    )}
                    {!order.productId && (
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900 mb-1">
                          Product Unavailable
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span>Order ID: #{order._id.slice(-8)}</span>
                          <span>•</span>
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status & Amount */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                    <div className="text-right">
                      <p className="text-sm text-slate-500 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
                        ${order.amount.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Escrow & Shipping Info */}
                {(order.escrowRelease !== undefined || order.trackingNumber) && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex flex-wrap gap-4 text-sm">
                      {order.escrowRelease !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">Escrow:</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            order.escrowRelease
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.escrowRelease ? 'Released' : 'Held'}
                          </span>
                        </div>
                      )}
                      {order.trackingNumber && (
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-slate-500" />
                          <span className="font-semibold text-slate-700">Tracking:</span>
                          <span className="text-slate-600">{order.trackingNumber}</span>
                          {order.shippingProvider && (
                            <span className="text-slate-500">({order.shippingProvider})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Buyer Satisfaction Status */}
                {order.buyerSatisfaction && order.buyerSatisfaction !== 'pending' && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Your Feedback:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        order.buyerSatisfaction === 'satisfied'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : order.buyerSatisfaction === 'fine'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {order.buyerSatisfaction === 'satisfied' ? '😊 Satisfied' :
                         order.buyerSatisfaction === 'fine' ? '👍 Fine' :
                         '⚠️ Disputed'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Buyer Action Buttons */}
                {['shipped', 'Held', 'Escrow'].includes(order.status) &&
                 order.buyerSatisfaction === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm font-semibold text-slate-700 mb-3">
                      Have you received your product? Please provide feedback:
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleMarkSatisfaction(order._id, 'satisfied')}
                        disabled={actionLoading === order._id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>Satisfied - Release Payment</span>
                      </button>
                      <button
                        onClick={() => handleMarkSatisfaction(order._id, 'fine')}
                        disabled={actionLoading === order._id}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Meh className="h-4 w-4" />
                        <span>It's Fine</span>
                      </button>
                      <button
                        onClick={() => handleOpenDispute(order._id)}
                        disabled={actionLoading === order._id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span>Open Dispute</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* View Product Link */}
                {order.productId && (
                  <div className="mt-4">
                    <button
                      onClick={() => navigate(`/product/${order.productId!._id}`)}
                      className="text-amber-600 hover:text-amber-700 font-semibold text-sm flex items-center gap-1 transition-colors"
                    >
                      <span>View Product</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Back to Shopping */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/shop')}
            className="text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Dispute Form Modal */}
      {disputeOrderId && (
        <DisputeForm
          isOpen={!!disputeOrderId}
          onClose={() => setDisputeOrderId(null)}
          orderId={disputeOrderId}
          onSuccess={handleDisputeSuccess}
        />
      )}
    </div>
  );
}
