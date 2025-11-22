import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, Package, DollarSign, Image as ImageIcon, Plus } from 'lucide-react';
import { Product } from '../types';
import { toast } from 'react-toastify';
import api from '../lib/api';
import ConfirmationModal from '../components/ConfirmationModal';

export default function SellerProductsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

    useEffect(() => {
        if (!user || user.role !== 'seller') {
            navigate('/');
            return;
        }
        fetchSellerProducts();
    }, [user, navigate]);

    const fetchSellerProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/products');
            const responseData = response.data as { data: { products: Product[] } };

            // Filter products by current seller
            const sellerProducts = responseData.data.products.filter(
                (product) => {
                    const sellerId = typeof product.sellerId === 'object'
                        ? product.sellerId._id
                        : product.sellerId;
                    return sellerId === user?._id;
                }
            );

            setProducts(sellerProducts);
        } catch (error) {
            console.error('[SellerProducts] Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = (product: Product) => {
        setConfirmDelete(product);
    };

    const confirmDeleteProduct = async () => {
        if (!confirmDelete) return;

        try {
            await api.delete(`/products/delete/${confirmDelete._id}`);
            toast.success(`✅ Product "${confirmDelete.title}" deleted successfully`, {
                position: 'top-right',
                autoClose: 3000,
            });
            setConfirmDelete(null);
            fetchSellerProducts();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete product';
            console.error('[SellerProducts] Delete error:', error);
            toast.error(errorMessage, {
                position: 'top-right',
                autoClose: 5000,
            });
            setConfirmDelete(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading your products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">My Products</h1>
                            <p className="text-slate-600 mt-1">Manage your product listings</p>
                        </div>
                        <button
                            onClick={() => navigate('/list-product')}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                        >
                            <Plus className="h-5 w-5" />
                            <span>List New Product</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {products.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                        <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Products Yet</h2>
                        <p className="text-slate-600 mb-6">Start by listing your first product</p>
                        <button
                            onClick={() => navigate('/list-product')}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center space-x-2"
                        >
                            <Plus className="h-5 w-5" />
                            <span>List Product</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 flex items-center justify-between">
                            <p className="text-slate-600">
                                <span className="font-semibold text-slate-900">{products.length}</span> product{products.length !== 1 ? 's' : ''} found
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((product) => (
                                <div
                                    key={product._id}
                                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200 overflow-hidden"
                                >
                                    {/* Product Image */}
                                    <div
                                        className="aspect-square bg-slate-100 relative cursor-pointer"
                                        onClick={() => navigate(`/product/${product._id}`)}
                                    >
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="h-16 w-16 text-slate-300" />
                                            </div>
                                        )}
                                        {product.verified && (
                                            <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                                                ✓ Verified
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-4">
                                        <h3
                                            className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 cursor-pointer hover:text-amber-700"
                                            onClick={() => navigate(`/product/${product._id}`)}
                                        >
                                            {product.title}
                                        </h3>

                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                                <DollarSign className="h-4 w-4 text-amber-600" />
                                                <span className="text-2xl font-black text-amber-700">
                                                    ${product.price.toLocaleString()}
                                                </span>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${product.condition === 'Mint' ? 'bg-green-100 text-green-800 border-green-300' :
                                                    product.condition === 'Good' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                                        product.condition === 'Fair' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                                            'bg-gray-100 text-gray-800 border-gray-300'
                                                }`}>
                                                {product.condition}
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => navigate(`/product/${product._id}`)}
                                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-semibold transition-colors text-sm"
                                            >
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product)}
                                                className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-1"
                                                title="Delete product"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={confirmDeleteProduct}
                title="Delete Product"
                message={`Are you sure you want to delete "${confirmDelete?.title}"?\n\nNote: Products in Escrow, Shipped, or Disputed orders cannot be deleted.`}
                confirmText="Delete Product"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
}
