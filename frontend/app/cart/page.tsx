'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Trash2, CreditCard, ArrowRight, PackageX, Package } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import { convertAndFormatPrice, convertUSDToINR } from '@/lib/currency';

interface CartItem {
  id: string;
  user_id: string;
  course_id: string;
  added_at: string;
  courses: {
    id: string;
    title: string;
    price: number;
    thumbnail_url: string;
    category: string;
    difficulty: string;
    instructor_name: string;
  };
}

interface Purchase {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  status: string;
  created_at: string;
  courses: {
    id: string;
    title: string;
    thumbnail_url: string;
    category: string;
    difficulty: string;
    instructor_name: string;
  };
}

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('cart');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api';

  useEffect(() => {
    if (user) {
      loadCart();
      loadPurchases();
    } else {
      router.push('/auth/signin');
    }
  }, [user]);

  const loadPurchases = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${backendUrl}/purchases/${user.id}`);
      const data = await response.json();
      setPurchases(data);
    } catch (error) {
      console.error('Error loading purchases:', error);
    }
  };

  const loadCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/cart/${user.id}`);
      const data = await response.json();
      setCartItems(data);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (courseId: string) => {
    if (!user) return;

    try {
      setRemoving(courseId);
      await fetch(`${backendUrl}/cart/remove?user_id=${user.id}&course_id=${courseId}`, {
        method: 'DELETE',
      });
      
      // Update local state
      setCartItems(cartItems.filter(item => item.course_id !== courseId));
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item from cart');
    } finally {
      setRemoving(null);
    }
  };

  const clearCart = async () => {
    if (!user || !confirm('Are you sure you want to clear your cart?')) return;

    try {
      await fetch(`${backendUrl}/cart/${user.id}/clear`, {
        method: 'DELETE',
      });
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert('Failed to clear cart');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.courses.price, 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Cart & Purchases</h1>
          </div>
          <p className="text-xl text-white/90">
            Manage your shopping cart and view purchase history
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="cart" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Shopping Cart ({cartItems.length})
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              My Purchases ({purchases.length})
            </TabsTrigger>
          </TabsList>

          {/* Shopping Cart Tab */}
          <TabsContent value="cart">
            {cartItems.length === 0 ? (
              <Card className="p-12 text-center">
                <PackageX className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-6">Add courses to your cart to get started</p>
                <Button
                  onClick={() => router.push('/courses')}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Browse Courses
                </Button>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
                    </h2>
                    {cartItems.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-700"
                      >
                        Clear Cart
                      </Button>
                    )}
                  </div>

                  {cartItems.map((item) => (
                    <Card key={item.id} className="p-6 hover:shadow-md transition-shadow">
                      <div className="flex gap-6">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden relative">
                            {item.courses.thumbnail_url ? (
                              <Image
                                src={item.courses.thumbnail_url}
                                alt={item.courses.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-100 to-cyan-100">
                                <ShoppingCart className="w-8 h-8 text-teal-600" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {item.courses.title}
                          </h3>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-sm text-gray-600">
                              by {item.courses.instructor_name}
                            </span>
                            <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded">
                              {item.courses.category}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {item.courses.difficulty}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-teal-600">
                              {convertAndFormatPrice(item.courses.price)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.course_id)}
                              disabled={removing === item.course_id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {removing === item.course_id ? 'Removing...' : 'Remove'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <Card className="p-6 sticky top-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span className="font-semibold">₹{convertUSDToINR(total).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Tax (18% GST)</span>
                        <span className="font-semibold">₹{convertUSDToINR(total * 0.18).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-900">Total</span>
                          <span className="text-2xl font-bold text-teal-600">
                            ₹{convertUSDToINR(total * 1.18).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-lg py-6"
                      disabled={cartItems.length === 0}
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>

                    <div className="mt-6 p-4 bg-teal-50 rounded-lg">
                      <p className="text-sm text-teal-800">
                        <strong>✓ Lifetime Access</strong> - Purchase once, access forever
                      </p>
                      <p className="text-sm text-teal-800 mt-2">
                        <strong>✓ Certificate</strong> - Get certified upon completion
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases">
            {purchases.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">No purchases yet</h3>
                <p className="text-gray-600 mb-6">Your purchased courses will appear here</p>
                <Button
                  onClick={() => router.push('/courses')}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Browse Courses
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {purchases.length} {purchases.length === 1 ? 'Purchase' : 'Purchases'}
                </h2>
                {purchases.map((purchase) => (
                  <Card key={purchase.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex gap-6">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden relative">
                          {purchase.courses.thumbnail_url ? (
                            <Image
                              src={purchase.courses.thumbnail_url}
                              alt={purchase.courses.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-100 to-cyan-100">
                              <Package className="w-8 h-8 text-teal-600" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {purchase.courses.title}
                        </h3>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm text-gray-600">
                            by {purchase.courses.instructor_name}
                          </span>
                          <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded">
                            {purchase.courses.category}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            purchase.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {purchase.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-teal-600">
                              {convertAndFormatPrice(purchase.amount)}
                            </span>
                            <p className="text-sm text-gray-500 mt-1">
                              Purchased on {new Date(purchase.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            onClick={() => router.push(`/courses/${purchase.course_id}/learn`)}
                            className="bg-teal-600 hover:bg-teal-700"
                          >
                            Continue Learning
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
