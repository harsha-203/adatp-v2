from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from supabase import create_client, Client
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle
import tempfile

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase client
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= MODELS =============
class CourseCreate(BaseModel):
    title: str
    description: str
    category: str
    difficulty: str
    duration: str
    price: float
    instructor_name: str
    instructor_bio: Optional[str] = ""
    thumbnail_url: Optional[str] = ""

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    duration: Optional[str] = None
    price: Optional[float] = None
    instructor_name: Optional[str] = None
    instructor_bio: Optional[str] = None
    thumbnail_url: Optional[str] = None

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    institution: Optional[str] = None
    about: Optional[str] = None
    interests: Optional[List[str]] = None
    avatar_url: Optional[str] = None

class QuizAttempt(BaseModel):
    quiz_id: str
    user_id: str
    answers: dict
    score: Optional[int] = None

class BookmarkCreate(BaseModel):
    user_id: str
    lesson_id: str
    note: Optional[str] = None

class LearningPathRequest(BaseModel):
    user_id: str
    goal: str

# ============= ROOT ENDPOINTS =============
@api_router.get("/")
async def root():
    return {
        "message": "Edubox LMS Backend API", 
        "status": "running",
        "version": "2.0",
        "features": ["admin", "student", "courses", "quizzes", "tutorials", "analytics"]
    }

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "edubox-backend",
        "supabase_connected": supabase is not None
    }


# ============= COURSE ENDPOINTS =============

