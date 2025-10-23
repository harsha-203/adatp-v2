'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PlayCircle, FileText, Code } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

interface Tutorial {
  id: string;
  title: string;
  type: string;
  duration: string;
  difficulty: string;
  category: string;
  instructor: string;
  thumbnail: string;
}

const categories = ['All', 'Language', 'Graphic Design', 'Content Writing', 'Finance', 'Technology', 'Business'];

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [filteredTutorials, setFilteredTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadTutorials();
  }, []);

  useEffect(() => {
    filterTutorials();
  }, [tutorials, searchTerm, selectedCategory]);

  const loadTutorials = async () => {
    try {
      const response = await axios.get(`${API}/tutorials`);
      setTutorials(response.data);
    } catch (error) {
      console.error('Error loading tutorials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTutorials = () => {
    let filtered = tutorials;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTutorials(filtered);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Video': return <PlayCircle className="w-5 h-5" />;
      case 'Article': return <FileText className="w-5 h-5" />;
      case 'Interactive': return <Code className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tutorials</h1>
          <p className="text-gray-600">Learn new skills with our comprehensive tutorials</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search tutorials..."
              className="pl-12 py-6 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Tutorials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.map((tutorial) => (
            <Card key={tutorial.id} className="hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-gradient-to-br from-teal-100 to-blue-100 rounded-t-lg">
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="bg-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    {getTypeIcon(tutorial.type)}
                    {tutorial.type}
                  </span>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{tutorial.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">{tutorial.category}</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{tutorial.difficulty}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">By {tutorial.instructor}</p>
                <p className="text-sm text-gray-500 mb-4">{tutorial.duration}</p>
                <Button className="w-full bg-teal-600 hover:bg-teal-700">
                  Start Tutorial
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTutorials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No tutorials found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
