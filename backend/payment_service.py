"""
Payment Service for Edubox LMS
Handles Stripe payment integration for course purchases
"""

import os
import stripe
from typing import List, Dict, Optional
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class PaymentService:
    """Service for handling payments with Stripe"""
    
    def __init__(self):
        self.stripe_secret_key = os.environ.get('STRIPE_SECRET_KEY')
        if self.stripe_secret_key and self.stripe_secret_key != 'your_stripe_secret_key_here':
            stripe.api_key = self.stripe_secret_key
        
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')
        self.supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None
    
    def add_to_cart(self, user_id: str, course_id: str) -> Dict:
        """Add a course to user's shopping cart"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        cart_item = {
            'user_id': user_id,
            'course_id': course_id,
            'added_at': datetime.utcnow().isoformat()
        }
        
        # Upsert to avoid duplicates
        result = self.supabase.table('shopping_cart').upsert(cart_item).execute()
        return result.data[0] if result.data else {}
    
    def get_cart(self, user_id: str) -> List[Dict]:
        """Get user's shopping cart with course details"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        result = self.supabase.table('shopping_cart').select('*, courses(*)').eq('user_id', user_id).execute()
        return result.data if result.data else []
    
    def remove_from_cart(self, user_id: str, course_id: str) -> Dict:
        """Remove a course from cart"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        result = self.supabase.table('shopping_cart').delete().eq('user_id', user_id).eq('course_id', course_id).execute()
        return {'success': True, 'message': 'Item removed from cart'}
    
    def clear_cart(self, user_id: str) -> Dict:
        """Clear all items from cart"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        result = self.supabase.table('shopping_cart').delete().eq('user_id', user_id).execute()
        return {'success': True, 'message': 'Cart cleared'}
    
    def create_payment_intent(self, user_id: str, course_ids: List[str]) -> Dict:
        """Create a Stripe payment intent for course purchase"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        if not stripe.api_key or stripe.api_key == 'your_stripe_secret_key_here':
            # Return mock payment intent when Stripe is not configured
            return {
                'client_secret': 'mock_client_secret',
                'amount': 0,
                'currency': 'usd',
                'status': 'requires_payment_method',
                'mock': True
            }
        
        # Get course details and calculate total
        courses = self.supabase.table('courses').select('*').in_('id', course_ids).execute()
        
        if not courses.data:
            raise ValueError("No courses found")
        
        total_amount = sum(course['price'] for course in courses.data)
        
        # Convert to cents for Stripe
        amount_cents = int(total_amount * 100)
        
        # Create or get Stripe customer
        customer_id = self._get_or_create_customer(user_id)
        
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency='usd',
            customer=customer_id,
            metadata={
                'user_id': user_id,
                'course_ids': ','.join(course_ids)
            }
        )
        
        # Store payment record
        for course in courses.data:
            payment_data = {
                'user_id': user_id,
                'course_id': course['id'],
                'stripe_payment_id': intent.id,
                'stripe_customer_id': customer_id,
                'amount': course['price'],
                'currency': 'usd',
                'status': 'pending',
                'created_at': datetime.utcnow().isoformat()
            }
            self.supabase.table('payments').insert(payment_data).execute()
        
        return {
            'client_secret': intent.client_secret,
            'amount': total_amount,
            'currency': 'usd',
            'payment_intent_id': intent.id
        }
    
    def _get_or_create_customer(self, user_id: str) -> str:
        """Get or create Stripe customer for user"""
        # Check if customer exists in our database
        user = self.supabase.table('users').select('stripe_customer_id, email').eq('id', user_id).execute()
        
        if user.data and user.data[0].get('stripe_customer_id'):
            return user.data[0]['stripe_customer_id']
        
        # Create new Stripe customer
        customer = stripe.Customer.create(
            email=user.data[0].get('email') if user.data else None,
            metadata={'user_id': user_id}
        )
        
        # Store customer ID
        if user.data:
            self.supabase.table('users').update({
                'stripe_customer_id': customer.id
            }).eq('id', user_id).execute()
        
        return customer.id
    
    def confirm_payment(self, payment_intent_id: str) -> Dict:
        """Confirm payment and grant course access"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        if not stripe.api_key or stripe.api_key == 'your_stripe_secret_key_here':
            # Mock payment confirmation
            return {'success': True, 'mock': True, 'message': 'Payment confirmed (mock)'}
        
        # Get payment intent from Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status != 'succeeded':
            raise ValueError(f"Payment not successful. Status: {intent.status}")
        
        user_id = intent.metadata.get('user_id')
        course_ids = intent.metadata.get('course_ids', '').split(',')
        
        # Update payment status
        self.supabase.table('payments').update({
            'status': 'succeeded',
            'updated_at': datetime.utcnow().isoformat()
        }).eq('stripe_payment_id', payment_intent_id).execute()
        
        # Create course purchases and grant access
        for course_id in course_ids:
            # Get course price
            course = self.supabase.table('courses').select('price').eq('id', course_id).execute()
            price = course.data[0]['price'] if course.data else 0
            
            # Create purchase record
            purchase_data = {
                'user_id': user_id,
                'course_id': course_id,
                'payment_id': None,  # We can link this if needed
                'price_paid': price,
                'access_granted_at': datetime.utcnow().isoformat(),
                'created_at': datetime.utcnow().isoformat()
            }
            self.supabase.table('course_purchases').upsert(purchase_data).execute()
            
            # Enroll user in course
            enrollment_data = {
                'user_id': user_id,
                'course_id': course_id,
                'enrolled_at': datetime.utcnow().isoformat(),
                'progress': 0,
                'completed': False
            }
            self.supabase.table('enrollments').upsert(enrollment_data).execute()
        
        # Clear cart
        self.clear_cart(user_id)
        
        # Generate invoice
        invoice = self._generate_invoice(user_id, payment_intent_id, course_ids)
        
        return {
            'success': True,
            'message': 'Payment confirmed and courses unlocked',
            'invoice': invoice
        }
    
    def _generate_invoice(self, user_id: str, payment_id: str, course_ids: List[str]) -> Dict:
        """Generate an invoice for the purchase"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        # Get payment details
        payment = self.supabase.table('payments').select('*').eq('stripe_payment_id', payment_id).execute()
        
        if not payment.data:
            return {}
        
        total_amount = sum(p['amount'] for p in payment.data)
        tax = total_amount * 0.1  # 10% tax (example)
        total = total_amount + tax
        
        invoice_number = f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{user_id[:8]}"
        
        invoice_data = {
            'payment_id': payment.data[0]['id'],
            'invoice_number': invoice_number,
            'user_id': user_id,
            'amount': total_amount,
            'tax': tax,
            'total': total,
            'status': 'paid',
            'issued_at': datetime.utcnow().isoformat(),
            'paid_at': datetime.utcnow().isoformat(),
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = self.supabase.table('invoices').insert(invoice_data).execute()
        return result.data[0] if result.data else {}
    
    def get_user_payments(self, user_id: str) -> List[Dict]:
        """Get payment history for a user"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        result = self.supabase.table('payments').select('*, courses(title)').eq('user_id', user_id).order('created_at', desc=True).execute()
        return result.data if result.data else []
    
    def get_user_invoices(self, user_id: str) -> List[Dict]:
        """Get invoices for a user"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        result = self.supabase.table('invoices').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        return result.data if result.data else []
    
    def get_user_purchases(self, user_id: str) -> List[Dict]:
        """Get all course purchases for a user"""
        if not self.supabase:
            raise ValueError("Database not configured")
        
        result = self.supabase.table('course_purchases').select('*, courses(title, thumbnail_url)').eq('user_id', user_id).execute()
        return result.data if result.data else []
    
    def has_purchased_course(self, user_id: str, course_id: str) -> bool:
        """Check if user has purchased a course"""
        if not self.supabase:
            return False
        
        result = self.supabase.table('course_purchases').select('id').eq('user_id', user_id).eq('course_id', course_id).execute()
        return len(result.data) > 0 if result.data else False

# Singleton instance
payment_service = PaymentService()
