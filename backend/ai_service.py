"""
AI Service for Edubox LMS
Provides AI-powered features including:
- Course recommendations
- Personalized learning paths
- Smart content suggestions
- Intelligent quiz generation
"""

import os
import json
from typing import List, Dict, Optional
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv

load_dotenv()

class AIService:
    """AI service using Emergent LLM integration"""
    
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not found in environment variables")
    
    async def recommend_courses(self, user_data: Dict, available_courses: List[Dict]) -> List[Dict]:
        """
        Generate personalized course recommendations based on user history and preferences
        """
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"recommend_{user_data.get('user_id', 'unknown')}",
            system_message="""You are an expert educational advisor for an LMS platform. 
            Your task is to recommend courses to students based on their learning history, 
            interests, and progress. Provide thoughtful, personalized recommendations that 
            help students grow their skills."""
        ).with_model("openai", "gpt-4o-mini")
        
        # Prepare user context
        user_context = f"""
        User Profile:
        - Interests: {', '.join(user_data.get('interests', []))}
        - Completed Courses: {user_data.get('completed_courses', 0)}
        - Current Progress: {user_data.get('in_progress_courses', 0)} courses in progress
        - Skill Level: {user_data.get('skill_level', 'beginner')}
        - Learning Goals: {user_data.get('learning_goals', 'general skill development')}
        
        Available Courses:
        {json.dumps(available_courses, indent=2)}
        
        Please recommend the top 5 most suitable courses for this user. 
        Return ONLY a JSON array with course IDs and brief reasons, like this:
        [
          {{"course_id": "id1", "reason": "Perfect for your interest in...", "match_score": 95}},
          {{"course_id": "id2", "reason": "Builds on your previous...", "match_score": 88}}
        ]
        """
        
        user_message = UserMessage(text=user_context)
        response = await chat.send_message(user_message)
        
        try:
            # Extract JSON from response
            recommendations = json.loads(response)
            return recommendations
        except json.JSONDecodeError:
            # Fallback: return first 5 courses if AI response parsing fails
            return [
                {
                    "course_id": course['id'],
                    "reason": "Recommended based on your interests",
                    "match_score": 75
                }
                for course in available_courses[:5]
            ]
    
    async def generate_learning_path(self, user_data: Dict, goal: str) -> Dict:
        """
        Create a personalized learning path for a specific goal
        """
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"learning_path_{user_data.get('user_id', 'unknown')}",
            system_message="""You are an expert curriculum designer. Create structured 
            learning paths that guide students from their current level to their goals."""
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""
        Create a personalized learning path for a student with this profile:
        
        Current Level: {user_data.get('skill_level', 'beginner')}
        Interests: {', '.join(user_data.get('interests', []))}
        Goal: {goal}
        Available Time: {user_data.get('weekly_hours', 5)} hours per week
        
        Provide a structured learning path with milestones, estimated duration, and key skills.
        Return ONLY valid JSON in this format:
        {{
          "path_name": "Path to become...",
          "duration_weeks": 12,
          "milestones": [
            {{
              "week": 1,
              "title": "Foundation Building",
              "description": "Learn the basics...",
              "skills": ["skill1", "skill2"]
            }}
          ],
          "recommended_courses": ["course_id1", "course_id2"]
        }}
        """
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        try:
            learning_path = json.loads(response)
            return learning_path
        except json.JSONDecodeError:
            # Fallback learning path
            return {
                "path_name": f"Learning Path: {goal}",
                "duration_weeks": 8,
                "milestones": [
                    {
                        "week": 1,
                        "title": "Getting Started",
                        "description": "Begin your learning journey",
                        "skills": ["basics"]
                    }
                ],
                "recommended_courses": []
            }
    
    async def suggest_content(self, user_id: str, recent_activity: List[Dict]) -> List[Dict]:
        """
        Suggest relevant content based on recent learning activity
        """
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"content_suggest_{user_id}",
            system_message="""You are a learning content curator. Suggest relevant 
            articles, videos, and resources that complement what the student is learning."""
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""
        Based on this recent learning activity:
        {json.dumps(recent_activity, indent=2)}
        
        Suggest 5 relevant learning resources (articles, videos, tutorials).
        Return ONLY valid JSON array:
        [
          {{
            "title": "Resource title",
            "type": "article",
            "description": "Why this is relevant...",
            "url": "https://example.com",
            "relevance_score": 90
          }}
        ]
        """
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        try:
            suggestions = json.loads(response)
            return suggestions
        except json.JSONDecodeError:
            return []
    
    async def generate_quiz(self, course_data: Dict, difficulty: str = "medium") -> Dict:
        """
        Generate intelligent quiz questions for a course or lesson
        """
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"quiz_gen_{course_data.get('course_id', 'unknown')}",
            system_message="""You are an expert educator who creates effective assessment 
            questions. Generate clear, educational quiz questions that test understanding."""
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""
        Generate a quiz for this course:
        
        Course: {course_data.get('title', 'Unknown Course')}
        Topic: {course_data.get('topic', 'General')}
        Difficulty: {difficulty}
        Description: {course_data.get('description', '')}
        
        Create 5 multiple-choice questions with 4 options each.
        Return ONLY valid JSON:
        {{
          "quiz_title": "Quiz title",
          "questions": [
            {{
              "question": "Question text?",
              "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
              "correct_answer": "A",
              "explanation": "Why this is correct..."
            }}
          ]
        }}
        """
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        try:
            quiz_data = json.loads(response)
            return quiz_data
        except json.JSONDecodeError:
            # Fallback quiz
            return {
                "quiz_title": f"Quiz: {course_data.get('title', 'Course Quiz')}",
                "questions": [
                    {
                        "question": "Sample question?",
                        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
                        "correct_answer": "A",
                        "explanation": "This is the correct answer because..."
                    }
                ]
            }
    
    async def analyze_learning_style(self, user_activity: List[Dict]) -> Dict:
        """
        Analyze user's learning style based on their activity patterns
        """
        chat = LlmChat(
            api_key=self.api_key,
            session_id="learning_style_analysis",
            system_message="""You are an educational psychologist analyzing learning patterns 
            to identify student learning styles and preferences."""
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""
        Analyze this learning activity data:
        {json.dumps(user_activity, indent=2)}
        
        Identify the user's learning style and preferences.
        Return ONLY valid JSON:
        {{
          "primary_style": "visual/auditory/kinesthetic/reading",
          "confidence": 85,
          "preferences": {{
            "video_content": 70,
            "reading": 60,
            "interactive": 80
          }},
          "recommendations": [
            "You learn best through...",
            "Consider trying more..."
          ]
        }}
        """
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        try:
            analysis = json.loads(response)
            return analysis
        except json.JSONDecodeError:
            return {
                "primary_style": "mixed",
                "confidence": 50,
                "preferences": {
                    "video_content": 50,
                    "reading": 50,
                    "interactive": 50
                },
                "recommendations": ["Continue exploring different learning methods"]
            }

# Singleton instance
ai_service = AIService()
