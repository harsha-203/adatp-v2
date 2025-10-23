'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/protected-route';
import DashboardSidebar from '@/components/dashboard/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 flex-shrink-0">
          <DashboardSidebar />
        </aside>
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
