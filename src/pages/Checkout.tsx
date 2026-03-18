import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, CreditCard, Truck } from 'lucide-react';

export const Checkout = () => {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('Online');
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to place an order');
      return;
    }

    setLoading(true);
    try {
      const shippingCharge = total > 2000 ? 0 : 99;
      const tax = Math.round(total * 0.05);
      const finalTotal = total + shippingCharge + tax;
      
      const orderPayload = {
        total_amount: finalTotal,
        shipping_address: `${address.fullName}, ${address.phone}, ${address.street}, ${address.city}, ${address.state} - ${address.pincode}`,
        phone: address.phone,
        payment_method: paymentMethod,
        full_name: address.fullName,
        email: user.email,
        items: cart.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color
        }))
      };

      const { data: order } = await ordersApi.create(orderPayload);

      // Send Email Notification
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            subject: 'Order Confirmed - Afzal Shoes',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
                <h1 style="text-align: center; font-weight: 900; letter-spacing: -1px;">AFZAL <span style="color: #dc2626;">SHOES</span></h1>
                <h2 style="text-align: center; text-transform: uppercase;">Order Confirmed!</h2>
                <p>Hi ${address.fullName},</p>
                <p>Thank you for your order. Your order ID is <strong>#${String(order.orderId).padStart(8, '0')}</strong>.</p>
                <p>Total Amount: <strong>₹${finalTotal}</strong></p>
                <p>Payment Method: <strong>${paymentMethod}</strong></p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 10px; margin-top: 20px;">
                  <p style="margin: 0; font-weight: bold;">Shipping Address:</p>
                  <p style="margin: 5px 0 0 0;">${orderPayload.shipping_address}</p>
                </div>
                <p style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">Developed by <a href="https://techszdeveloper.vercel.app/" style="color: #666; text-decoration: none;">TECHSZDEVELOPER</a></p>
              </div>
            `
          })
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/account/orders');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      <h1 className="text-3xl font-black uppercase tracking-widest mb-12">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Shipping Details */}
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">1</div>
              <h2 className="text-xl font-black uppercase tracking-widest">Shipping Address</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                required
                placeholder="Full Name"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black"
                value={address.fullName}
                onChange={e => setAddress({...address, fullName: e.target.value})}
              />
              <input 
                required
                placeholder="Phone Number"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black"
                value={address.phone}
                onChange={e => setAddress({...address, phone: e.target.value})}
              />
              <input 
                required
                placeholder="Street Address"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black md:col-span-2"
                value={address.street}
                onChange={e => setAddress({...address, street: e.target.value})}
              />
              <input 
                required
                placeholder="City"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black"
                value={address.city}
                onChange={e => setAddress({...address, city: e.target.value})}
              />
              <input 
                required
                placeholder="State"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black"
                value={address.state}
                onChange={e => setAddress({...address, state: e.target.value})}
              />
              <input 
                required
                placeholder="Pincode"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black"
                value={address.pincode}
                onChange={e => setAddress({...address, pincode: e.target.value})}
              />
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">2</div>
              <h2 className="text-xl font-black uppercase tracking-widest">Payment Method</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setPaymentMethod('Online')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${paymentMethod === 'Online' ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-black'}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <CreditCard className="w-6 h-6" />
                  {paymentMethod === 'Online' && <ShieldCheck className="w-5 h-5" />}
                </div>
                <p className="font-black uppercase tracking-widest">Online Payment</p>
                <p className={`text-xs mt-1 ${paymentMethod === 'Online' ? 'text-gray-400' : 'text-gray-500'}`}>Pay via Paytm / UPI / Cards</p>
              </button>
              <button 
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${paymentMethod === 'COD' ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-black'}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <Truck className="w-6 h-6" />
                  {paymentMethod === 'COD' && <ShieldCheck className="w-5 h-5" />}
                </div>
                <p className="font-black uppercase tracking-widest">Cash on Delivery</p>
                <p className={`text-xs mt-1 ${paymentMethod === 'COD' ? 'text-gray-400' : 'text-gray-500'}`}>₹150 Advance Payment Required</p>
              </button>
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="space-y-8">
          <div className="bg-gray-50 p-8 rounded-xl space-y-6 sticky top-24">
            <h2 className="font-black uppercase tracking-widest text-lg">Order Summary</h2>
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.name} x {item.quantity}</span>
                  <span className="font-bold">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-gray-200 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-bold">₹{total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-bold text-emerald-600">{total > 2000 ? 'FREE' : '₹99'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax (5%)</span>
                <span className="font-bold">₹{Math.round(total * 0.05)}</span>
              </div>
              {paymentMethod === 'COD' && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>COD Advance</span>
                  <span>₹150</span>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-black uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black">₹{total + (total > 2000 ? 0 : 99) + Math.round(total * 0.05)}</span>
              </div>
            </div>
            <button 
              disabled={loading}
              className="w-full bg-black text-white py-5 rounded-xl font-black uppercase tracking-widest hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : paymentMethod === 'COD' ? 'Pay ₹150 & Place Order' : 'Pay & Place Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
