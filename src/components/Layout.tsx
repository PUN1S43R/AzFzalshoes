import { useState, useEffect } from 'react';
import { 
  Menu, Search, Heart, ShoppingBag, X, ChevronRight, 
  Home, Grid, User, Package, Star, ArrowRight,
  Instagram, Youtube, Mail, Phone, MapPin, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { categoriesApi } from '../lib/api';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const { user, role } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await categoriesApi.getAll();
        if (data) setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-black border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 text-white"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-1">
              <span className="text-2xl font-black tracking-tighter text-white">AFZAL</span>
              <span className="text-2xl font-black tracking-tighter text-red-600">SHOES</span>
            </Link>

            {/* Desktop Categories */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link to="/products" className="text-sm font-bold uppercase tracking-widest text-white hover:text-red-600 transition-colors">Shop All</Link>
              <div className="group relative">
                <button className="text-sm font-bold uppercase tracking-widest text-white hover:text-red-600 transition-colors">Categories</button>
                <div className="absolute top-full left-0 w-48 bg-black border border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  {categories.map(cat => (
                    <Link 
                      key={cat.id} 
                      to={`/products?category=${cat.id}`}
                      className="block px-4 py-3 text-sm text-white hover:bg-white/10"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
              <Link to="/products?tag=@599" className="text-sm font-bold uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors">@599 Store</Link>
              <Link to="/products?tag=Premium" className="text-sm font-bold uppercase tracking-widest text-white hover:text-red-600 transition-colors">Premium</Link>
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-4">
              <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <Link to="/wishlist" className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                <Heart className="w-5 h-5" />
              </Link>
              <Link to="/account" className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                <User className="w-5 h-5" />
              </Link>
              <Link to="/cart" className="p-2 text-white hover:bg-white/10 rounded-full transition-colors relative">
                <ShoppingBag className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cart.length}
                  </span>
                )}
              </Link>
              {role === 'admin' || role === 'superadmin' ? (
                <Link to="/admin" className="hidden lg:block text-xs font-bold bg-white text-black px-3 py-1 rounded">ADMIN</Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 overflow-hidden bg-black"
            >
              <div className="max-w-3xl mx-auto px-4 py-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search for products, brands and more..."
                    className="w-full bg-white/10 border-none rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-white/20"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        navigate(`/products?q=${e.currentTarget.value}`);
                        setIsSearchOpen(false);
                      }
                    }}
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-black backdrop-blur-2xl z-[70] shadow-2xl overflow-y-auto border-r border-white/10"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-12">
                  <div className="flex items-center space-x-1">
                    <span className="text-xl font-black tracking-tighter text-white">AFZAL</span>
                    <span className="text-xl font-black tracking-tighter text-red-600">SHOES</span>
                  </div>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white"><X className="w-6 h-6" /></button>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 px-4">Main Menu</p>
                  <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-4 px-4 py-4 rounded-2xl hover:bg-white/5 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all text-white">
                      <Home className="w-5 h-5" />
                    </div>
                    <span className="font-black uppercase text-xs tracking-widest text-white">Home</span>
                  </Link>
                  <Link to="/products" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-4 px-4 py-4 rounded-2xl hover:bg-white/5 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all text-white">
                      <Grid className="w-5 h-5" />
                    </div>
                    <span className="font-black uppercase text-xs tracking-widest text-white">Shop All</span>
                  </Link>
                  <Link to="/products?tag=@599" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-4 px-4 py-4 rounded-2xl hover:bg-white/5 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                      <Star className="w-5 h-5" />
                    </div>
                    <span className="font-black uppercase text-xs tracking-widest text-red-600 group-hover:text-red-600">@599 Store</span>
                  </Link>
                  <Link to="/products?tag=Premium" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-4 px-4 py-4 rounded-2xl hover:bg-white/5 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all text-white">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="font-black uppercase text-xs tracking-widest text-white">Premium</span>
                  </Link>

                  <div className="pt-8 mt-4 border-t border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 px-4">Categories</p>
                    <div className="grid grid-cols-1 gap-1">
                      {categories.map(cat => (
                        <Link 
                          key={cat.id} 
                          to={`/products?category=${cat.id}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
                        >
                          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white">{cat.name}</span>
                          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 mt-4 border-t border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 px-4">Account</p>
                    <Link to="/account" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-4 px-4 py-4 rounded-2xl hover:bg-white/5 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all text-white">
                        <User className="w-5 h-5" />
                      </div>
                      <span className="font-black uppercase text-xs tracking-widest text-white">Profile</span>
                    </Link>
                    <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-4 px-4 py-4 rounded-2xl hover:bg-white/5 transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all text-white">
                        <Heart className="w-5 h-5" />
                      </div>
                      <span className="font-black uppercase text-xs tracking-widest text-white">Wishlist</span>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export const BottomNav = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isActive = (path: string, tag?: string) => {
    const params = new URLSearchParams(location.search);
    const currentTag = params.get('tag');
    
    if (tag) {
      return location.pathname === '/products' && currentTag === tag;
    }
    
    if (path === '/') {
      return (location.pathname === '/' || (location.pathname === '/products' && !currentTag)) && !location.pathname.startsWith('/account');
    }
    
    if (path === '/account/orders') {
      return location.pathname === '/account' && params.get('view') === 'orders';
    }

    if (path === '/account') {
      return location.pathname === '/account' && (!params.get('view') || params.get('view') === 'profile');
    }
    
    return location.pathname.startsWith(path);
  };

  return (
    <motion.div 
      animate={{ y: isVisible ? 0 : 100 }}
      className="lg:hidden fixed bottom-0 inset-x-0 bg-black border-t border-white/10 z-50 px-6 py-3"
    >
      <div className="flex justify-between items-center text-white">
        <Link to="/" className={`flex flex-col items-center space-y-1 ${isActive('/') ? 'text-red-600' : 'text-white'}`}>
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">Shop</span>
        </Link>
        <Link to="/products?tag=@599" className={`flex flex-col items-center space-y-1 ${isActive('/products', '@599') ? 'text-red-600' : 'text-white'}`}>
          <Star className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">@599</span>
        </Link>
        <Link to="/products?tag=Premium" className={`flex flex-col items-center space-y-1 ${isActive('/products', 'Premium') ? 'text-red-600' : 'text-white'}`}>
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">Premium</span>
        </Link>
        <Link to="/account?view=orders" className={`flex flex-col items-center space-y-1 ${isActive('/account/orders') ? 'text-red-600' : 'text-white'}`}>
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">Orders</span>
        </Link>
        <Link to="/account" className={`flex flex-col items-center space-y-1 ${isActive('/account') ? 'text-red-600' : 'text-white'}`}>
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">Account</span>
        </Link>
      </div>
    </motion.div>
  );
};

export const Footer = () => {
  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-24 lg:pb-16 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <Link to="/" className="flex items-center space-x-1 mb-6">
              <span className="text-xl font-black tracking-tighter text-white">AFZAL</span>
              <span className="text-xl font-black tracking-tighter text-red-600">SHOES</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Premium footwear for the modern individual. Quality, comfort, and style in every step.
            </p>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-sm mb-6 text-white">Quick Links</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors">Return Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-sm mb-6 text-white">Contact Info</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-red-600" />
                <span>+91 93262 00617</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-red-600" />
                <span>support@afzalshoes.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 mt-1 text-red-600" />
                <span>next to aqsa hotel near darul falah masjid mumbra thane</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-sm mb-6 text-white">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="p-3 bg-white/5 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="p-3 bg-white/5 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Youtube className="w-5 h-5" /></a>
              <a href="#" className="p-3 bg-white/5 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><MessageCircle className="w-5 h-5" /></a>
              <a href="#" className="p-3 bg-white/5 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Mail className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-xs text-gray-500">© 2026 Afzal Shoes. All rights reserved.</p>
          <p className="text-xs font-bold tracking-widest uppercase text-white">
            Developed by <a href="https://techszdeveloper.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition-colors">TECHSZDEVELOPER</a>
          </p>
        </div>
      </div>

      {/* Floating WhatsApp */}
      <a 
        href="https://wa.me/919326200617" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 lg:bottom-10 lg:right-10 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-40"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </footer>
  );
};
