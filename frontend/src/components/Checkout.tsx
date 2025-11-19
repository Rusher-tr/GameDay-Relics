import { X, Shield, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export default function Checkout({ isOpen, onClose, onSuccess }: CheckoutProps) {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    exp: '',
    cvc: '',
    name: ''
  });

  const total = items.reduce((sum, item) => sum + item.price, 0);

  if (!isOpen || items.length === 0) return null;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create order with card details and items
      const { data } = await api.post<{ success: boolean; message?: string; orderId: string }>('/orders', {
        items: items.map(item => ({
          productId: item.id,
          price: item.price
        })),
        payment: {
          cardNumber: cardDetails.number.replace(/\s/g, ''),
          expiry: cardDetails.exp,
          cvc: cardDetails.cvc,
          name: cardDetails.name
        }
      });

      // Clear cart and close checkout
      clearCart();
      onClose();
      
      // Call the success callback with the order ID
      onSuccess(data.orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
          >
            <X className="h-6 w-6 text-slate-700" />
          </button>

          <div className="p-8">
            <h2 className="text-3xl font-black text-slate-900 mb-8">Secure Checkout</h2>

            <div className="space-y-8">
              <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-xl">
                <div className="flex items-start space-x-3 mb-4">
                  <Shield className="h-6 w-6 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900 mb-1">Escrow Protection</h3>
                    <p className="text-sm text-amber-800">Your payment is securely held in escrow until you confirm receipt and authenticity of the item.</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-bold text-slate-900 mb-4">Order Summary</h3>
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="text-sm text-slate-600">{item.condition} • Qty: 1</p>
                      </div>
                      <p className="font-bold text-amber-700">${item.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-lg font-bold text-slate-900">Total Amount</span>
                  <span className="text-3xl font-black text-amber-700">${total.toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handlePayment} className="space-y-4 border-t border-slate-200 pt-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={cardDetails.exp}
                      onChange={(e) => setCardDetails({ ...cardDetails, exp: e.target.value })}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      CVC
                    </label>
                    <input
                      type="text"
                      value={cardDetails.cvc}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                      placeholder="123"
                      maxLength={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? 'Processing Payment...' : `Complete Purchase - $${total.toLocaleString()}`}
                </button>
              </form>

              <p className="text-xs text-slate-500 text-center">
                Your payment information is securely processed. Demo: use card 4242 4242 4242 4242
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
