import { Product } from '../types';
import ProductCard from './ProductCard';
import { useCart } from '../contexts/CartContext';

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function ProductGrid({ products, onProductClick }: ProductGridProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-slate-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Featured Collection
          </h2>
          <p className="text-xl text-slate-600">Rare and authentic vintage sports memorabilia</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onClick={onProductClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
