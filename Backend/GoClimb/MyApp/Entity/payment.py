from django.db import models
from django.contrib.auth.models import User as DjangoUser
from MyApp.Entity.user import User


class UserPayment(models.Model):
    """Track payment intents to prevent reuse and maintain payment history"""
    
    payment_intent_id = models.CharField(
        max_length=255, 
        unique=True, 
        db_index=True,
        help_text="Stripe PaymentIntent ID"
    )
    amount = models.IntegerField(help_text="Amount in cents")
    currency = models.CharField(max_length=3, default='sgd')
    status = models.CharField(
        max_length=50,
        help_text="Payment status: succeeded, pending, failed, etc."
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='payments'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When this payment was used for signup"
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional payment metadata from Stripe"
    )

    class Meta:
        db_table = 'user_payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['payment_intent_id']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.payment_intent_id} - {self.status} - ${self.amount/100:.2f}"

    @property
    def amount_dollars(self):
        """Return amount in dollars for display"""
        return self.amount / 100

    def mark_as_used(self):
        """Mark this payment as used for signup"""
        from django.utils import timezone
        self.used_at = timezone.now()
        self.save(update_fields=['used_at'])

    def is_used(self):
        """Check if this payment has been used for signup"""
        return self.used_at is not None