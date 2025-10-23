'use client';

import Link from "next/link";
import { BookOpen, Palette, TrendingUp, DollarSign, Play, Star, LayoutDashboard, DollarSign as DollarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import axios from "axios";
import { convertAndFormatPrice } from "@/lib/currency";

export default function Home() {
  const { user, loading } = useAuth();
  const [popularCourses, setPopularCourses] = useState([]);
  
  useEffect(() => {
    fetchPopularCourses();
  }, []);

  const fetchPopularCourses = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await axios.get(`${backendUrl}/api/courses`);
      setPopularCourses(response.data.slice(0, 4));
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };
  
  const categories = [
    { name: "Language", icon: BookOpen, courses: 12, color: "bg-orange-100", iconColor: "text-orange-600" },
    { name: "Graphic Design", icon: Palette, courses: 8, color: "bg-blue-100", iconColor: "text-blue-600" },
    { name: "Content Writing", icon: TrendingUp, courses: 15, color: "bg-green-100", iconColor: "text-green-600" },
    { name: "Finance", icon: DollarSign, courses: 10, color: "bg-purple-100", iconColor: "text-purple-600" },
  ];

  const testimonials = [
    {
      name: "Alex Johnson",
      role: "Marketing Student",
      avatar: "/api/placeholder/100/100",
      rating: 5,
      text: "The courses are amazing! I learned so much and the instructors are very supportive."
    },
    {
      name: "Lisa Wang",
      role: "Freelance Designer",
      avatar: "/api/placeholder/100/100",
      rating: 5,
      text: "Edubox helped me transition into graphic design. The content is top-notch!"
    },
    {
      name: "Tom Harris",
      role: "Content Writer",
      avatar: "/api/placeholder/100/100",
      rating: 5,
      text: "Best investment I made in my career. The writing courses are practical and effective."
    }
  ];

  const instructors = [
    {
      name: "Maria Rodriguez",
      title: "Language Expert",
      bio: "Passionate about teaching languages with over 10 years of experience",
      avatar: "/api/placeholder/200/200"
    },
    {
      name: "John Smith",
      title: "English Specialist",
      bio: "Cambridge certified with expertise in advanced grammar",
      avatar: "/api/placeholder/200/200"
    },
    {
      name: "Sarah Chen",
      title: "Design Director",
      bio: "Award-winning designer helping students unlock their creativity",
      avatar: "/api/placeholder/200/200"
    },
    {
      name: "David Lee",
      title: "Adobe Expert",
      bio: "Adobe Certified with mastery in creative suite applications",
      avatar: "/api/placeholder/200/200"
    }
  ];

  return (
    <div className="min-h-screen bg-[#fefdfb]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Edubox</span>
          </Link>
          <div className="flex gap-4">
            {!loading && user ? (
              <Button asChild className="bg-teal-600 hover:bg-teal-700">
                <Link href="/dashboard">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild className="bg-teal-600 hover:bg-teal-700">
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full text-sm font-medium mb-6">
              30 Days free trial
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Build Your Skills on the <span className="text-orange-500">Best</span> Platform
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Find Unlimited Courses That Match Your Niche to Hasten the Process of Developing Your Skills.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              {!loading && user ? (
                <>
                  <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 text-lg" size="lg">
                    <Link href="/dashboard">
                      <LayoutDashboard className="w-5 h-5 mr-2" />
                      Go to Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="px-8 py-6 text-lg" size="lg">
                    <Link href="/courses">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Browse Courses
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 text-lg" size="lg">
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                  <Button asChild variant="outline" className="px-8 py-6 text-lg" size="lg">
                    <Link href="/courses">
                      <Play className="w-5 h-5 mr-2" />
                      Video Play
                    </Link>
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-300" />
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-400" />
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-500" />
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-600" />
              </div>
              <span className="text-gray-600 font-medium">10,000+ Active Students</span>
            </div>
          </div>
          <div className="relative">
            <div className="w-full h-96 bg-gradient-to-br from-teal-100 to-blue-100 rounded-lg" />
            {/* Completion Rate Badge */}
            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">94%</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Student Success</p>
                  <p className="font-bold text-gray-900">Course Completion Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Categories */}
      <section className="bg-white py-16" id="courses">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Explore our Course Categories</h2>
            <p className="text-lg text-gray-600">Discover a wide range of courses tailored to your interests</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.name} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className={`${category.color} ${category.iconColor} w-16 h-16 rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                    <p className="text-gray-600">{category.courses} Courses</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Stats */}
          <div className="bg-teal-600 rounded-lg p-12 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">260K+</div>
              <div className="text-lg">Worldwide Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24+</div>
              <div className="text-lg">Years Experience</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">550+</div>
              <div className="text-lg">Professional Courses</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2M+</div>
              <div className="text-lg">Amazing Reviews</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="bg-[#fefdfb] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Popular Courses</h2>
            <p className="text-lg text-gray-600">Explore our most loved courses by students worldwide</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {popularCourses.map((course: any) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <div className="relative h-48 bg-gray-200">
                  {course.thumbnail_url && (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {course.difficulty}
                    </span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                    <span>{course.category}</span>
                    <span>•</span>
                    <span>{course.duration}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm text-gray-600">0.0 (0)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-2xl font-bold text-teal-600">{convertAndFormatPrice(course.price)}</span>
                    <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700">
                      <Link href={`/courses/${course.id}`}>View Course</Link>
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">By {course.instructor_name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button asChild variant="outline" size="lg" className="px-8">
              <Link href="/courses">View All Courses</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gradient-to-b from-blue-50 to-teal-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What People Said About Our Service</h2>
            <p className="text-lg text-gray-600">Hear from our satisfied students</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-300" />
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Instructors Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Expert Instructor Team</h2>
            <p className="text-lg text-gray-600">Learn from industry professionals</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {instructors.map((instructor, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-32 h-32 rounded-full bg-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{instructor.name}</h3>
                  <p className="text-teal-600 font-medium mb-3">{instructor.title}</p>
                  <p className="text-sm text-gray-600">{instructor.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-orange-500 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Lifetime access, anywhere, on any device</h2>
          <p className="text-xl text-white mb-8">Learning at your own speed, with lifetime access on mobile and desktop</p>
          {!loading && user ? (
            <Button asChild size="lg" className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-6 text-lg">
              <Link href="/courses">Explore Courses Now</Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-6 text-lg">
              <Link href="/auth/signup">Get Started Now</Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