@api_router.get("/courses")
async def get_all_courses(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all courses with optional filtering"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Build query
        query = supabase.table('courses').select('*')
        
        # Apply filters
        if category and category != 'All':
            query = query.eq('category', category)
        if difficulty and difficulty != 'All':
            query = query.eq('difficulty', difficulty)
        if search:
            query = query.ilike('title', f'%{search}%')
        
        # Execute query
        result = query.order('created_at', desc=True).execute()
        
        return result.data if result.data else []
    except Exception as e:
        logger.error(f"Error fetching courses: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= ADMIN ENDPOINTS =============

@api_router.get("/admin/dashboard/metrics")
async def get_admin_metrics():
    """Get admin dashboard metrics"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Get total users
        users_response = supabase.table('users').select('id', count='exact').execute()
        total_users = len(users_response.data) if users_response.data else 0
        
        # Get total courses
        courses_response = supabase.table('courses').select('id', count='exact').execute()
        total_courses = len(courses_response.data) if courses_response.data else 0
        
        # Get total enrollments
        enrollments_response = supabase.table('enrollments').select('id', count='exact').execute()
        total_enrollments = len(enrollments_response.data) if enrollments_response.data else 0
        
        # Get active students (students with recent activity)
        active_students = supabase.table('enrollments').select('user_id').execute()
        active_count = len(set([e['user_id'] for e in active_students.data])) if active_students.data else 0
        
        return {
            "total_users": total_users,
            "total_courses": total_courses,
            "total_enrollments": total_enrollments,
            "active_students": active_count,
            "revenue": 0,  # Placeholder
            "avg_completion_rate": 65  # Placeholder
        }
    except Exception as e:
        logger.error(f"Error fetching admin metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/courses/management")
async def get_courses_for_management():
    """Get all courses with enrollment counts for admin management"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        courses = supabase.table('courses').select('*').order('created_at', desc=True).execute()
        
        # Add enrollment count to each course
        result = []
        for course in courses.data:
            enrollments = supabase.table('enrollments').select('id', count='exact').eq('course_id', course['id']).execute()
            course['enrollments'] = len(enrollments.data) if enrollments.data else 0
            result.append(course)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching courses for management: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/courses")
async def create_course(course: CourseCreate):
    """Create a new course"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        course_data = {
            **course.dict(),
            "average_rating": 0.0,
            "review_count": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table('courses').insert(course_data).execute()
        return result.data[0]
    except Exception as e:
        logger.error(f"Error creating course: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/admin/courses/{course_id}")
async def update_course(course_id: str, course: CourseUpdate):
    """Update an existing course"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        update_data = {k: v for k, v in course.dict().items() if v is not None}
        update_data['updated_at'] = datetime.utcnow().isoformat()
        
        result = supabase.table('courses').update(update_data).eq('id', course_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Course not found")
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating course: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/courses/{course_id}")
async def delete_course(course_id: str):
    """Delete a course"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Delete course
        result = supabase.table('courses').delete().eq('id', course_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Course not found")
        
        return {"message": "Course deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting course: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/users")
async def get_all_users():
    """Get all users"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        users = supabase.table('users').select('*').order('created_at', desc=True).execute()
        return users.data
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str):
    """Delete a user"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        result = supabase.table('users').delete().eq('id', user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= STUDENT ENDPOINTS =============

@api_router.get("/student/dashboard/summary")
async def get_student_summary(user_id: str):
    """Get student dashboard summary"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Get enrollments
        enrollments = supabase.table('enrollments').select('*').eq('user_id', user_id).execute()
        
        total_courses = len(enrollments.data) if enrollments.data else 0
        completed = len([e for e in enrollments.data if e.get('completed_at')]) if enrollments.data else 0
        in_progress = len([e for e in enrollments.data if not e.get('completed_at') and e.get('progress_percentage', 0) > 0]) if enrollments.data else 0
        certificates = len([e for e in enrollments.data if e.get('certificate_issued')]) if enrollments.data else 0
        
        # Calculate total study time (placeholder)
        total_hours = total_courses * 5
        
        return {
            "total_courses": total_courses,
            "completed_courses": completed,
            "in_progress": in_progress,
            "certificates_earned": certificates,
            "total_study_hours": total_hours,
            "current_streak": 7,  # Placeholder
            "points_earned": total_courses * 100  # Placeholder
        }
    except Exception as e:
        logger.error(f"Error fetching student summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/student/analytics")
async def get_student_analytics(user_id: str):
    """Get student analytics data"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Get enrollments with course details
        enrollments = supabase.table('enrollments').select('*, courses(*)').eq('user_id', user_id).execute()
        
        # Category distribution
        categories = {}
        for e in enrollments.data:
            if e.get('courses'):
                cat = e['courses'].get('category', 'Other')
                categories[cat] = categories.get(cat, 0) + 1
        
        # Enrollment trend (mock data - group by month)
        trend = [
            {"month": "Jan", "enrollments": 2},
            {"month": "Feb", "enrollments": 3},
            {"month": "Mar", "enrollments": 5},
            {"month": "Apr", "enrollments": 4},
            {"month": "May", "enrollments": 6}
        ]
        
        return {
            "enrollment_trend": trend,
            "category_distribution": [{"name": k, "value": v} for k, v in categories.items()],
            "activity_distribution": [
                {"type": "Video Lessons", "count": 45},
                {"type": "Quizzes", "count": 12},
                {"type": "Assignments", "count": 8}
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching student analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= TUTORIAL ENDPOINTS =============

@api_router.get("/tutorials")
async def get_tutorials(category: Optional[str] = None, search: Optional[str] = None):
    """Get all tutorials with optional filters"""
    try:
        # Mock tutorial data - in production, this would come from database
        tutorials = [
            {
                "id": "1",
                "title": "Introduction to Python",
                "type": "Video",
                "duration": "45 min",
                "difficulty": "Beginner",
                "category": "Language",
                "instructor": "John Doe",
                "thumbnail": ""
            },
            {
                "id": "2",
                "title": "Advanced JavaScript Patterns",
                "type": "Article",
                "duration": "30 min",
                "difficulty": "Advanced",
                "category": "Language",
                "instructor": "Jane Smith",
                "thumbnail": ""
            },
            {
                "id": "3",
                "title": "UI/UX Design Fundamentals",
                "type": "Interactive",
                "duration": "60 min",
                "difficulty": "Intermediate",
                "category": "Graphic Design",
                "instructor": "Mike Johnson",
                "thumbnail": ""
            },
            {
                "id": "4",
                "title": "Content Writing for Beginners",
                "type": "Video",
                "duration": "35 min",
                "difficulty": "Beginner",
                "category": "Content Writing",
                "instructor": "Sarah Lee",
                "thumbnail": ""
            },
            {
                "id": "5",
                "title": "Financial Planning 101",
                "type": "Video",
                "duration": "50 min",
                "difficulty": "Beginner",
                "category": "Finance",
                "instructor": "David Brown",
                "thumbnail": ""
            }
        ]
        
        # Filter by category
        if category and category != "All":
            tutorials = [t for t in tutorials if t['category'] == category]
        
        # Filter by search
        if search:
            tutorials = [t for t in tutorials if search.lower() in t['title'].lower()]
        
        return tutorials
    except Exception as e:
        logger.error(f"Error fetching tutorials: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= QUIZ ENDPOINTS =============

@api_router.get("/quizzes/by-course")
async def get_quizzes_by_course(course_id: Optional[str] = None):
    """Get quizzes, optionally filtered by course"""
    try:
        # Mock quiz data
        quizzes = [
            {
                "id": "1",
                "title": "Python Basics Quiz",
                "course_id": "course1",
                "course_name": "Introduction to Python",
                "questions_count": 10,
                "passing_score": 70,
                "duration": "20 min",
                "attempts": []
            },
            {
                "id": "2",
                "title": "JavaScript Advanced Concepts",
                "course_id": "course2",
                "course_name": "Advanced JavaScript",
                "questions_count": 15,
                "passing_score": 75,
                "duration": "30 min",
                "attempts": []
            },
            {
                "id": "3",
                "title": "Design Principles Test",
                "course_id": "course3",
                "course_name": "UI/UX Design",
                "questions_count": 12,
                "passing_score": 70,
                "duration": "25 min",
                "attempts": []
            }
        ]
        
        if course_id:
            quizzes = [q for q in quizzes if q['course_id'] == course_id]
        
        return quizzes
    except Exception as e:
        logger.error(f"Error fetching quizzes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/quizzes/{quiz_id}")
async def get_quiz_details(quiz_id: str):
    """Get quiz details with questions"""
    try:
        # Mock quiz with questions
        quiz = {
            "id": quiz_id,
            "title": "Python Basics Quiz",
            "description": "Test your knowledge of Python fundamentals",
            "duration": "20 min",
            "passing_score": 70,
            "questions": [
                {
                    "id": "q1",
                    "question": "What is Python?",
                    "options": [
                        "A programming language",
                        "A snake",
                        "A framework",
                        "A database"
                    ],
                    "correct_answer": 0
                },
                {
                    "id": "q2",
                    "question": "Which of these is a Python data type?",
                    "options": [
                        "List",
                        "Array",
                        "Hash",
                        "Collection"
                    ],
                    "correct_answer": 0
                }
            ]
        }
        return quiz
    except Exception as e:
        logger.error(f"Error fetching quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/quizzes/{quiz_id}/attempt")
async def submit_quiz_attempt(quiz_id: str, attempt: QuizAttempt):
    """Submit a quiz attempt"""
    try:
        # Calculate score (mock implementation)
        total_questions = len(attempt.answers)
        correct_answers = 0
        
        # In production, compare with correct answers from database
        score = int((correct_answers / total_questions) * 100) if total_questions > 0 else 0
        
        return {
            "quiz_id": quiz_id,
            "score": score,
            "percentage": score,
            "passed": score >= 70,
            "total_questions": total_questions,
            "correct_answers": correct_answers,
            "submitted_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error submitting quiz attempt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= USER PROFILE ENDPOINTS =============

@api_router.patch("/users/{user_id}/profile")
async def update_user_profile(user_id: str, profile: ProfileUpdate):
    """Update user profile"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        update_data = {k: v for k, v in profile.dict().items() if v is not None}
        update_data['updated_at'] = datetime.utcnow().isoformat()
        
        result = supabase.table('users').update(update_data).eq('id', user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str):
    """Get user profile"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        result = supabase.table('users').select('*').eq('id', user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= BOOKMARK ENDPOINTS =============

@api_router.post("/bookmarks")
async def create_bookmark(bookmark: BookmarkCreate):
    """Create a bookmark for a lesson"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        bookmark_data = {
            "user_id": bookmark.user_id,
            "lesson_id": bookmark.lesson_id,
            "note": bookmark.note,
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table('bookmarks').insert(bookmark_data).execute()
        return result.data[0]
    except Exception as e:
        logger.error(f"Error creating bookmark: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/bookmarks/{user_id}")
async def get_user_bookmarks(user_id: str):
    """Get all bookmarks for a user"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        result = supabase.table('bookmarks').select('*, lessons(*)').eq('user_id', user_id).order('created_at', desc=True).execute()
        return result.data
    except Exception as e:
        logger.error(f"Error fetching bookmarks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/bookmarks/{bookmark_id}")
async def delete_bookmark(bookmark_id: str):
    """Delete a bookmark"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        result = supabase.table('bookmarks').delete().eq('id', bookmark_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Bookmark not found")
        
        return {"message": "Bookmark deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting bookmark: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= GAMIFICATION ENDPOINTS =============

@api_router.get("/gamification/badges")
async def get_all_badges():
    """Get all available badges"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        result = supabase.table('badges').select('*').order('points', desc=False).execute()
        return result.data
    except Exception as e:
        logger.error(f"Error fetching badges: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gamification/user-badges/{user_id}")
async def get_user_badges(user_id: str):
    """Get badges earned by a user"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        result = supabase.table('user_badges').select('*, badges(*)').eq('user_id', user_id).order('achieved_at', desc=True).execute()
        return result.data
    except Exception as e:
        logger.error(f"Error fetching user badges: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/gamification/award-badge")
async def award_badge(user_id: str, badge_id: str):
    """Award a badge to a user"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Check if user already has this badge
        existing = supabase.table('user_badges').select('id').eq('user_id', user_id).eq('badge_id', badge_id).execute()
        
        if existing.data:
            return {"message": "User already has this badge", "awarded": False}
        
        # Award the badge
        badge_data = {
            "user_id": user_id,
            "badge_id": badge_id,
            "achieved_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table('user_badges').insert(badge_data).execute()
        
        # Get badge points and update leaderboard
        badge_info = supabase.table('badges').select('points').eq('id', badge_id).execute()
        if badge_info.data:
            points = badge_info.data[0]['points']
            await update_leaderboard_points(user_id, points)
        
        return {"message": "Badge awarded successfully", "awarded": True, "data": result.data[0]}
    except Exception as e:
        logger.error(f"Error awarding badge: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gamification/leaderboard")
async def get_leaderboard(limit: int = 50):
    """Get leaderboard rankings"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        result = supabase.table('leaderboard').select('*, users(full_name, avatar_url)').order('total_points', desc=True).limit(limit).execute()
        
        # Add rank if not present
        leaderboard_data = result.data
        for idx, entry in enumerate(leaderboard_data, 1):
            entry['rank'] = idx
        
        return leaderboard_data
    except Exception as e:
        logger.error(f"Error fetching leaderboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gamification/user-stats/{user_id}")
async def get_user_gamification_stats(user_id: str):
    """Get gamification statistics for a user"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Get user's leaderboard entry
        leaderboard_entry = supabase.table('leaderboard').select('*').eq('user_id', user_id).execute()
        
        # Get badges count
        badges_result = supabase.table('user_badges').select('id', count='exact').eq('user_id', user_id).execute()
        badges_count = len(badges_result.data) if badges_result.data else 0
        
        # Get total available badges
        total_badges = supabase.table('badges').select('id', count='exact').execute()
        total_badges_count = len(total_badges.data) if total_badges.data else 0
        
        stats = {
            "total_points": leaderboard_entry.data[0]['total_points'] if leaderboard_entry.data else 0,
            "courses_completed": leaderboard_entry.data[0]['courses_completed'] if leaderboard_entry.data else 0,
            "streak_days": leaderboard_entry.data[0]['streak_days'] if leaderboard_entry.data else 0,
            "rank": leaderboard_entry.data[0]['rank'] if leaderboard_entry.data else None,
            "badges_earned": badges_count,
            "total_badges": total_badges_count
        }
        
        return stats
    except Exception as e:
        logger.error(f"Error fetching user stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def update_leaderboard_points(user_id: str, points_to_add: int):
    """Helper function to update user's leaderboard points"""
    try:
        if not supabase:
            return
        
        # Get or create leaderboard entry
        existing = supabase.table('leaderboard').select('*').eq('user_id', user_id).execute()
        
        if existing.data:
            # Update existing entry
            new_points = existing.data[0]['total_points'] + points_to_add
            supabase.table('leaderboard').update({
                'total_points': new_points,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('user_id', user_id).execute()
        else:
            # Create new entry
            supabase.table('leaderboard').insert({
                'user_id': user_id,
                'total_points': points_to_add,
                'courses_completed': 0,
                'streak_days': 0,
                'updated_at': datetime.utcnow().isoformat()
            }).execute()
    except Exception as e:
        logger.error(f"Error updating leaderboard: {e}")

# ============= LESSON PROGRESS ENDPOINTS =============

@api_router.post("/courses/{course_id}/lessons/{lesson_id}/progress")
async def update_lesson_progress(course_id: str, lesson_id: str, enrollment_id: str, completed: bool):
    """Update progress for a specific lesson"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Check if progress record exists
        existing = supabase.table('lesson_progress').select('*').eq('enrollment_id', enrollment_id).eq('lesson_id', lesson_id).execute()
        
        if existing.data:
            # Update existing
            update_data = {
                'completed': completed,
                'last_accessed_at': datetime.utcnow().isoformat()
            }
            if completed:
                update_data['completed_at'] = datetime.utcnow().isoformat()
            
            result = supabase.table('lesson_progress').update(update_data).eq('id', existing.data[0]['id']).execute()
        else:
            # Create new
            progress_data = {
                'enrollment_id': enrollment_id,
                'lesson_id': lesson_id,
                'completed': completed,
                'completed_at': datetime.utcnow().isoformat() if completed else None,
                'last_accessed_at': datetime.utcnow().isoformat()
            }
            result = supabase.table('lesson_progress').insert(progress_data).execute()
        
        # Update overall course progress
        await update_course_progress(enrollment_id)
        
        return result.data[0] if result.data else {}
    except Exception as e:
        logger.error(f"Error updating lesson progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/courses/{course_id}/lessons/progress")
async def get_course_lesson_progress(course_id: str, enrollment_id: str):
    """Get progress for all lessons in a course"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        result = supabase.table('lesson_progress').select('*').eq('enrollment_id', enrollment_id).execute()
        return result.data
    except Exception as e:
        logger.error(f"Error fetching lesson progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def update_course_progress(enrollment_id: str):
    """Helper function to update overall course progress percentage"""
    try:
        if not supabase:
            return
        
        # Get enrollment details
        enrollment = supabase.table('enrollments').select('course_id').eq('id', enrollment_id).execute()
        if not enrollment.data:
            return
        
        course_id = enrollment.data[0]['course_id']
        
        # Get total lessons in course
        total_lessons = supabase.table('lessons').select('id', count='exact').eq('course_id', course_id).execute()
        total_count = len(total_lessons.data) if total_lessons.data else 0
        
        if total_count == 0:
            return
        
        # Get completed lessons
        completed_lessons = supabase.table('lesson_progress').select('id', count='exact').eq('enrollment_id', enrollment_id).eq('completed', True).execute()
        completed_count = len(completed_lessons.data) if completed_lessons.data else 0
        
        # Calculate percentage
        progress_percentage = int((completed_count / total_count) * 100)
        
        # Update enrollment
        update_data = {'progress_percentage': progress_percentage}
        if progress_percentage == 100:
            update_data['completed_at'] = datetime.utcnow().isoformat()
            update_data['certificate_issued'] = True
        
        supabase.table('enrollments').update(update_data).eq('id', enrollment_id).execute()
        
    except Exception as e:
        logger.error(f"Error updating course progress: {e}")

# ============= COURSE ENROLLMENT ENDPOINTS =============

@api_router.post("/courses/{course_id}/enroll")
async def enroll_in_course(course_id: str, user_id: str):
    """Enroll a user in a course"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Check if already enrolled
        existing = supabase.table('enrollments').select('id').eq('user_id', user_id).eq('course_id', course_id).execute()
        
        if existing.data:
            return {"message": "Already enrolled", "enrollment_id": existing.data[0]['id']}
        
        # Create enrollment
        enrollment_data = {
            'user_id': user_id,
            'course_id': course_id
        }
        
        result = supabase.table('enrollments').insert(enrollment_data).execute()
        return {"message": "Enrolled successfully", "enrollment_id": result.data[0]['id']}
    except Exception as e:
        logger.error(f"Error enrolling in course: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/courses/{course_id}/details")
async def get_course_with_lessons(course_id: str):
    """Get course details with all lessons organized by modules"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Get course details
        course = supabase.table('courses').select('*').eq('id', course_id).execute()
        if not course.data:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Get lessons for this course
        lessons = supabase.table('lessons').select('*').eq('course_id', course_id).order('order_index').execute()
        
        return {
            "course": course.data[0],
            "lessons": lessons.data if lessons.data else []
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching course details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= CERTIFICATE ENDPOINTS =============

def generate_certificate_pdf(user_name: str, course_title: str, completion_date: str, certificate_id: str, instructor_name: str) -> str:
    """Generate a certificate PDF and return the file path"""
    try:
        # Create temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        temp_path = temp_file.name
        temp_file.close()
        
        # Create PDF canvas
        c = canvas.Canvas(temp_path, pagesize=A4)
        width, height = A4
        
        # Set up colors
        teal_color = colors.HexColor('#0d9488')
        dark_gray = colors.HexColor('#1f2937')
        light_gray = colors.HexColor('#6b7280')
        
        # Add border
        c.setStrokeColor(teal_color)
        c.setLineWidth(3)
        c.rect(30, 30, width-60, height-60, stroke=1, fill=0)
        
        # Add inner border
        c.setLineWidth(1)
        c.rect(40, 40, width-80, height-80, stroke=1, fill=0)
        
        # Title
        c.setFillColor(teal_color)
        c.setFont("Helvetica-Bold", 36)
        c.drawCentredString(width/2, height-120, "CERTIFICATE")
        
        c.setFont("Helvetica", 18)
        c.drawCentredString(width/2, height-150, "OF COMPLETION")
        
        # Horizontal line
        c.setStrokeColor(teal_color)
        c.setLineWidth(2)
        c.line(150, height-170, width-150, height-170)
        
        # Body text
        c.setFillColor(dark_gray)
        c.setFont("Helvetica", 14)
        c.drawCentredString(width/2, height-220, "This is to certify that")
        
        # Student name
        c.setFillColor(teal_color)
        c.setFont("Helvetica-Bold", 28)
        c.drawCentredString(width/2, height-270, user_name)
        
        # Course completion text
        c.setFillColor(dark_gray)
        c.setFont("Helvetica", 14)
        c.drawCentredString(width/2, height-310, "has successfully completed the course")
        
        # Course title
        c.setFillColor(teal_color)
        c.setFont("Helvetica-Bold", 22)
        # Wrap long course titles
        if len(course_title) > 40:
            words = course_title.split()
            line1 = ' '.join(words[:len(words)//2])
            line2 = ' '.join(words[len(words)//2:])
            c.drawCentredString(width/2, height-350, line1)
            c.drawCentredString(width/2, height-375, line2)
            next_y = height-415
        else:
            c.drawCentredString(width/2, height-360, course_title)
            next_y = height-400
        
        # Completion date
        c.setFillColor(dark_gray)
        c.setFont("Helvetica", 12)
        c.drawCentredString(width/2, next_y, f"Completed on {completion_date}")
        
        # Instructor signature section
        signature_y = 180
        c.setStrokeColor(dark_gray)
        c.setLineWidth(1)
        c.line(100, signature_y, 250, signature_y)
        c.line(width-250, signature_y, width-100, signature_y)
        
        c.setFont("Helvetica", 10)
        c.drawCentredString(175, signature_y-20, "Instructor")
        c.drawCentredString(width-175, signature_y-20, "Platform Director")
        
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(175, signature_y-40, instructor_name)
        c.drawCentredString(width-175, signature_y-40, "Edubox LMS")
        
        # Certificate ID at bottom
        c.setFillColor(light_gray)
        c.setFont("Helvetica", 8)
        c.drawCentredString(width/2, 80, f"Certificate ID: {certificate_id}")
        c.drawCentredString(width/2, 65, "Verify at: www.edubox-lms.com/verify")
        
        # Add logo placeholder (text)
        c.setFillColor(teal_color)
        c.setFont("Helvetica-Bold", 24)
        c.drawCentredString(width/2, height-80, "EDUBOX LMS")
        
        # Save PDF
        c.save()
        
        return temp_path
        
    except Exception as e:
        logger.error(f"Error generating certificate PDF: {e}")
        raise

@api_router.get("/certificates/{enrollment_id}/download")
async def download_certificate(enrollment_id: str):
    """Generate and download certificate PDF"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Get enrollment with course and user details
        enrollment = supabase.table('enrollments').select('*, courses(*), users(*)').eq('id', enrollment_id).single().execute()
        
        if not enrollment.data:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        enrollment_data = enrollment.data
        
        # Check if certificate is issued
        if not enrollment_data.get('certificate_issued'):
            raise HTTPException(status_code=400, detail="Certificate not yet issued. Complete the course first.")
        
        # Get user and course details
        user_name = enrollment_data.get('users', {}).get('full_name', 'Student')
        course_title = enrollment_data.get('courses', {}).get('title', 'Course')
        instructor_name = enrollment_data.get('courses', {}).get('instructor_name', 'Instructor')
        completion_date = datetime.fromisoformat(enrollment_data.get('completed_at')).strftime('%B %d, %Y')
        
        # Generate PDF
        pdf_path = generate_certificate_pdf(
            user_name=user_name,
            course_title=course_title,
            completion_date=completion_date,
            certificate_id=enrollment_id[:8].upper(),
            instructor_name=instructor_name
        )
        
        # Return PDF file
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=f"Certificate_{course_title.replace(' ', '_')}.pdf"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading certificate: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/certificates/user/{user_id}")
async def get_user_certificates(user_id: str):
    """Get all certificates for a user"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # For now, return empty list since no users exist yet
        # In production, this would query enrollments with certificate_issued=True
        result = supabase.table('enrollments').select('*').eq('user_id', user_id).execute()
        
        # Filter for certificates (if certificate_issued column exists)
        certificates = []
        if result.data:
            for enrollment in result.data:
                if enrollment.get('certificate_issued'):
                    certificates.append(enrollment)
        
        return certificates
    except Exception as e:
        logger.error(f"Error fetching user certificates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= AI ENDPOINTS =============
from ai_service import ai_service

@api_router.get("/ai/recommend-courses")
async def recommend_courses(user_id: str, limit: int = 5):
    """Get AI-powered course recommendations for a user"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Get user data
        user = supabase.table('users').select('*').eq('id', user_id).execute()
        if not user.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user.data[0]
        
        # Get user's enrollment history
        enrollments = supabase.table('enrollments').select('course_id, progress, completed').eq('user_id', user_id).execute()
        user_data['completed_courses'] = sum(1 for e in enrollments.data if e.get('completed', False)) if enrollments.data else 0
        user_data['in_progress_courses'] = sum(1 for e in enrollments.data if not e.get('completed', False)) if enrollments.data else 0
        
        # Get enrolled course IDs
        enrolled_ids = [e['course_id'] for e in enrollments.data] if enrollments.data else []
        
        # Get available courses (not enrolled)
        all_courses = supabase.table('courses').select('*').execute()
        available_courses = [c for c in all_courses.data if c['id'] not in enrolled_ids] if all_courses.data else []
        
        # Get AI recommendations
        recommendations = await ai_service.recommend_courses(user_data, available_courses[:20])
        
        # Return top recommendations with full course details
        result = []
        for rec in recommendations[:limit]:
            course = next((c for c in available_courses if c['id'] == rec.get('course_id')), None)
            if course:
                result.append({
                    **course,
                    'ai_reason': rec.get('reason', ''),
                    'match_score': rec.get('match_score', 0)
                })
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/learning-path")
async def generate_learning_path(request: LearningPathRequest):
    """Generate a personalized learning path for a user"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Get user data
        user = supabase.table('users').select('*').eq('id', request.user_id).execute()
        if not user.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user.data[0]
        user_data['skill_level'] = user_data.get('skill_level', 'beginner')
        user_data['weekly_hours'] = 5  # Default
        
        # Generate learning path
        learning_path = await ai_service.generate_learning_path(user_data, request.goal)
        
        # Store in database
        path_data = {
            'user_id': request.user_id,
            'goal': request.goal,
            'path_data': learning_path,
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Try to insert into learning_paths table (if it exists)
        try:
            result = supabase.table('learning_paths').insert(path_data).execute()
            learning_path['id'] = result.data[0]['id']
        except:
            # Table might not exist yet, just return the path
            pass
        
        return learning_path
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating learning path: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ai/content-suggestions/{user_id}")
async def get_content_suggestions(user_id: str):
    """Get AI-powered content suggestions based on recent activity"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Get recent lesson progress
        recent_activity = supabase.table('lesson_progress').select('*').eq('user_id', user_id).order('updated_at', desc=True).limit(10).execute()
        
        activity_data = recent_activity.data if recent_activity.data else []
        
        # Get AI suggestions
        suggestions = await ai_service.suggest_content(user_id, activity_data)
        
        return suggestions
    except Exception as e:
        logger.error(f"Error getting content suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/generate-quiz")
async def generate_quiz(course_id: str, difficulty: str = "medium"):
    """Generate an AI-powered quiz for a course"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Get course data
        course = supabase.table('courses').select('*').eq('id', course_id).execute()
        if not course.data:
            raise HTTPException(status_code=404, detail="Course not found")
        
        course_data = course.data[0]
        course_data['course_id'] = course_id
        
        # Generate quiz
        quiz = await ai_service.generate_quiz(course_data, difficulty)
        
        # Store quiz in database
        quiz_data = {
            'course_id': course_id,
            'title': quiz.get('quiz_title', f"Quiz: {course_data['title']}"),
            'questions': quiz.get('questions', []),
            'difficulty': difficulty,
            'created_at': datetime.utcnow().isoformat()
        }
        
        try:
            result = supabase.table('quizzes').insert(quiz_data).execute()
            quiz['id'] = result.data[0]['id']
        except:
            # Just return the quiz even if storage fails
            pass
        
        return quiz
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ai/learning-style/{user_id}")
async def analyze_learning_style(user_id: str):
    """Analyze user's learning style based on activity"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Get user activity data
        enrollments = supabase.table('enrollments').select('*').eq('user_id', user_id).execute()
        lesson_progress = supabase.table('lesson_progress').select('*').eq('user_id', user_id).execute()
        
        activity_data = []
        if enrollments.data:
            activity_data.extend(enrollments.data)
        if lesson_progress.data:
            activity_data.extend(lesson_progress.data)
        
        # Analyze learning style
        analysis = await ai_service.analyze_learning_style(activity_data)
        
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing learning style: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= FORUM ENDPOINTS =============
from forum_service import forum_service

class ThreadCreate(BaseModel):
    forum_id: str
    user_id: str
    title: str
    content: str

class PostCreate(BaseModel):
    thread_id: str
    user_id: str
    content: str

class VoteRequest(BaseModel):
    user_id: str
    votable_type: str  # 'thread' or 'post'
    votable_id: str
    vote_type: str  # 'upvote' or 'downvote'

@api_router.get("/forums/course/{course_id}")
async def get_course_forum(course_id: str):
    """Get or create forum for a course"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Get course title
        course = supabase.table('courses').select('title').eq('id', course_id).execute()
        if not course.data:
            raise HTTPException(status_code=404, detail="Course not found")
        
        forum = forum_service.get_or_create_forum(course_id, course.data[0]['title'])
        return forum
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting forum: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/forums/{forum_id}/threads")
async def get_forum_threads(forum_id: str, sort_by: str = 'recent', limit: int = 50, offset: int = 0):
    """Get threads from a forum"""
    try:
        threads = forum_service.get_threads(forum_id, sort_by, limit, offset)
        return threads
    except Exception as e:
        logger.error(f"Error getting threads: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/forums/threads")
async def create_forum_thread(thread: ThreadCreate):
    """Create a new discussion thread"""
    try:
        result = forum_service.create_thread(
            thread.forum_id,
            thread.user_id,
            thread.title,
            thread.content
        )
        return result
    except Exception as e:
        logger.error(f"Error creating thread: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/forums/threads/{thread_id}")
async def get_thread_details(thread_id: str):
    """Get thread with all posts"""
    try:
        thread = forum_service.get_thread_details(thread_id)
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        return thread
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting thread details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/forums/posts")
async def create_forum_post(post: PostCreate):
    """Create a reply post"""
    try:
        result = forum_service.create_post(
            post.thread_id,
            post.user_id,
            post.content
        )
        return result
    except Exception as e:
        logger.error(f"Error creating post: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/forums/vote")
async def vote_on_content(vote: VoteRequest):
    """Upvote or downvote a thread or post"""
    try:
        result = forum_service.vote(
            vote.user_id,
            vote.votable_type,
            vote.votable_id,
            vote.vote_type
        )
        return result
    except Exception as e:
        logger.error(f"Error processing vote: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/forums/posts/{post_id}/best-answer")
async def mark_as_best_answer(post_id: str, thread_id: str):
    """Mark a post as the best answer"""
    try:
        result = forum_service.mark_best_answer(post_id, thread_id)
        return result
    except Exception as e:
        logger.error(f"Error marking best answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/forums/{forum_id}/search")
async def search_forum(forum_id: str, q: str):
    """Search threads in a forum"""
    try:
        results = forum_service.search_threads(forum_id, q)
        return results
    except Exception as e:
        logger.error(f"Error searching forum: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= LIVE SESSION ENDPOINTS =============
from live_session_service import live_session_service

class SessionCreate(BaseModel):
    course_id: str
    instructor_id: str
    title: str
    description: str
    scheduled_start: str
    duration_minutes: int = 60

class AttendeeRegister(BaseModel):
    session_id: str
    user_id: str

@api_router.post("/live-sessions")
async def create_live_session(session: SessionCreate):
    """Create a new live session"""
    try:
        result = live_session_service.create_session(
            session.course_id,
            session.instructor_id,
            session.title,
            session.description,
            session.scheduled_start,
            session.duration_minutes
        )
        return result
    except Exception as e:
        logger.error(f"Error creating live session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/live-sessions")
async def get_live_sessions(course_id: Optional[str] = None, instructor_id: Optional[str] = None, status: Optional[str] = None):
    """Get live sessions with optional filters"""
    try:
        sessions = live_session_service.get_sessions(course_id, instructor_id, status)
        return sessions
    except Exception as e:
        logger.error(f"Error getting live sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/live-sessions/upcoming")
async def get_upcoming_sessions(limit: int = 10):
    """Get upcoming live sessions"""
    try:
        sessions = live_session_service.get_upcoming_sessions(limit)
        return sessions
    except Exception as e:
        logger.error(f"Error getting upcoming sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/live-sessions/{session_id}")
async def get_session_details(session_id: str):
    """Get detailed session information"""
    try:
        session = live_session_service.get_session_details(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/live-sessions/register")
async def register_for_session(attendee: AttendeeRegister):
    """Register for a live session"""
    try:
        result = live_session_service.register_attendee(
            attendee.session_id,
            attendee.user_id
        )
        return result
    except Exception as e:
        logger.error(f"Error registering for session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/live-sessions/{session_id}/start")
async def start_live_session(session_id: str):
    """Start a live session"""
    try:
        result = live_session_service.start_session(session_id)
        return result
    except Exception as e:
        logger.error(f"Error starting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/live-sessions/{session_id}/end")
async def end_live_session(session_id: str, recording_url: Optional[str] = None):
    """End a live session"""
    try:
        result = live_session_service.end_session(session_id, recording_url)
        return result
    except Exception as e:
        logger.error(f"Error ending session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/live-sessions/{session_id}/cancel")
async def cancel_live_session(session_id: str):
    """Cancel a live session"""
    try:
        result = live_session_service.cancel_session(session_id)
        return result
    except Exception as e:
        logger.error(f"Error cancelling session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/live-sessions/recordings")
async def get_session_recordings(course_id: Optional[str] = None):
    """Get recorded sessions"""
    try:
        recordings = live_session_service.get_session_recordings(course_id)
        return recordings
    except Exception as e:
        logger.error(f"Error getting recordings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= PAYMENT ENDPOINTS =============
from payment_service import payment_service

class CartItem(BaseModel):
    user_id: str
    course_id: str

class PaymentIntentRequest(BaseModel):
    user_id: str
    course_ids: List[str]

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem):
    """Add course to shopping cart"""
    try:
        result = payment_service.add_to_cart(item.user_id, item.course_id)
        return result
    except Exception as e:
        logger.error(f"Error adding to cart: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/cart/{user_id}")
async def get_user_cart(user_id: str):
    """Get user's shopping cart"""
    try:
        cart = payment_service.get_cart(user_id)
        return cart
    except Exception as e:
        logger.error(f"Error getting cart: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/cart/remove")
async def remove_from_cart(user_id: str, course_id: str):
    """Remove item from cart"""
    try:
        result = payment_service.remove_from_cart(user_id, course_id)
        return result
    except Exception as e:
        logger.error(f"Error removing from cart: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/cart/{user_id}/clear")
async def clear_cart(user_id: str):
    """Clear user's cart"""
    try:
        result = payment_service.clear_cart(user_id)
        return result
    except Exception as e:
        logger.error(f"Error clearing cart: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payments/create-intent")
async def create_payment_intent(payment_request: PaymentIntentRequest):
    """Create Stripe payment intent"""
    try:
        intent = payment_service.create_payment_intent(
            payment_request.user_id,
            payment_request.course_ids
        )
        return intent
    except Exception as e:
        logger.error(f"Error creating payment intent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payments/confirm")
async def confirm_payment(payment_intent_id: str):
    """Confirm payment and grant course access"""
    try:
        result = payment_service.confirm_payment(payment_intent_id)
        return result
    except Exception as e:
        logger.error(f"Error confirming payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/history/{user_id}")
async def get_payment_history(user_id: str):
    """Get user's payment history"""
    try:
        payments = payment_service.get_user_payments(user_id)
        return payments
    except Exception as e:
        logger.error(f"Error getting payment history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/invoices/{user_id}")
async def get_user_invoices(user_id: str):
    """Get user's invoices"""
    try:
        invoices = payment_service.get_user_invoices(user_id)
        return invoices
    except Exception as e:
        logger.error(f"Error getting invoices: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/purchases/{user_id}")
async def get_user_purchases(user_id: str):
    """Get user's course purchases"""
    try:
        purchases = payment_service.get_user_purchases(user_id)
        return purchases
    except Exception as e:
        logger.error(f"Error getting purchases: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/purchases/check/{user_id}/{course_id}")
async def check_course_purchase(user_id: str, course_id: str):
    """Check if user has purchased a course"""
    try:
        has_purchased = payment_service.has_purchased_course(user_id, course_id)
        return {'has_purchased': has_purchased}
    except Exception as e:
        logger.error(f"Error checking purchase: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
