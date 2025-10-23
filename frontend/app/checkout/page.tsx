'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { convertAndFormatPrice, convertUSDToINR } from '@/lib/currency';

interface CartItem {
  id: string;
  courses: {
    id: string;
    title: string;
    price: number;
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api';

  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      router.push('/auth/signin');
    }
  }, [user]);

  const loadCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/cart/${user.id}`);
      const data = await response.json();
      
      if (data.length === 0) {
        router.push('/cart');
        return;
      }
      
      setCartItems(data);
    } catch (error) {
      console.error('Error loading cart:', error);
      setError('Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.courses.price, 0);
    const tax = subtotal * 0.1;
    return {
      subtotal,
      tax,
      total: subtotal + tax,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setProcessing(true);
    setError(null);

    try {
      // Step 1: Create payment intent
      const courseIds = cartItems.map(item => item.courses.id);
      const intentResponse = await fetch(`${backendUrl}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          course_ids: courseIds,
        }),
      });

      if (!intentResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      const intentData = await intentResponse.json();

      // Step 2: Simulate payment processing (in production, use Stripe.js)
      // For now, we'll just confirm the payment immediately
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

      // Step 3: Confirm payment
      const confirmResponse = await fetch(`${backendUrl}/payments/confirm?payment_intent_id=${intentData.payment_intent_id || 'mock_payment'}`, {
        method: 'POST',
      });

      if (!confirmResponse.ok) {
        throw new Error('Payment confirmation failed');
      }

      setSuccess(true);

      // Redirect to purchases page after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/purchases');
      }, 2000);

    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // 16 digits + 3 spaces
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your courses have been unlocked. Redirecting to your purchases...
          </p>
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-teal-600" />
        </Card>
      </div>
    );
  }

  const { subtotal, tax, total } = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Secure Checkout</h1>
          </div>
          <p className="text-xl text-white/90">Complete your purchase securely</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="md:col-span-2">
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Information</h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Card Number */}
                <div>
                  <Label htmlFor="cardNumber" className="text-sm font-semibold text-gray-700">
                    Card Number
                  </Label>
                  <div className="mt-2 relative">
                    <Input
                      id="cardNumber"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      required
                      maxLength={19}
                      className="pl-12"
                    />
                    <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Cardholder Name */}
                <div>
                  <Label htmlFor="cardName" className="text-sm font-semibold text-gray-700">
                    Cardholder Name
                  </Label>
                  <Input
                    id="cardName"
                    type="text"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                {/* Expiry Date and CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate" className="text-sm font-semibold text-gray-700">
                      Expiry Date
                    </Label>
                    <Input
                      id="expiryDate"
                      type="text"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                      required
                      maxLength={5}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv" className="text-sm font-semibold text-gray-700">
                      CVV
                    </Label>
                    <Input
                      id="cvv"
                      type="text"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      required
                      maxLength={4}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Security Note */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Your payment is secure</p>
                      <p>All transactions are encrypted and secured by industry-standard protocols.</p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-lg py-6"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Pay ${total.toFixed(2)}
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <Card className="p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between">
                    <p className="text-sm text-gray-700 flex-1 pr-2">{item.courses.title}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {convertAndFormatPrice(item.courses.price)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{convertUSDToINR(subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Tax (18% GST)</span>
                  <span className="font-semibold">₹{convertUSDToINR(tax).toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-teal-600">
                      ₹{convertUSDToINR(total).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
