"""
Live Session Service for Edubox LMS
Handles live video sessions using Daily.co or other video platforms
"""

import os
import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class LiveSessionService:
    """Service for managing live video sessions"""
    
    def __init__(self):
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')
        self.supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None
        self.daily_api_key = os.environ.get('DAILY_API_KEY')
        self.daily_api_url = "https://api.daily.co/v1"
    
    def create_session(self, course_id: str, instructor_id: str, title: str, 
                      description: str, scheduled_start: str, duration_minutes: int = 60) -> Dict:
        """Create a new live session"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        # Calculate scheduled_end
        start_time = datetime.fromisoformat(scheduled_start.replace('Z', '+00:00'))
        end_time = start_time + timedelta(minutes=duration_minutes)
        
        # Create Daily.co room if API key is available
        meeting_url = None
        meeting_id = None
        
        if self.daily_api_key:
            try:
                room_data = self._create_daily_room(title)
                meeting_url = room_data.get('url')
                meeting_id = room_data.get('name')
            except Exception as e:
                print(f"Error creating Daily.co room: {e}")
                # Continue without video room for now
        
        # Create session in database
        session_data = {
            'course_id': course_id,
            'instructor_id': instructor_id,
            'title': title,
            'description': description,
            'scheduled_start': start_time.isoformat(),
            'scheduled_end': end_time.isoformat(),
            'status': 'scheduled',
            'platform': 'daily',
            'meeting_url': meeting_url or f"https://daily.co/temp-{datetime.utcnow().timestamp()}",
            'meeting_id': meeting_id,
            'max_participants': 100,
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = self.supabase.table('live_sessions').insert(session_data).execute()
        return result.data[0]
    
    def _create_daily_room(self, room_name: str) -> Dict:
        """Create a Daily.co video room"""
        headers = {
            'Authorization': f'Bearer {self.daily_api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'name': f"edubox-{room_name.lower().replace(' ', '-')}-{int(datetime.utcnow().timestamp())}",
            'privacy': 'public',
            'properties': {
                'enable_chat': True,
                'enable_screenshare': True,
                'enable_recording': 'cloud',
                'max_participants': 100
            }
        }
        
        response = requests.post(f"{self.daily_api_url}/rooms", json=data, headers=headers)
        response.raise_for_status()
        return response.json()
    
    def get_sessions(self, course_id: Optional[str] = None, instructor_id: Optional[str] = None, 
                    status: Optional[str] = None) -> List[Dict]:
        """Get live sessions with optional filters"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        query = self.supabase.table('live_sessions').select('*, courses(title), users(full_name)')
        
        if course_id:
            query = query.eq('course_id', course_id)
        if instructor_id:
            query = query.eq('instructor_id', instructor_id)
        if status:
            query = query.eq('status', status)
        
        result = query.order('scheduled_start', desc=True).execute()
        return result.data if result.data else []
    
    def get_upcoming_sessions(self, limit: int = 10) -> List[Dict]:
        """Get upcoming scheduled sessions"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        now = datetime.utcnow().isoformat()
        result = self.supabase.table('live_sessions').select('*, courses(title), users(full_name)').eq('status', 'scheduled').gte('scheduled_start', now).order('scheduled_start').limit(limit).execute()
        
        return result.data if result.data else []
    
    def get_session_details(self, session_id: str) -> Optional[Dict]:
        """Get detailed information about a session"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        result = self.supabase.table('live_sessions').select('*, courses(title), users(full_name)').eq('id', session_id).execute()
        
        if not result.data:
            return None
        
        session = result.data[0]
        
        # Get attendees
        attendees_result = self.supabase.table('session_attendees').select('*, users(full_name, avatar_url)').eq('session_id', session_id).execute()
        
        session['attendees'] = attendees_result.data if attendees_result.data else []
        session['attendees_count'] = len(session['attendees'])
        
        return session
    
    def register_attendee(self, session_id: str, user_id: str) -> Dict:
        """Register a user for a live session"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        attendee_data = {
            'session_id': session_id,
            'user_id': user_id,
            'status': 'registered',
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Use upsert to avoid duplicate registrations
        result = self.supabase.table('session_attendees').upsert(attendee_data).execute()
        return result.data[0] if result.data else {}
    
    def mark_attendance(self, session_id: str, user_id: str, joined_at: Optional[str] = None) -> Dict:
        """Mark a user as attended"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        if not joined_at:
            joined_at = datetime.utcnow().isoformat()
        
        result = self.supabase.table('session_attendees').update({
            'joined_at': joined_at,
            'status': 'attended'
        }).eq('session_id', session_id).eq('user_id', user_id).execute()
        
        return result.data[0] if result.data else {}
    
    def record_leave(self, session_id: str, user_id: str) -> Dict:
        """Record when a user leaves a session"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        left_at = datetime.utcnow().isoformat()
        
        # Get joined_at to calculate duration
        attendee = self.supabase.table('session_attendees').select('joined_at').eq('session_id', session_id).eq('user_id', user_id).execute()
        
        duration_minutes = 0
        if attendee.data and attendee.data[0].get('joined_at'):
            joined = datetime.fromisoformat(attendee.data[0]['joined_at'].replace('Z', '+00:00'))
            left = datetime.utcnow()
            duration_minutes = int((left - joined).total_seconds() / 60)
        
        result = self.supabase.table('session_attendees').update({
            'left_at': left_at,
            'duration_minutes': duration_minutes
        }).eq('session_id', session_id).eq('user_id', user_id).execute()
        
        return result.data[0] if result.data else {}
    
    def start_session(self, session_id: str) -> Dict:
        """Mark a session as live/started"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        result = self.supabase.table('live_sessions').update({
            'status': 'live',
            'actual_start': datetime.utcnow().isoformat()
        }).eq('id', session_id).execute()
        
        return result.data[0] if result.data else {}
    
    def end_session(self, session_id: str, recording_url: Optional[str] = None) -> Dict:
        """Mark a session as ended"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        update_data = {
            'status': 'ended',
            'actual_end': datetime.utcnow().isoformat()
        }
        
        if recording_url:
            update_data['recording_url'] = recording_url
        
        result = self.supabase.table('live_sessions').update(update_data).eq('id', session_id).execute()
        
        return result.data[0] if result.data else {}
    
    def cancel_session(self, session_id: str) -> Dict:
        """Cancel a scheduled session"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        result = self.supabase.table('live_sessions').update({
            'status': 'cancelled'
        }).eq('id', session_id).execute()
        
        return result.data[0] if result.data else {}
    
    def get_session_recordings(self, course_id: Optional[str] = None) -> List[Dict]:
        """Get recorded sessions"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        query = self.supabase.table('live_sessions').select('*').eq('status', 'ended').neq('recording_url', None)
        
        if course_id:
            query = query.eq('course_id', course_id)
        
        result = query.order('actual_start', desc=True).execute()
        return result.data if result.data else []

# Singleton instance
live_session_service = LiveSessionService()
