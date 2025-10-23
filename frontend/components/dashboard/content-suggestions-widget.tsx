'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ExternalLink, Video, FileText, MousePointerClick } from 'lucide-react';

interface ContentSuggestion {
  title: string;
  type: 'article' | 'video' | 'interactive' | 'tutorial';
  description: string;
  url: string;
  relevance_score: number;
}

interface ContentSuggestionsWidgetProps {
  userId: string;
}

const typeIcons = {
  article: FileText,
  video: Video,
  interactive: MousePointerClick,
  tutorial: FileText,
};

const typeColors = {
  article: 'bg-blue-100 text-blue-800',
  video: 'bg-purple-100 text-purple-800',
  interactive: 'bg-green-100 text-green-800',
  tutorial: 'bg-orange-100 text-orange-800',
};

export default function ContentSuggestionsWidget({ userId }: ContentSuggestionsWidgetProps) {
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001/api';

  useEffect(() => {
    if (userId) {
      loadSuggestions();
    }
  }, [userId]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/ai/content-suggestions/${userId}`);
      const data = await response.json();
      setSuggestions(data.slice(0, 3)); // Show top 3 suggestions
    } catch (error) {
      console.error('Error loading content suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-bold text-gray-900">AI Content Suggestions</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Personalized resources based on your learning activity
      </p>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const TypeIcon = typeIcons[suggestion.type];
          const typeColor = typeColors[suggestion.type];
          
          return (
            <a
              key={index}
              href={suggestion.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-teal-50 hover:to-cyan-50 border border-gray-200 hover:border-teal-300 rounded-lg transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <TypeIcon className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-teal-700 transition-colors">
                      {suggestion.title}
                    </h4>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-teal-600 flex-shrink-0" />
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className={`${typeColor} text-xs`}>
                      {suggestion.type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {suggestion.relevance_score}% match
                    </span>
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </Card>
  );
}
