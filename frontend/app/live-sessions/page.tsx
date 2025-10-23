'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Clock, Users, Play, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface LiveSession {
  id: string;
  title: string;
  description: string;
  scheduled_start: string;
  scheduled_end: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  platform: string;
  meeting_url?: string;
  max_participants: number;
  attendees_count?: number;
  courses?: {
    title: string;
  };
  users?: {
    full_name: string;
  };
}

export default function LiveSessionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live'>('upcoming');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api';

  useEffect(() => {
    loadSessions();
  }, [filter]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      let url = `${backendUrl}/live-sessions`;
      
      if (filter === 'upcoming') {
        url = `${backendUrl}/live-sessions/upcoming`;
      } else if (filter === 'live') {
        url = `${backendUrl}/live-sessions?status=live`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800', text: 'Scheduled' },
      live: { color: 'bg-red-100 text-red-800 animate-pulse', text: '🔴 Live Now' },
      ended: { color: 'bg-gray-100 text-gray-800', text: 'Ended' },
      cancelled: { color: 'bg-gray-100 text-gray-600', text: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
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
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <Video className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Live Sessions</h1>
          </div>
          <p className="text-xl text-white/90">Join live classes and interact with instructors in real-time</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setFilter('upcoming')}
            className={filter === 'upcoming' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            Upcoming
          </Button>
          <Button
            variant={filter === 'live' ? 'default' : 'outline'}
            onClick={() => setFilter('live')}
            className={filter === 'live' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            Live Now
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            All Sessions
          </Button>
        </div>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <Card className="p-12 text-center">
            <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No sessions found</h3>
            <p className="text-gray-600">Check back later for upcoming live sessions</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card 
                key={session.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/live-sessions/${session.id}`)}
              >
                <div className="flex gap-6">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                      {session.status === 'live' ? (
                        <Play className="w-8 h-8 text-red-600" />
                      ) : (
                        <Video className="w-8 h-8 text-purple-600" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(session.status)}
                          {session.courses && (
                            <Badge variant="outline">{session.courses.title}</Badge>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {session.title}
                        </h3>
                        <p className="text-gray-600 mb-3">
                          {session.description}
                        </p>
                      </div>
                    </div>

                    {/* Meta Information */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateTime(session.scheduled_start)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {Math.round(
                            (new Date(session.scheduled_end).getTime() - 
                             new Date(session.scheduled_start).getTime()) / 60000
                          )} minutes
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>
                          {session.attendees_count || 0} / {session.max_participants} attendees
                        </span>
                      </div>
                      {session.users && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium">Instructor: {session.users.full_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-4">
                      {session.status === 'live' && (
                        <Button className="bg-red-600 hover:bg-red-700">
                          <Play className="w-4 h-4 mr-2" />
                          Join Live Session
                        </Button>
                      )}
                      {session.status === 'scheduled' && (
                        <Button className="bg-purple-600 hover:bg-purple-700">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Register
                        </Button>
                      )}
                      {session.status === 'ended' && (
                        <Button variant="outline">
                          View Recording
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
