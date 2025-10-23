"""
Forum Service for Edubox LMS
Handles discussion forums, threads, posts, and voting
"""

import os
from typing import List, Dict, Optional
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class ForumService:
    """Service for managing discussion forums"""
    
    def __init__(self):
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')
        self.supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None
    
    def get_or_create_forum(self, course_id: str, course_title: str) -> Dict:
        """Get or create a forum for a course"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        # Check if forum exists
        result = self.supabase.table('forums').select('*').eq('course_id', course_id).execute()
        
        if result.data:
            return result.data[0]
        
        # Create new forum
        forum_data = {
            'course_id': course_id,
            'title': f"{course_title} Discussion Forum",
            'description': f"Ask questions and discuss topics related to {course_title}",
            'threads_count': 0,
            'posts_count': 0,
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = self.supabase.table('forums').insert(forum_data).execute()
        return result.data[0]
    
    def create_thread(self, forum_id: str, user_id: str, title: str, content: str) -> Dict:
        """Create a new discussion thread"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        thread_data = {
            'forum_id': forum_id,
            'user_id': user_id,
            'title': title,
            'content': content,
            'views_count': 0,
            'replies_count': 0,
            'upvotes_count': 0,
            'downvotes_count': 0,
            'created_at': datetime.utcnow().isoformat(),
            'last_activity_at': datetime.utcnow().isoformat()
        }
        
        result = self.supabase.table('forum_threads').insert(thread_data).execute()
        
        # Increment forum thread count
        self.supabase.rpc('increment', {
            'table_name': 'forums',
            'row_id': forum_id,
            'column_name': 'threads_count'
        }).execute()
        
        return result.data[0]
    
    def get_threads(self, forum_id: str, sort_by: str = 'recent', limit: int = 50, offset: int = 0) -> List[Dict]:
        """Get threads from a forum with sorting"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        query = self.supabase.table('forum_threads').select('*, users(full_name, avatar_url)').eq('forum_id', forum_id)
        
        # Apply sorting
        if sort_by == 'recent':
            query = query.order('last_activity_at', desc=True)
        elif sort_by == 'popular':
            query = query.order('upvotes_count', desc=True)
        elif sort_by == 'most_replied':
            query = query.order('replies_count', desc=True)
        else:
            query = query.order('created_at', desc=True)
        
        result = query.limit(limit).offset(offset).execute()
        return result.data if result.data else []
    
    def get_thread_details(self, thread_id: str) -> Optional[Dict]:
        """Get thread details with posts"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        # Get thread
        thread_result = self.supabase.table('forum_threads').select('*, users(full_name, avatar_url)').eq('id', thread_id).execute()
        
        if not thread_result.data:
            return None
        
        thread = thread_result.data[0]
        
        # Increment view count
        self.supabase.table('forum_threads').update({
            'views_count': thread['views_count'] + 1
        }).eq('id', thread_id).execute()
        
        # Get posts
        posts_result = self.supabase.table('forum_posts').select('*, users(full_name, avatar_url)').eq('thread_id', thread_id).order('created_at', desc=False).execute()
        
        thread['posts'] = posts_result.data if posts_result.data else []
        
        return thread
    
    def create_post(self, thread_id: str, user_id: str, content: str) -> Dict:
        """Create a reply post in a thread"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        post_data = {
            'thread_id': thread_id,
            'user_id': user_id,
            'content': content,
            'upvotes_count': 0,
            'downvotes_count': 0,
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = self.supabase.table('forum_posts').insert(post_data).execute()
        
        # Update thread reply count and last activity
        thread = self.supabase.table('forum_threads').select('replies_count').eq('id', thread_id).execute()
        if thread.data:
            self.supabase.table('forum_threads').update({
                'replies_count': thread.data[0]['replies_count'] + 1,
                'last_activity_at': datetime.utcnow().isoformat()
            }).eq('id', thread_id).execute()
        
        return result.data[0]
    
    def vote(self, user_id: str, votable_type: str, votable_id: str, vote_type: str) -> Dict:
        """Add or update a vote (upvote/downvote)"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        # Check if vote exists
        existing_vote = self.supabase.table('forum_votes').select('*').eq('user_id', user_id).eq('votable_type', votable_type).eq('votable_id', votable_id).execute()
        
        if existing_vote.data:
            # Update existing vote
            old_vote = existing_vote.data[0]
            if old_vote['vote_type'] == vote_type:
                # Remove vote
                self.supabase.table('forum_votes').delete().eq('id', old_vote['id']).execute()
                self._update_vote_count(votable_type, votable_id, vote_type, -1)
                return {'action': 'removed', 'vote_type': vote_type}
            else:
                # Change vote
                self.supabase.table('forum_votes').update({'vote_type': vote_type}).eq('id', old_vote['id']).execute()
                self._update_vote_count(votable_type, votable_id, old_vote['vote_type'], -1)
                self._update_vote_count(votable_type, votable_id, vote_type, 1)
                return {'action': 'changed', 'vote_type': vote_type}
        else:
            # Create new vote
            vote_data = {
                'user_id': user_id,
                'votable_type': votable_type,
                'votable_id': votable_id,
                'vote_type': vote_type,
                'created_at': datetime.utcnow().isoformat()
            }
            self.supabase.table('forum_votes').insert(vote_data).execute()
            self._update_vote_count(votable_type, votable_id, vote_type, 1)
            return {'action': 'added', 'vote_type': vote_type}
    
    def _update_vote_count(self, votable_type: str, votable_id: str, vote_type: str, delta: int):
        """Update vote count on thread or post"""
        table = 'forum_threads' if votable_type == 'thread' else 'forum_posts'
        column = 'upvotes_count' if vote_type == 'upvote' else 'downvotes_count'
        
        item = self.supabase.table(table).select(column).eq('id', votable_id).execute()
        if item.data:
            current_count = item.data[0][column]
            new_count = max(0, current_count + delta)
            self.supabase.table(table).update({column: new_count}).eq('id', votable_id).execute()
    
    def mark_best_answer(self, post_id: str, thread_id: str) -> Dict:
        """Mark a post as the best answer"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        # Unmark any existing best answer in the thread
        self.supabase.table('forum_posts').update({'is_best_answer': False}).eq('thread_id', thread_id).execute()
        
        # Mark the new best answer
        result = self.supabase.table('forum_posts').update({'is_best_answer': True}).eq('id', post_id).execute()
        
        # Update thread
        self.supabase.table('forum_threads').update({'has_best_answer': True}).eq('id', thread_id).execute()
        
        return result.data[0] if result.data else {}
    
    def search_threads(self, forum_id: str, query: str) -> List[Dict]:
        """Search threads by title or content"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        # Basic text search (can be enhanced with full-text search)
        result = self.supabase.table('forum_threads').select('*').eq('forum_id', forum_id).ilike('title', f'%{query}%').execute()
        
        return result.data if result.data else []

# Singleton instance
forum_service = ForumService()
