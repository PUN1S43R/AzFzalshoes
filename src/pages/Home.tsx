import React, { useState, useEffect } from 'react';
import { slidersApi, categoriesApi, productsApi, wishlistApi } from '../lib/api';
import { ChevronLeft, ChevronRight, Star, Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export const Home = () => {
// ...
// (keeping Home as is, just updating imports)
  const [sliders, setSliders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [under599Products, setUnder599Products] = useState<any[]>([]);
  const [currentSlider, setCurrentSlider] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, cRes, nRes, uRes] = await Promise.all([
          slidersApi.getAll(),
          categoriesApi.getAll(),
          productsApi.getAll({ is_new_arrival: 'true', limit: 8 }),
          productsApi.getAll({ is_under_599: 'true', limit: 8 })
        ]);
        
        if (sRes.data) setSliders(sRes.data);
        if (cRes.data) setCategories(cRes.data);
        if (nRes.data) setNewArrivals(nRes.data);
        if (uRes.data) setUnder599Products(uRes.data);
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };
    fetchData();
  }, []);

  const nextSlider = () => setCurrentSlider(prev => (prev + 1) % sliders.length);
  const prevSlider = () => setCurrentSlider(prev => (prev - 1 + sliders.length) % sliders.length);

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Slider */}
      <section className="relative h-[60vh] lg:h-[80vh] overflow-hidden bg-gray-100">
        {sliders.length > 0 ? (
          <>
            <div className="absolute inset-0">
              {sliders.map((slider, idx) => (
                <motion.div
                  key={slider.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: idx === currentSlider ? 1 : 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <Link 
                    to={slider.category_id ? `/products?category=${slider.category_id}` : '/products'}
                    className="block w-full h-full"
                  >
                    <picture>
                      <source media="(max-width: 768px)" srcSet={slider.mobile_banner} />
                      <img 
                        src={slider.desktop_banner} 
                        alt="Banner" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </picture>
                  </Link>
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-center px-4 pointer-events-none">
                    <div className="max-w-3xl pointer-events-auto">
                      {slider.show_description && (
                        <motion.p 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: idx === currentSlider ? 0 : 20, opacity: idx === currentSlider ? 1 : 0 }}
                          className="text-white text-lg lg:text-2xl font-medium mb-6"
                        >
                          {slider.description}
                        </motion.p>
                      )}
                      {slider.show_button && (
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: idx === currentSlider ? 0 : 20, opacity: idx === currentSlider ? 1 : 0 }}
                        >
                          <Link 
                            to={slider.category_id ? `/products?category=${slider.category_id}` : '/products'}
                            className="inline-block bg-white text-black px-10 py-4 font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                          >
                            {slider.button_text || 'Shop Now'}
                          </Link>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <button onClick={prevSlider} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/50 hover:bg-white rounded-full transition-colors z-10">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={nextSlider} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/50 hover:bg-white rounded-full transition-colors z-10">
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <p className="text-gray-400 font-bold uppercase tracking-widest">Afzal Shoes Collection</p>
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-black uppercase tracking-widest mb-8 text-center">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-8">
          {categories.map(cat => (
            <Link 
              key={cat.id} 
              to={`/products?category=${cat.id}`}
              className="group text-center"
            >
              <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-4 rounded-lg">
                <img 
                  src={cat.image_url} 
                  alt={cat.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="font-bold uppercase tracking-widest text-sm">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-widest">New Arrivals</h2>
              <p className="text-gray-500 text-sm">Our latest footwear collection</p>
            </div>
            <Link to="/products" className="text-sm font-bold uppercase tracking-widest border-b-2 border-black pb-1">View All</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {newArrivals.map(product => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Under 599 Section */}
      {under599Products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-widest">Budget Store @599</h2>
              <p className="text-gray-500 text-sm">Quality shoes at unbeatable prices</p>
            </div>
            <Link to="/products" className="text-sm font-bold uppercase tracking-widest border-b-2 border-black pb-1">View All</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {under599Products.map(product => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Promo Section */}
      <section className="bg-black text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter mb-6">Premium Collection</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-10">
            Experience the ultimate in luxury and comfort with our handcrafted premium leather shoes.
          </p>
          <Link to="/products?tag=Premium" className="inline-block bg-white text-black px-12 py-4 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">
            Explore Premium
          </Link>
        </div>
      </section>
    </div>
  );
};

export const ProductCard = ({ product, onRemove, isWishlistPage }: { product: any, onRemove?: () => void, isWishlistPage?: boolean }) => {
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isWishlisted = isInWishlist(product.id);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    const wasWishlisted = isWishlisted;
    await toggleWishlist(product.id);
    if (onRemove && wasWishlisted) onRemove();
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleConfirmAddToCart = async () => {
    if (!selectedSize || !selectedColor) {
      toast.error('Please select size and color');
      return;
    }
    addToCart({
      id: '', // Will be generated in context
      productId: product.id,
      name: product.name,
      price: product.discount_price,
      image: product.main_image,
      quantity: 1,
      size: selectedSize,
      color: selectedColor
    });
    toast.success('Added to cart!');
    setIsModalOpen(false);
    setSelectedSize('');
    setSelectedColor('');
  };

  return (
    <div className="group relative">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative rounded-lg">
          <img 
            src={product.main_image} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          {product.discount_price < product.original_price && (
            <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded">
              {Math.round((1 - product.discount_price / product.original_price) * 100)}% OFF
            </div>
          )}
          {product.tag && (
            <div className="absolute top-4 right-4 bg-black text-white text-[10px] font-black px-2 py-1 rounded">
              {product.tag}
            </div>
          )}
          
          {/* Quick Add Overlay */}
          <div className={`absolute inset-x-0 bottom-0 p-4 transition-transform bg-white/80 backdrop-blur-sm ${isWishlistPage ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'}`}>
            <button 
              onClick={handleQuickAdd}
              className="w-full bg-black text-white py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Quick Add</span>
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{product.name}</h3>
            <button 
              onClick={handleToggle}
              className={`p-1 transition-colors ${isWishlisted ? 'text-red-600' : 'hover:text-red-600'}`}
            >
              {isWishlistPage ? (
                <Trash2 className="w-4 h-4" />
              ) : (
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              )}
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-black">₹{product.discount_price}</span>
            {product.discount_price < product.original_price && (
              <span className="text-xs text-gray-400 line-through">₹{product.original_price}</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] font-bold text-gray-500">
              {product.avg_rating ? product.avg_rating.toFixed(1) : '0.0'} ({product.review_count || 0})
            </span>
          </div>
        </div>
      </Link>

      {/* Selection Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 bg-white z-[110] rounded-t-3xl p-8 lg:max-w-md lg:mx-auto lg:rounded-3xl lg:bottom-1/2 lg:translate-y-1/2"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black uppercase tracking-widest">Select Options</h2>
                <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-bold uppercase tracking-widest text-[10px] text-gray-400">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {(product.sizes || []).map((size: string) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-bold text-xs transition-all ${selectedSize === size ? 'border-black bg-black text-white' : 'border-gray-100'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold uppercase tracking-widest text-[10px] text-gray-400">Color</h3>
                  <div className="flex flex-wrap gap-2">
                    {(product.colors || []).map((color: string) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-full border-2 font-bold text-xs transition-all ${selectedColor === color ? 'border-black bg-black text-white' : 'border-gray-100'}`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleConfirmAddToCart}
                  disabled={!selectedSize || !selectedColor}
                  className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest disabled:opacity-50 text-sm"
                >
                  Confirm & Add to Cart
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
