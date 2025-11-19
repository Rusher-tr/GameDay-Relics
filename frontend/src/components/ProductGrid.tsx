import { Product } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const navigate = useNavigate();
  
  // Show only first 8 products as featured
  const featuredProducts = products.slice(0, 8);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-black mb-2 font-georgia" style={{ color: '#1c452a' }}>
            Hot Picks
            </h2>
            <p className="text-xl font-inter" style={{ color: '#1c452a', opacity: 0.8 }}>Trending items from our latest collection</p>
          </div>
          <button
            onClick={() => navigate('/shop')}
            className="hidden md:flex items-center space-x-2 text-white px-6 py-3 rounded font-bold transition-all hover:shadow-lg border-2"
            style={{ 
              backgroundColor: '#1c452a',
              borderColor: '#1c452a',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}
          >
            <span>View All</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
            />
          ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <button
            onClick={() => navigate('/shop')}
            className="text-white px-8 py-3 rounded font-bold transition-all flex items-center justify-center space-x-2 mx-auto border-2"
            style={{ 
              backgroundColor: '#1c452a',
              borderColor: '#1c452a',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}
          >
            <span>View All Items</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
