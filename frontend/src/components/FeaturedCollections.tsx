import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { mockProducts } from '../data/mockProducts';

export default function FeaturedCollections() {
  const navigate = useNavigate();

  // build a small set of curated collections from categories
  const collections = useMemo(() => {
    const cats = Array.from(new Set(mockProducts.map(p => p.category).filter(Boolean)));
    // produce up to 4 collections using first product images as hero
    return cats.slice(0, 4).map((cat) => ({
      category: cat as string,
      heroImage: mockProducts.find(p => p.category === cat)?.images?.[0] || '/placeholder.png',
      description: `Curated items from ${cat}`,
    }));
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-3 font-georgia" style={{ color: '#1c452a' }}>
            Featured Collections
          </h2>
          <p className="text-lg font-inter text-gray-600">Hand-picked galleries and trending categories</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((c) => (
            <button
              key={c.category}
              onClick={() => navigate('/shop')}
              className="group relative overflow-hidden shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] border-t-4"
              style={{ borderColor: '#1c452a' }}
            >
              <div className="relative h-56 overflow-hidden bg-gray-200">
                <img src={c.heroImage} alt={c.category} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-2xl font-georgia font-bold">{c.category}</h3>
                <p className="text-sm font-inter" style={{ color: '#f2dec4' }}>{c.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/shop')}
            className="inline-flex items-center space-x-2 text-white px-6 py-3 rounded font-bold transition-all hover:shadow-lg border-2"
            style={{ 
              backgroundColor: '#1c452a',
              borderColor: '#1c452a',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontSize: '0.875rem'
            }}
          >
            <span>View All Collections</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
