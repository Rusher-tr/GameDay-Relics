import { X, Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const navigate = useNavigate();
  const { items, removeFromCart, getTotal } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b-2 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="h-6 w-6 text-amber-700" />
              <h2 className="text-2xl font-black text-slate-900">Your Cart</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-amber-200 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-slate-700" />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <ShoppingBag className="h-24 w-24 text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h3>
              <p className="text-slate-600 mb-6">Add some vintage memorabilia to get started!</p>
              <button
                onClick={onClose}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="flex space-x-4 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-amber-300 transition-colors"
                  >
                    <img
                      src={item.images[0] || 'https://images.pexels.com/photos/3886244/pexels-photo-3886244.jpeg'}
                      alt={item.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-amber-700 font-bold mb-3">
                        ${item.price.toLocaleString()}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600 font-medium">
                          Qty: <span className="text-slate-900 font-bold">{item.quantity}</span>
                        </div>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-slate-200 p-6 bg-slate-50">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold text-slate-700">Total:</span>
                  <span className="text-3xl font-black text-amber-700">
                    ${getTotal().toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/checkout');
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-lg font-bold text-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
