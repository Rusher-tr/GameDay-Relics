import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, Truck, CheckCircle, XCircle, AlertCircle, DollarSign, RefreshCw, Settings } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';
import PaymentSettings from '../components/PaymentSettings';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
interface Order {
  _id: string;
  productId: Product | null;
  buyerId: {
    _id: string;
    username: string;
    email: string;
  } | null;
  sellerId: string;
  transactionId: string | null;
  status: 'pending' | 'Escrow' | 'Held' | 'shipped' | 'in_transit' | 'Completed' | 'Disputed' | 'Refunded' | 'Cancelled';
  amount: number;
  escrowRelease: boolean;
  deliveryGatewayOptions: string[];
  deliveryGatewaySelected: string | null;
  shippingProvider: string | null;
  trackingNumber: string | null;
  sellerDeliveryConfirmed: string | null;
  sellerConfirmationDeadline: string | null;
  cancelledReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SellerOrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<{ [key: string]: { provider: string; trackingNumber: string } }>({});
  const [submittingShipping, setSubmittingShipping] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/orders/seller');
      setOrders(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching seller orders:', err);
      setError(err?.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'seller') {
      navigate('/');
      return;
    }

    fetchOrders();
  }, [user, navigate]);

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'Escrow':
      case 'Held':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-600" />;
      case 'in_transit':
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
      case 'in_transit':
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

  const handleConfirmShipping = async (orderId: string) => {
    const shipping = selectedShipping[orderId];
    if (!shipping || !shipping.provider || !shipping.trackingNumber) {
      toast.error('Please select a delivery provider and enter a tracking number');
      return;
    }

    setSubmittingShipping(orderId);
    try {
      await api.post(`/orders/${orderId}/confirm-shipping`, {
        shippingProvider: shipping.provider,
        trackingNumber: shipping.trackingNumber
      });

      setOrders(orders.map(order =>
        order._id === orderId
          ? { ...order, shippingProvider: shipping.provider, trackingNumber: shipping.trackingNumber, status: 'shipped' }
          : order
      ));

      setSelectedShipping(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      toast.success('Shipping provider confirmed successfully!');

    } catch (err: any) {
      console.error('Error confirming shipping:', err);
      toast.error(err?.response?.data?.message || 'Failed to confirm shipping');
    } finally {
      setSubmittingShipping(null);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    setSubmittingShipping(orderId);
    try {
      await api.post(`/orders/${orderId}/confirm-delivery`);

      setOrders(orders.map(order =>
        order._id === orderId
          ? { ...order, status: 'in_transit', sellerDeliveryConfirmed: new Date().toISOString() }
          : order
      ));

      toast.success('Delivery confirmed! Package is now in transit.');
    } catch (err: any) {
      console.error('Error confirming delivery:', err);
      toast.error(err?.response?.data?.message || 'Failed to confirm delivery');
    } finally {
      setSubmittingShipping(null);
    }
  };

  const totalEarnings = orders.reduce((sum, order) => {
    if (order.status === 'Completed' && order.escrowRelease) {
      return sum + order.amount;
    }
    return sum;
  }, 0);

  const pendingEarnings = orders.reduce((sum, order) => {
    if (['Escrow', 'Held', 'shipped'].includes(order.status) && !order.escrowRelease) {
      return sum + order.amount;
    }
    return sum;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your sales...</p>
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Sales</h1>
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
              <DollarSign className="h-12 w-12 text-slate-400" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              No Sales Yet
            </h1>
            <p className="text-lg text-slate-600">
              You haven't made any sales yet. Your sold items will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              My Sales
            </h1>
            <p className="text-lg text-slate-600">
              Manage orders for your products
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPaymentSettings(!showPaymentSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span>Payment Settings</span>
            </button>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Payment Settings Section */}
        {showPaymentSettings && (
          <div className="mb-8">
            <PaymentSettings onUpdate={() => setShowPaymentSettings(false)} />
          </div>
        )}

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-green-600" style={{ fontFamily: 'Georgia, serif' }}>
                  PKR {totalEarnings.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Pending in Escrow</p>
                <p className="text-3xl font-bold text-amber-600" style={{ fontFamily: 'Georgia, serif' }}>
                  PKR {pendingEarnings.toLocaleString()}
                </p>
              </div>
              <div className="bg-amber-100 rounded-full p-4">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </div>
          </div>
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
                          <p className="text-sm text-slate-600 mb-2">
                            Buyer: {order.buyerId?.username || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span>Order #{order._id.slice(-8)}</span>
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
                          <span>Order #{order._id.slice(-8)}</span>
                          <span>•</span>
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status & Amount */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                    <div className="text-right">
                      <p className="text-sm text-slate-500 mb-1">Sale Amount</p>
                      <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
                        PKR {order.amount.toLocaleString()}
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
                          <span className={`px-2 py-1 rounded text-xs font-bold ${order.escrowRelease
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

                {/* Shipping Provider Selection */}
                {['Escrow', 'Held'].includes(order.status) && !order.shippingProvider && order.deliveryGatewayOptions && order.deliveryGatewayOptions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="space-y-4">
                      {/* Deadline Warning */}
                      {order.sellerConfirmationDeadline && (() => {
                        const deadline = new Date(order.sellerConfirmationDeadline);
                        const now = new Date();
                        const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return daysRemaining > 0 && daysRemaining <= 7 ? (
                          <div className={`rounded-lg p-3 border ${daysRemaining <= 2
                              ? 'bg-red-50 border-red-200'
                              : daysRemaining <= 4
                                ? 'bg-orange-50 border-orange-200'
                                : 'bg-yellow-50 border-yellow-200'
                            }`}>
                            <p className={`text-sm font-semibold ${daysRemaining <= 2
                                ? 'text-red-900'
                                : daysRemaining <= 4
                                  ? 'text-orange-900'
                                  : 'text-yellow-900'
                              }`}>
                              ⚠️ Urgent: Confirm shipping within {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} or this order will be automatically cancelled!
                            </p>
                          </div>
                        ) : null;
                      })()}

                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Select Delivery Gateway</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                          {order.deliveryGatewayOptions.map((provider) => (
                            <button
                              key={provider}
                              onClick={() => setSelectedShipping(prev => ({
                                ...prev,
                                [order._id]: { ...prev[order._id], provider }
                              }))}
                              className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${selectedShipping[order._id]?.provider === provider
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                                }`}
                            >
                              {provider}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Tracking Number
                        </label>
                        <input
                          type="text"
                          placeholder="Enter tracking number"
                          value={selectedShipping[order._id]?.trackingNumber || ''}
                          onChange={(e) => setSelectedShipping(prev => ({
                            ...prev,
                            [order._id]: { ...prev[order._id], trackingNumber: e.target.value }
                          }))}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <button
                        onClick={() => handleConfirmShipping(order._id)}
                        disabled={submittingShipping === order._id}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {submittingShipping === order._id ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Confirming...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            <span>Confirm Shipping</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Buyer Confirmation Status - Show when buyer has marked satisfaction */}
                {order.status === 'in_transit' && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Truck className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0 animate-pulse" />
                        <div>
                          <p className="font-semibold text-amber-900">Buyer Has Received Package</p>
                          <p className="text-sm text-amber-700 mt-1">The buyer has marked their satisfaction. You can now confirm delivery to complete the order.</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleConfirmDelivery(order._id)}
                      disabled={submittingShipping === order._id}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submittingShipping === order._id ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Confirming...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Confirm Delivery - Complete Order</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
