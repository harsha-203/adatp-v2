'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, PlayCircle, Download, FileText, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import { convertAndFormatPrice } from '@/lib/currency';

interface Purchase {
  id: string;
  user_id: string;
  course_id: string;
  price_paid: number;
  access_granted_at: string;
  created_at: string;
  courses?: {
    id: string;
    title: string;
    thumbnail_url: string;
    category: string;
    difficulty: string;
    instructor_name: string;
  };
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  tax: number;
  total: number;
  status: string;
  issued_at: string;
  paid_at: string;
}

export default function PurchasesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'invoices'>('courses');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api';

  useEffect(() => {
    if (user) {
      loadPurchases();
      loadInvoices();
    }
  }, [user]);

  const loadPurchases = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/purchases/${user.id}`);
      const data = await response.json();
      setPurchases(data);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${backendUrl}/invoices/${user.id}`);
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateTotalSpent = () => {
    return purchases.reduce((sum, purchase) => sum + purchase.price_paid, 0);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingBag className="w-10 h-10" />
            <h1 className="text-4xl font-bold">My Purchases</h1>
          </div>
          <p className="text-xl text-white/90">Access your purchased courses and invoices</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${calculateTotalSpent().toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Courses Purchased</p>
                <p className="text-3xl font-bold text-gray-900">{purchases.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <PlayCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Invoices</p>
                <p className="text-3xl font-bold text-gray-900">{invoices.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 font-semibold transition-colors relative ${
              activeTab === 'courses'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Purchased Courses
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 font-semibold transition-colors relative ${
              activeTab === 'invoices'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Invoices
          </button>
        </div>

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div>
            {purchases.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">No purchases yet</h3>
                <p className="text-gray-600 mb-6">Browse courses and start learning today</p>
                <Button
                  onClick={() => router.push('/courses')}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Browse Courses
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {purchases.map((purchase) => (
                  <Card
                    key={purchase.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/courses/${purchase.course_id}`)}
                  >
                    <div className="flex gap-6">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        <div className="w-40 h-24 bg-gray-200 rounded-lg overflow-hidden relative">
                          {purchase.courses?.thumbnail_url ? (
                            <Image
                              src={purchase.courses.thumbnail_url}
                              alt={purchase.courses.title || 'Course'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-100 to-cyan-100">
                              <PlayCircle className="w-10 h-10 text-teal-600" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {purchase.courses?.title || 'Course'}
                            </h3>
                            <div className="flex items-center gap-3 mb-3">
                              {purchase.courses?.instructor_name && (
                                <span className="text-sm text-gray-600">
                                  by {purchase.courses.instructor_name}
                                </span>
                              )}
                              {purchase.courses?.category && (
                                <Badge className="bg-teal-100 text-teal-800">
                                  {purchase.courses.category}
                                </Badge>
                              )}
                              {purchase.courses?.difficulty && (
                                <Badge variant="outline">
                                  {purchase.courses.difficulty}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-teal-600">
                              {convertAndFormatPrice(purchase.price_paid)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            Purchased on {formatDate(purchase.created_at)}
                          </p>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/courses/${purchase.course_id}/learn`);
                            }}
                            className="bg-teal-600 hover:bg-teal-700"
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Start Learning
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div>
            {invoices.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">No invoices yet</h3>
                <p className="text-gray-600">Your purchase invoices will appear here</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <Card key={invoice.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 flex-1">
                        {/* Icon */}
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-purple-600" />
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-2">
                            Invoice #{invoice.invoice_number}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Issued: {formatDate(invoice.issued_at)}</span>
                            {invoice.paid_at && (
                              <>
                                <span>•</span>
                                <span>Paid: {formatDate(invoice.paid_at)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Amount and Status */}
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 mb-2">
                            ${invoice.total.toFixed(2)}
                          </p>
                          <Badge
                            className={
                              invoice.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {invoice.status.toUpperCase()}
                          </Badge>
                        </div>

                        {/* Download Button */}
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Subtotal</p>
                        <p className="font-semibold text-gray-900">
                          ${invoice.amount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tax</p>
                        <p className="font-semibold text-gray-900">
                          ${invoice.tax.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total</p>
                        <p className="font-semibold text-teal-600">
                          ${invoice.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
