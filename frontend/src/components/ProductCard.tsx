import { ShoppingCart, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

interface ProductCardProps {
  product: Product;
  buyerOrders?: any[];
}

export default function ProductCard({ product, buyerOrders = [] }: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const isSeller = user?.role === 'seller';

  // Check if buyer has pending order for this product
  const hasPendingOrder = buyerOrders.some(order =>
    order.productId?._id === product._id &&
    !['Completed', 'Refunded'].includes(order.status)
  );

  const canAddToCart = !isSeller && !hasPendingOrder;

  const conditionColors = {
    Mint: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
    Good: 'bg-blue-50 text-blue-700 border border-blue-300',
    Fair: 'bg-amber-50 text-amber-700 border border-amber-300',
  };

  return (
    <div
      className="group bg-white rounded overflow-hidden hover:shadow-2xl transition-all duration-300 border"
      style={{ borderColor: '#d4c9b9' }}
      onClick={() => navigate(`/product/${product._id}`)}
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer">
        <img
          src={product.images[0] || 'https://images.pexels.com/photos/3886244/pexels-photo-3886244.jpeg'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.verified && (
          <div className="absolute top-3 right-3 text-white px-3 py-1 rounded-full flex items-center space-x-1 text-xs font-bold shadow-lg" style={{ backgroundColor: '#1c452a' }}>
            <CheckCircle className="h-4 w-4" />
            <span>Verified</span>
          </div>
        )}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded text-xs font-bold ${conditionColors[product.condition as keyof typeof conditionColors] || 'bg-gray-50 text-gray-700 border border-gray-300'}`}>
          {product.condition}
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-georgia font-bold text-lg mb-2" style={{ color: '#1c452a' }}>
          {product.title}
        </h3>


        <p className="font-inter text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="font-georgia text-2xl font-bold" style={{ color: '#1c452a' }}>
            PKR {product.price.toLocaleString()}
          </span>
          {canAddToCart && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const result = addToCart(product);
                if (result === 'already_in_cart') {
                  addNotification('Product already in cart', 'warning', 1500);
                } else {
                  addNotification('Added to cart', 'success', 1500);
                }
              }}
              className="text-white px-4 py-2 rounded flex items-center space-x-2 transition-all font-bold border hover:shadow-lg"
              style={{
                backgroundColor: '#1c452a',
                borderColor: '#1c452a',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.05em'
              }}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
