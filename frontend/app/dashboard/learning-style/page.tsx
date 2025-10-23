'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Video, BookOpen, MousePointerClick, Lightbulb, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface LearningStyle {
  primary_style: string;
  confidence: number;
  preferences: {
    video_content: number;
    reading: number;
    interactive: number;
  };
  recommendations: string[];
}

const styleIcons = {
  visual: Video,
  reading: BookOpen,
  interactive: MousePointerClick,
  auditory: Video,
  kinesthetic: MousePointerClick,
};

const styleColors = {
  visual: 'bg-purple-100 text-purple-800 border-purple-200',
  reading: 'bg-blue-100 text-blue-800 border-blue-200',
  interactive: 'bg-green-100 text-green-800 border-green-200',
  auditory: 'bg-orange-100 text-orange-800 border-orange-200',
  kinesthetic: 'bg-pink-100 text-pink-800 border-pink-200',
};

export default function LearningStylePage() {
  const { user } = useAuth();
  const [learningStyle, setLearningStyle] = useState<LearningStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api';

  useEffect(() => {
    if (user) {
      loadLearningStyle();
    }
  }, [user]);

  const loadLearningStyle = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/ai/learning-style/${user.id}`);
      const data = await response.json();
      setLearningStyle(data);
    } catch (error) {
      console.error('Error loading learning style:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    setAnalyzing(true);
    await loadLearningStyle();
    setAnalyzing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/2"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!learningStyle) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <Card className="p-12 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No learning style data yet</h3>
            <p className="text-gray-600 mb-4">We need more data about your learning behavior to analyze your style</p>
            <Button onClick={() => window.location.href = '/courses'} className="bg-teal-600 hover:bg-teal-700">
              Start Learning
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const StyleIcon = styleIcons[learningStyle.primary_style as keyof typeof styleIcons] || Brain;
  const styleColor = styleColors[learningStyle.primary_style as keyof typeof styleColors] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-10 h-10" />
                <h1 className="text-4xl font-bold">Your Learning Style</h1>
              </div>
              <p className="text-xl text-white/90">Understand how you learn best and optimize your study approach</p>
            </div>
            <Button
              onClick={handleReanalyze}
              disabled={analyzing}
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30"
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
              {analyzing ? 'Analyzing...' : 'Re-analyze'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">
        {/* Primary Learning Style */}
        <Card className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <StyleIcon className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2">Primary Learning Style</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-3 capitalize">
                {learningStyle.primary_style} Learner
              </h2>
              <div className="flex items-center gap-3">
                <Badge className={styleColor}>
                  {learningStyle.confidence}% Confidence
                </Badge>
                <span className="text-sm text-gray-600">Based on your learning behavior patterns</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Learning Preferences */}
        <Card className="p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Learning Preferences Breakdown</h3>
          <div className="space-y-6">
            {/* Video Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">Video Content</span>
                </div>
                <span className="text-sm font-semibold text-purple-600">{learningStyle.preferences.video_content}%</span>
              </div>
              <Progress value={learningStyle.preferences.video_content} className="h-3" />
            </div>

            {/* Reading */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Reading & Text</span>
                </div>
                <span className="text-sm font-semibold text-blue-600">{learningStyle.preferences.reading}%</span>
              </div>
              <Progress value={learningStyle.preferences.reading} className="h-3" />
            </div>

            {/* Interactive */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-900">Interactive Activities</span>
                </div>
                <span className="text-sm font-semibold text-green-600">{learningStyle.preferences.interactive}%</span>
              </div>
              <Progress value={learningStyle.preferences.interactive} className="h-3" />
            </div>
          </div>
        </Card>

        {/* Recommendations */}
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            <h3 className="text-2xl font-bold text-gray-900">Personalized Study Recommendations</h3>
          </div>
          <div className="space-y-4">
            {learningStyle.recommendations.map((recommendation, index) => (
              <div key={index} className="flex gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-100">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <p className="text-gray-700 flex-1 leading-relaxed">{recommendation}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Tips Card */}
        <Card className="p-8 bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">💡 How to Use This Information</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Focus on courses and materials that match your learning style</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Try to incorporate your preferred learning methods when studying</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Don't be afraid to experiment with different approaches to find what works best</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Your learning style may evolve over time - check back regularly</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
