import { X, CheckCircle, Shield, Package, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { useState } from 'react';

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductDetail({ product, isOpen, onClose, onAddToCart }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!isOpen || !product) return null;

  const conditionColors = {
    Mint: 'bg-green-100 text-green-800 border-green-300',
    Good: 'bg-blue-100 text-blue-800 border-blue-300',
    Fair: 'bg-amber-100 text-amber-800 border-amber-300',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
          >
            <X className="h-6 w-6 text-slate-700" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 bg-slate-50">
              <div className="mb-4 relative aspect-square rounded-xl overflow-hidden bg-white shadow-lg">
                <img
                  src={product.images[selectedImage] || 'https://images.pexels.com/photos/3886244/pexels-photo-3886244.jpeg'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {product.verified && (
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-bold shadow-lg">
                    <CheckCircle className="h-5 w-5" />
                    <span>Verified Authentic</span>
                  </div>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                          ? 'border-amber-600 shadow-md'
                          : 'border-slate-200 hover:border-amber-400'
                        }`}
                    >
                      <img src={image} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 lg:p-12 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className={`px-4 py-2 rounded-full text-sm font-bold border ${conditionColors[product.condition]}`}>
                  {product.condition} Condition
                </div>
              </div>

              <h1 className="text-4xl font-black text-slate-900 mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                {product.title}
              </h1>

              <div className="flex flex-wrap gap-4 mb-6">
                {product.team && (
                  <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm">
                    {product.team}
                  </span>
                )}
                {product.player && (
                  <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm">
                    {product.player}
                  </span>
                )}
                {product.year && (
                  <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm">
                    Year: {product.year}
                  </span>
                )}
              </div>

              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                {product.description}
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
                <div className="text-center">
                  <Shield className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-semibold">Verified</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-semibold">Escrow</p>
                </div>
                <div className="text-center">
                  <Package className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-semibold">Insured</p>
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex items-baseline justify-between mb-6">
                  <span className="text-5xl font-black text-amber-700">
                    PKR {product.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-500">+ shipping</span>
                </div>

                <button
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-3"
                >
                  <ShoppingCart className="h-6 w-6" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
