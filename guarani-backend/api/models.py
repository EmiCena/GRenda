from django.db import models
from django.conf import settings

class Lesson(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    vocabulary = models.JSONField(default=list, blank=True)
    grammar = models.JSONField(default=list, blank=True)
    exercises = models.JSONField(default=list)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'lessons'
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return self.title

class UserProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='progress')
    lesson_id = models.CharField(max_length=100)
    completed = models.BooleanField(default=False)
    score = models.IntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'lesson_id')
        db_table = 'user_progress'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.lesson_id}"

class Translation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='translations')
    spanish_text = models.TextField()
    guarani_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'translations'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.spanish_text} → {self.guarani_text}"

class ChatHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chats')
    message = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chat_history'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username}: {self.message[:50]}"

class Mascot(models.Model):
    """Mascota del usuario que evoluciona con el progreso"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mascot')
    name = models.CharField(max_length=50, default='Tatú')
    level = models.IntegerField(default=1)
    current_xp = models.IntegerField(default=0)
    total_xp = models.IntegerField(default=0)
    state = models.CharField(
        max_length=20,
        choices=[
            ('happy', 'Feliz'),
            ('celebrating', 'Celebrando'),
            ('sleeping', 'Dormido'),
            ('evolving', 'Evolucionando'),
            ('normal', 'Normal'),
        ],
        default='normal'
    )
    last_interaction = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'mascots'
    
    def __str__(self):
        return f"{self.user.username}'s {self.name} (Nivel {self.level})"
    
    def xp_for_next_level(self):
        """XP necesaria para el siguiente nivel"""
        return 100 * self.level  # Nivel 1->2: 100 XP, Nivel 2->3: 200 XP, etc.
    
    def add_xp(self, amount):
        """Agregar XP y manejar subida de nivel"""
        self.current_xp += amount
        self.total_xp += amount
        
        leveled_up = False
        while self.current_xp >= self.xp_for_next_level():
            self.current_xp -= self.xp_for_next_level()
            self.level += 1
            leveled_up = True
            self.state = 'evolving'
        
        self.save()
        return leveled_up
    
    def get_evolution_stage(self):
        """Etapa de evolución según el nivel"""
        if self.level <= 5:
            return 'baby'
        elif self.level <= 10:
            return 'young'
        elif self.level <= 20:
            return 'adult'
        elif self.level <= 30:
            return 'elder'
        else:
            return 'master'


class Achievement(models.Model):
    """Logros desbloqueables"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='achievements')
    achievement_type = models.CharField(max_length=50)
    title = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=10, default='🏆')
    unlocked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'achievements'
        unique_together = ('user', 'achievement_type')
        ordering = ['-unlocked_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"