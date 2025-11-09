import { ShoppingCart, CheckCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onClick: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onClick }: ProductCardProps) {
  const conditionColors = {
    Mint: 'bg-green-100 text-green-800 border-green-300',
    Good: 'bg-blue-100 text-blue-800 border-blue-300',
    Fair: 'bg-amber-100 text-amber-800 border-amber-300',
  };

  return (
    <div
      className="group bg-white rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-slate-200 hover:border-amber-500 cursor-pointer"
      onClick={() => onClick(product)}
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.images[0] || 'https://images.pexels.com/photos/3886244/pexels-photo-3886244.jpeg'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {product.verified && (
          <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full flex items-center space-x-1 text-xs font-bold shadow-lg">
            <CheckCircle className="h-4 w-4" />
            <span>Verified</span>
          </div>
        )}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold border ${conditionColors[product.condition]}`}>
          {product.condition}
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 text-slate-800 line-clamp-2 group-hover:text-amber-700 transition-colors">
          {product.title}
        </h3>

        {product.team && (
          <p className="text-sm text-slate-600 mb-1">{product.team}</p>
        )}

        {product.year && (
          <p className="text-xs text-slate-500 mb-3">Year: {product.year}</p>
        )}

        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-black text-amber-700">
            ${product.price.toLocaleString()}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors font-semibold"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
