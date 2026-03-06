from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

from simple_history.models import HistoricalRecords

class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        CHAIRMAN = 'CHAIRMAN', _('Chairman')
        PRINCIPAL = 'PRINCIPAL', _('Principal')
        ACCOUNT_OFFICER = 'ACCOUNT_OFFICER', _('Account Officer')
        CASHIER = 'CASHIER', _('Cashier')
        TEACHER = 'TEACHER', _('Teacher')
        SUPER_ADMIN = 'SUPER_ADMIN', _('Super Admin')

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.TEACHER,
    )
    
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
