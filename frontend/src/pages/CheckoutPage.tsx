import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Shield, AlertCircle, CreditCard, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDeliveryOptions, setSelectedDeliveryOptions] = useState<string[]>([]);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    postalCode: '',
    country: ''
  });

  const deliveryGateways = ['DHL', 'FedEx', 'TCS', 'Leopard', 'M&P'];

  const total = items.reduce((sum, item) => sum + item.price, 0);

  // Redirect to home if no items in cart
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-4">Your cart is empty</h1>
          <p className="text-slate-600 mb-8">Add some items to proceed to checkout</p>
          <button
            onClick={() => navigate('/')}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const toggleDeliveryOption = (gateway: string) => {
    setSelectedDeliveryOptions(prev =>
      prev.includes(gateway)
        ? prev.filter(g => g !== gateway)
        : [...prev, gateway]
    );
  };

  const handleProceedToPay = async () => {
    if (!user) {
      setError('Please sign in to continue');
      return;
    }

    if (selectedDeliveryOptions.length === 0) {
      setError('Please select at least one delivery option');
      return;
    }

    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
      setError('Please fill in all shipping address fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Currently backend only supports one product per order
      if (items.length > 1) {
        setError('Currently, you can only checkout one item at a time. Please remove other items from your cart.');
        setLoading(false);
        return;
      }

      const product = items[0];

      // Create order - backend will create Stripe session and return checkout URL
      const response = await api.post<{ success: boolean; checkoutUrl: string; order: any }>('/orders/create', {
        productId: product._id,
        shippingAddress,
        deliveryGatewayOptions: selectedDeliveryOptions
      });

      // Backend returns: { success: true, order: {...}, checkoutUrl: "stripe.com/..." }
      if (response.data.success && response.data.checkoutUrl) {
        // Redirect to Stripe checkout page
        window.location.href = response.data.checkoutUrl;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err: any) {
      const errorMessage = err?.userMessage || err?.response?.data?.message || err?.message || 'Payment failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Button */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-amber-600 hover:text-amber-700 font-semibold transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Shopping</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black text-slate-900 mb-8">Secure Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Escrow Protection Info */}
              <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-xl">
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900 mb-1">Escrow Protection</h3>
                    <p className="text-sm text-amber-800">Your payment is securely held in escrow until you confirm receipt and authenticity of the item.</p>
                  </div>
                </div>
              </div>

              {/* Payment Error */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Delivery Gateway Selection */}
              <div className="bg-white p-8 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Truck className="h-6 w-6 text-slate-700" />
                  <h2 className="text-xl font-bold text-slate-900">Select Delivery Options</h2>
                </div>
                <p className="text-sm text-slate-600 mb-4">Choose one or more delivery providers for the seller to select from:</p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {deliveryGateways.map((gateway) => (
                    <button
                      key={gateway}
                      onClick={() => toggleDeliveryOption(gateway)}
                      className={`px-4 py-3 rounded-lg font-semibold border-2 transition-all text-center ${selectedDeliveryOptions.includes(gateway)
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400'
                        }`}
                    >
                      {gateway}
                    </button>
                  ))}
                </div>

                {selectedDeliveryOptions.length === 0 && (
                  <p className="text-xs text-red-600 mt-2">Please select at least one delivery option</p>
                )}
                {selectedDeliveryOptions.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">✓ Selected: {selectedDeliveryOptions.join(', ')}</p>
                )}
              </div>

              {/* Shipping Address */}
              <div className="bg-white p-8 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-2 mb-6">
                  <Truck className="h-6 w-6 text-slate-700" />
                  <h2 className="text-xl font-bold text-slate-900">Shipping Address</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Street Address</label>
                    <input
                      type="text"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="123 Bandar Road"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Karachi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="74700"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Pakistan"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-6 bg-white p-8 rounded-xl border border-slate-200">
                <div className="text-center space-y-4">
                  <div className="bg-slate-100 rounded-full p-6 w-20 h-20 mx-auto flex items-center justify-center">
                    <CreditCard className="h-10 w-10 text-slate-600" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to Complete Your Purchase?</h2>
                    <p className="text-slate-600">
                      You'll be redirected to Stripe's secure payment page to complete your transaction.
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleProceedToPay}
                      disabled={loading || !user}
                      className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Redirecting to Payment...</span>
                        </>
                      ) : !user ? (
                        <span>Please Sign In to Continue</span>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5" />
                          <span>Proceed to Pay PKR {total.toLocaleString()}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center">
                Powered by Stripe • Your payment information is securely processed
              </p>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white p-6 rounded-xl border border-slate-200">
                <h2 className="font-bold text-slate-900 mb-4 text-lg">Order Summary</h2>

                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item._id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                      <p className="font-semibold text-slate-900 line-clamp-2 text-sm mb-1">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-600 mb-2">{item.condition}</p>
                      <p className="font-bold text-amber-700">PKR {item.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>PKR {total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-black text-amber-700">PKR {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
