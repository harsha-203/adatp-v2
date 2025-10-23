'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Award,
  Trophy,
  Star,
  Lock,
  CheckCircle,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  badge_type: string;
  points: number;
  created_at: string;
}

interface UserBadge {
  id: string;
  badge_id: string;
  achieved_at: string;
  badges: Badge;
}

interface GamificationStats {
  total_points: number;
  courses_completed: number;
  streak_days: number;
  rank: number | null;
  badges_earned: number;
  total_badges: number;
}

export default function GamificationPage() {
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (user) {
      loadGamificationData();
    }
  }, [user]);

  const loadGamificationData = async () => {
    try {
      // Load all badges
      const badgesResponse = await axios.get(`${backendUrl}/gamification/badges`);
      setAllBadges(badgesResponse.data);

      // Load user's badges
      const userBadgesResponse = await axios.get(`${backendUrl}/gamification/user-badges/${user?.id}`);
      setUserBadges(userBadgesResponse.data);

      // Load user stats
      const statsResponse = await axios.get(`${backendUrl}/gamification/user-stats/${user?.id}`);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasBadge = (badgeId: string) => {
    return userBadges.some(ub => ub.badges.id === badgeId);
  };

  const getBadgeDate = (badgeId: string) => {
    const userBadge = userBadges.find(ub => ub.badges.id === badgeId);
    return userBadge ? new Date(userBadge.achieved_at).toLocaleDateString() : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-600">Loading achievements...</div>
      </div>
    );
  }

  const badgeProgress = stats ? (stats.badges_earned / stats.total_badges) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Achievements & Badges</h1>
          <p className="text-gray-600">Track your progress and unlock achievements</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Points</p>
                  <p className="text-3xl font-bold text-teal-600">{stats?.total_points || 0}</p>
                </div>
                <Star className="w-10 h-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Badges Earned</p>
                  <p className="text-3xl font-bold text-purple-600">{stats?.badges_earned || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">of {stats?.total_badges || 0}</p>
                </div>
                <Award className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Streak</p>
                  <p className="text-3xl font-bold text-orange-600">{stats?.streak_days || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">days</p>
                </div>
                <TrendingUp className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Leaderboard Rank</p>
                  <p className="text-3xl font-bold text-teal-600">
                    #{stats?.rank || '-'}
                  </p>
                </div>
                <Trophy className="w-10 h-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Badge Collection Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {stats?.badges_earned || 0} of {stats?.total_badges || 0} badges earned
                </span>
                <span className="font-medium text-teal-600">
                  {badgeProgress.toFixed(0)}%
                </span>
              </div>
              <Progress value={badgeProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Badge Categories */}
        {['achievement', 'course_completion', 'streak', 'milestone'].map(category => {
          const categoryBadges = allBadges.filter(b => b.badge_type === category);
          if (categoryBadges.length === 0) return null;

          return (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 capitalize flex items-center gap-2">
                {category === 'achievement' && <Star className="w-6 h-6 text-yellow-500" />}
                {category === 'course_completion' && <Award className="w-6 h-6 text-purple-600" />}
                {category === 'streak' && <TrendingUp className="w-6 h-6 text-orange-600" />}
                {category === 'milestone' && <Trophy className="w-6 h-6 text-teal-600" />}
                {category.replace('_', ' ')} Badges
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categoryBadges.map((badge) => {
                  const earned = hasBadge(badge.id);
                  const earnedDate = getBadgeDate(badge.id);

                  return (
                    <Card 
                      key={badge.id} 
                      className={`relative overflow-hidden transition-all ${
                        earned ? 'border-teal-500 shadow-lg' : 'opacity-60'
                      }`}
                    >
                      {earned && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                      )}
                      
                      <CardContent className="pt-6 text-center">
                        <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                          earned ? 'bg-gradient-to-br from-teal-400 to-teal-600' : 'bg-gray-200'
                        }`}>
                          {earned ? (
                            <img 
                              src={badge.icon_url} 
                              alt={badge.name}
                              className="w-16 h-16"
                            />
                          ) : (
                            <Lock className="w-12 h-12 text-gray-400" />
                          )}
                        </div>

                        <h3 className="font-bold text-gray-900 mb-2">{badge.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{badge.description}</p>

                        <div className="flex items-center justify-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium text-gray-900">{badge.points} points</span>
                        </div>

                        {earned && earnedDate && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>Earned {earnedDate}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Motivation Card */}
        <Card className="bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Trophy className="w-12 h-12 text-teal-600" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Keep Learning!</h3>
                <p className="text-sm text-gray-700">
                  Complete more courses and quizzes to unlock new badges and climb the leaderboard! 🚀
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
