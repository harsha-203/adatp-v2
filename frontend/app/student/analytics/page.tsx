'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { BookOpen, Clock, Award, TrendingUp, Target, Zap, Trophy } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export default function StudentAnalyticsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [summaryRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/student/dashboard/summary?user_id=${user?.id}`),
        axios.get(`${API}/student/analytics?user_id=${user?.id}`)
      ]);
      setSummary(summaryRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Analytics</h1>
        <p className="text-gray-600">Track your learning progress and achievements</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{summary?.total_courses || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Study Hours</p>
                <p className="text-2xl font-bold text-gray-900">{summary?.total_study_hours || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Certificates</p>
                <p className="text-2xl font-bold text-gray-900">{summary?.certificates_earned || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{summary?.current_streak || 0} days</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Enrollment Trend */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Enrollment Trend</h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {analytics?.enrollment_trend?.map((item: any, index: number) => {
                const maxVal = Math.max(...analytics.enrollment_trend.map((i: any) => i.enrollments));
                const height = (item.enrollments / maxVal) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="flex-1 flex items-end w-full">
                      <div
                        className="w-full bg-teal-600 rounded-t transition-all hover:bg-teal-700"
                        style={{ height: `${height}%` }}
                        title={`${item.enrollments} enrollments`}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{item.month}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Course Categories</h3>
            <div className="space-y-3">
              {analytics?.category_distribution?.map((item: any, index: number) => {
                const total = analytics.category_distribution.reduce((sum: number, i: any) => sum + i.value, 0);
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                const colors = ['bg-blue-600', 'bg-green-600', 'bg-orange-600', 'bg-purple-600', 'bg-pink-600'];
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="font-medium">{item.value} courses</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colors[index % colors.length]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Distribution */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Learning Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {analytics?.activity_distribution?.map((item: any, index: number) => {
              const icons = [BookOpen, Target, Trophy];
              const colors = ['bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-orange-100 text-orange-600'];
              const Icon = icons[index % icons.length];
              return (
                <div key={index} className="text-center">
                  <div className={`w-16 h-16 ${colors[index % colors.length]} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{item.count}</p>
                  <p className="text-sm text-gray-600">{item.type}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
