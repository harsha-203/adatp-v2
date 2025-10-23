'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Home, GraduationCap, BarChart3, Award, Settings, LogOut, Trophy, Star, Sparkles, Brain, Video, ShoppingCart, CreditCard, Package, MessageSquare, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Courses', href: '/dashboard/my-courses', icon: GraduationCap },
  { name: 'Browse Courses', href: '/courses', icon: BookOpen },
  { name: 'Forums', href: '/forums', icon: MessageSquare },
  { name: 'Progress', href: '/dashboard/progress', icon: BarChart3 },
  { name: 'Achievements', href: '/dashboard/achievements', icon: Star },
  { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
  { name: 'Certificates', href: '/dashboard/certificates', icon: Award },
  { name: 'AI Learning', href: '/dashboard/ai-recommendations', icon: Brain },
  { name: 'Live Sessions', href: '/live-sessions', icon: Video },
  { name: 'Cart & Purchases', href: '/cart', icon: ShoppingCart },
  { name: 'Payment History', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col h-full bg-white border-r">
      <div className="p-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Edubox</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:bg-gray-50"
          onClick={() => signOut()}
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
