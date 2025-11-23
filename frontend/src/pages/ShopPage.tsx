import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Grid, ArrowLeft, Search, ChevronDown } from 'lucide-react';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export default function ShopPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300000]);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({
    sort: false,
    category: false,
    condition: false,
    price: false
  });
  const [buyerOrders, setBuyerOrders] = useState<any[]>([]);

  useEffect(() => {
    // Fetch products from backend
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        // Backend returns: { statusCode, data: { products, pagination }, message, success }
        setProducts(response.data.data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch buyer's orders if user is a buyer
  useEffect(() => {
    const fetchBuyerOrders = async () => {
      if (!user || user.role !== 'buyer') {
        setBuyerOrders([]);
        return;
      }

      try {
        const response = await api.get('/orders/mine');
        setBuyerOrders(response.data.data || []);
      } catch (error) {
        console.error('Error fetching buyer orders:', error);
        setBuyerOrders([]);
      }
    };

    fetchBuyerOrders();
  }, [user]);

  const toggleFilter = (filter: keyof typeof expandedFilters) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  // Extract unique conditions from products
  const conditions = useMemo(() => {
    const conds = new Set(products.map(p => p.condition));
    return Array.from(conds).sort();
  }, [products]);

  // For now, categories are not used but keeping the filter UI for future
  const categories: string[] = [];

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      if (searchQuery && !product.title.toLowerCase().includes(searchLower) &&
        !product.description.toLowerCase().includes(searchLower)) {
        return false;
      }

      // Condition filter
      if (selectedCondition && product.condition !== selectedCondition) {
        return false;
      }

      // Price filter
      if (product.price < priceRange[0] || product.price > priceRange[1]) {
        return false;
      }

      return true;
    });

    // Sort
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [products, searchQuery, selectedCondition, priceRange, sortBy]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Background */}
      <div
        className="relative w-full py-12 bg-cover bg-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url("/hero-img.jpg")',
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black font-georgia mb-2" style={{ color: '#fff' }}>
            Shop All Items
          </h1>
          <p className="font-inter text-lg" style={{ color: '#f2dec4' }}>
            Browse our collection of authenticated vintage sports memorabilia
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b" style={{ borderColor: '#d4c9b9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#1c452a' }} />
            <input
              type="text"
              placeholder="Search by player, team, or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border rounded font-inter focus:outline-none"
              style={{
                borderColor: '#d4c9b9',
                color: '#1c452a'
              }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block">
            <div className="bg-white rounded border p-6 sticky top-32 space-y-4" style={{ borderColor: '#d4c9b9' }}>
              {/* Sort By */}
              <div>
                <button
                  onClick={() => toggleFilter('sort')}
                  className="flex items-center justify-between w-full py-2"
                  style={{ color: '#1c452a' }}
                >
                  <h3 className="font-georgia font-bold">Sort By</h3>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${expandedFilters.sort ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedFilters.sort && (
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded font-inter focus:outline-none mt-2"
                    style={{
                      borderColor: '#d4c9b9',
                      color: '#1c452a'
                    }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                )}
              </div>

              <div className="border-t" style={{ borderColor: '#d4c9b9' }}></div>

              {/* Category Filter */}
              <div>
                <button
                  onClick={() => toggleFilter('category')}
                  className="flex items-center justify-between w-full py-2"
                  style={{ color: '#1c452a' }}
                >
                  <h3 className="font-georgia font-bold">Category</h3>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${expandedFilters.category ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedFilters.category && (
                  <div className="space-y-2 mt-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="block w-full text-left px-3 py-2 rounded font-inter transition-colors"
                      style={{
                        backgroundColor: selectedCategory === null ? '#1c452a' : 'transparent',
                        color: selectedCategory === null ? '#f2dec4' : '#1c452a'
                      }}
                    >
                      All Categories
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat as string)}
                        className="block w-full text-left px-3 py-2 rounded font-inter transition-colors"
                        style={{
                          backgroundColor: selectedCategory === cat ? '#1c452a' : 'transparent',
                          color: selectedCategory === cat ? '#f2dec4' : '#1c452a'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t" style={{ borderColor: '#d4c9b9' }}></div>

              {/* Condition Filter */}
              <div>
                <button
                  onClick={() => toggleFilter('condition')}
                  className="flex items-center justify-between w-full py-2"
                  style={{ color: '#1c452a' }}
                >
                  <h3 className="font-georgia font-bold">Condition</h3>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${expandedFilters.condition ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedFilters.condition && (
                  <div className="space-y-2 mt-2">
                    <button
                      onClick={() => setSelectedCondition(null)}
                      className="block w-full text-left px-3 py-2 rounded font-inter transition-colors"
                      style={{
                        backgroundColor: selectedCondition === null ? '#1c452a' : 'transparent',
                        color: selectedCondition === null ? '#f2dec4' : '#1c452a'
                      }}
                    >
                      All Conditions
                    </button>
                    {conditions.map(cond => (
                      <button
                        key={cond}
                        onClick={() => setSelectedCondition(cond)}
                        className="block w-full text-left px-3 py-2 rounded font-inter transition-colors"
                        style={{
                          backgroundColor: selectedCondition === cond ? '#1c452a' : 'transparent',
                          color: selectedCondition === cond ? '#f2dec4' : '#1c452a'
                        }}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t" style={{ borderColor: '#d4c9b9' }}></div>

              {/* Price Range Filter */}
              <div>
                <button
                  onClick={() => toggleFilter('price')}
                  className="flex items-center justify-between w-full py-2"
                  style={{ color: '#1c452a' }}
                >
                  <h3 className="font-georgia font-bold">Price Range</h3>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${expandedFilters.price ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedFilters.price && (
                  <div className="space-y-3 mt-2">
                    <div>
                      <label className="text-sm font-inter mb-1 block" style={{ color: '#1c452a' }}>Min: PKR {(priceRange[0] / 1000).toFixed(0)}K</label>
                      <input
                        type="range"
                        min="0"
                        max="300000"
                        step="10000"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-inter mb-1 block" style={{ color: '#1c452a' }}>Max: PKR {(priceRange[1] / 1000).toFixed(0)}K</label>
                      <input
                        type="range"
                        min="0"
                        max="300000"
                        step="10000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              {(selectedCategory || selectedCondition || searchQuery || priceRange[0] > 0 || priceRange[1] < 300000) && (
                <>
                  <div className="border-t" style={{ borderColor: '#d4c9b9' }}></div>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                      setSelectedCondition(null);
                      setPriceRange([0, 300000]);
                    }}
                    className="w-full py-2 rounded font-semibold transition-all border font-inter"
                    style={{
                      backgroundColor: '#1c452a',
                      color: '#f2dec4',
                      borderColor: '#1c452a'
                    }}
                  >
                    Clear All Filters
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center space-x-2 bg-white border px-4 py-3 rounded w-full font-semibold font-inter"
              style={{
                borderColor: '#d4c9b9',
                color: '#1c452a'
              }}
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
              <ChevronDown className={`h-5 w-5 ml-auto transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
            </button>

            {showMobileFilters && (
              <div className="mt-4 bg-white rounded border p-6 space-y-4" style={{ borderColor: '#d4c9b9' }}>
                <div>
                  <label className="font-georgia font-bold mb-2 block" style={{ color: '#1c452a' }}>Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded font-inter"
                    style={{
                      borderColor: '#d4c9b9',
                      color: '#1c452a'
                    }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Results Count */}
            <div className="mb-6 p-4 bg-white rounded border" style={{ borderColor: '#d4c9b9' }}>
              <p className="font-inter" style={{ color: '#1c452a' }}>
                <span className="font-bold">{filteredProducts.length}</span> items found
                {selectedCategory && ` in ${selectedCategory}`}
              </p>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product._id} product={product} buyerOrders={buyerOrders} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded border p-12 text-center" style={{ borderColor: '#d4c9b9' }}>
                <Grid className="h-16 w-16 mx-auto mb-4" style={{ color: '#d4c9b9' }} />
                <h3 className="text-xl font-georgia font-bold mb-2" style={{ color: '#1c452a' }}>No items found</h3>
                <p className="font-inter mb-6" style={{ color: '#1c452a', opacity: 0.7 }}>Try adjusting your filters or search query</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                    setSelectedCondition(null);
                    setPriceRange([0, 300000]);
                  }}
                  className="px-6 py-2 rounded font-semibold transition-all font-inter border"
                  style={{
                    backgroundColor: '#1c452a',
                    color: '#f2dec4',
                    borderColor: '#1c452a'
                  }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
