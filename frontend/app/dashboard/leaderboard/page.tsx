'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Trophy,
  Medal,
  Star,
  TrendingUp,
  Award,
  Crown
} from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  total_points: number;
  courses_completed: number;
  streak_days: number;
  rank: number;
  users: {
    full_name: string;
    avatar_url: string;
  };
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    loadLeaderboard();
  }, [user]);

  const loadLeaderboard = async () => {
    try {
      const response = await axios.get(`${backendUrl}/gamification/leaderboard?limit=100`);
      setLeaderboard(response.data);

      // Find current user's rank
      if (user) {
        const userEntry = response.data.find((entry: LeaderboardEntry) => entry.user_id === user.id);
        setUserRank(userEntry || null);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-600">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-gray-600">Compete with other learners and climb to the top!</p>
        </div>

        {/* User's Current Rank */}
        {userRank && (
          <Card className="mb-8 border-teal-500 bg-gradient-to-r from-teal-50 to-blue-50">
            <CardHeader>
              <CardTitle className="text-lg">Your Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadge(userRank.rank)}`}>
                    #{userRank.rank}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{userRank.users.full_name || 'You'}</p>
                    <p className="text-sm text-gray-600">Keep learning to improve your rank!</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-teal-600">{userRank.total_points}</p>
                    <p className="text-xs text-gray-600">Points</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{userRank.courses_completed}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{userRank.streak_days}</p>
                    <p className="text-xs text-gray-600">Day Streak</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* 2nd Place */}
            <Card className="transform translate-y-8">
              <CardContent className="pt-6 text-center">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <Avatar className="w-16 h-16 mx-auto mb-3 border-4 border-gray-300">
                  <AvatarImage src={leaderboard[1].users.avatar_url} />
                  <AvatarFallback>{leaderboard[1].users.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-gray-900 mb-1">{leaderboard[1].users.full_name || 'User'}</h3>
                <div className="flex items-center justify-center gap-1 text-gray-600">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold">{leaderboard[1].total_points}</span>
                </div>
              </CardContent>
            </Card>

            {/* 1st Place */}
            <Card className="border-yellow-500 shadow-xl">
              <CardContent className="pt-6 text-center">
                <Crown className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">1</span>
                </div>
                <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-yellow-500">
                  <AvatarImage src={leaderboard[0].users.avatar_url} />
                  <AvatarFallback>{leaderboard[0].users.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-gray-900 mb-1 text-lg">{leaderboard[0].users.full_name || 'User'}</h3>
                <div className="flex items-center justify-center gap-1 text-gray-600">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-lg">{leaderboard[0].total_points}</span>
                </div>
              </CardContent>
            </Card>

            {/* 3rd Place */}
            <Card className="transform translate-y-8">
              <CardContent className="pt-6 text-center">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">3</span>
                </div>
                <Avatar className="w-16 h-16 mx-auto mb-3 border-4 border-orange-400">
                  <AvatarImage src={leaderboard[2].users.avatar_url} />
                  <AvatarFallback>{leaderboard[2].users.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-gray-900 mb-1">{leaderboard[2].users.full_name || 'User'}</h3>
                <div className="flex items-center justify-center gap-1 text-gray-600">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold">{leaderboard[2].total_points}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Learners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.slice(0, 50).map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    entry.user_id === user?.id ? 'bg-teal-50 border border-teal-200' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getRankBadge(entry.rank)}`}>
                      {getRankIcon(entry.rank) || `#${entry.rank}`}
                    </div>

                    {/* User Info */}
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={entry.users.avatar_url} />
                      <AvatarFallback>{entry.users.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {entry.users.full_name || 'Anonymous User'}
                        {entry.user_id === user?.id && (
                          <span className="ml-2 text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full">You</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {entry.courses_completed} courses completed • {entry.streak_days} day streak
                      </p>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-teal-600">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="text-xl font-bold">{entry.total_points}</span>
                      </div>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {leaderboard.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No leaderboard data available yet.</p>
                <p className="text-sm text-gray-500 mt-2">Start learning to appear on the leaderboard!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Award className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How to Earn Points</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Complete lessons and courses</li>
                  <li>• Score high on quizzes</li>
                  <li>• Earn badges and achievements</li>
                  <li>• Maintain daily learning streaks</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
