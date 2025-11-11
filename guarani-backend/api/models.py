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


# api/models.py (AGREGAR al final)

class ExerciseResult(models.Model):
    """Resultados individuales de ejercicios para análisis detallado"""
    EXERCISE_TYPES = [
        ('MULTIPLE_CHOICE', 'Opción Múltiple'),
        ('TRANSLATION', 'Traducción'),
        ('FILL_IN_THE_BLANK', 'Completar Espacios'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='exercise_results'
    )
    lesson_id = models.CharField(max_length=100)
    exercise_id = models.CharField(max_length=100)
    exercise_type = models.CharField(max_length=20, choices=EXERCISE_TYPES)
    is_correct = models.BooleanField()
    user_answer = models.TextField(blank=True)  # Respuesta del usuario
    correct_answer = models.TextField(blank=True)  # Respuesta correcta
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'exercise_results'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'exercise_type']),
            models.Index(fields=['user', 'lesson_id']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.exercise_type} - {'✓' if self.is_correct else '✗'}"

# api/models.py (AGREGAR AL FINAL)

class Flashcard(models.Model):
    """Tarjetas de estudio personalizadas del usuario"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='flashcards'
    )
    spanish_word = models.CharField(max_length=200)
    guarani_word = models.CharField(max_length=200)
    example = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    deck_name = models.CharField(max_length=100, default='General', blank=True)
    is_favorite = models.BooleanField(default=False)
    times_reviewed = models.IntegerField(default=0)
    times_correct = models.IntegerField(default=0)
    last_reviewed = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'flashcards'
        ordering = ['-created_at']
        unique_together = ('user', 'spanish_word', 'guarani_word')
    
    def __str__(self):
        return f"{self.spanish_word} → {self.guarani_word}"
    
    def accuracy(self):
        """Porcentaje de acierto"""
        if self.times_reviewed == 0:
            return 0
        return int((self.times_correct / self.times_reviewed) * 100)

# api/models.py (AGREGAR al final)

class UserStreak(models.Model):
    """Racha de días estudiados del usuario"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='streak'
    )
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    freeze_count = models.IntegerField(default=0)  # Protección de racha
    total_days_studied = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'user_streaks'
    
    def __str__(self):
        return f"{self.user.username} - {self.current_streak} días"
    
    def update_streak(self):
        """Actualizar racha basado en actividad de hoy"""
        from django.utils import timezone
        today = timezone.now().date()
        
        if not self.last_activity_date:
            # Primera vez
            self.current_streak = 1
            self.longest_streak = 1
            self.total_days_studied = 1
            self.last_activity_date = today
            self.save()
            return True
        
        days_diff = (today - self.last_activity_date).days
        
        if days_diff == 0:
            # Ya estudió hoy
            return False
        elif days_diff == 1:
            # Continuó la racha
            self.current_streak += 1
            self.longest_streak = max(self.longest_streak, self.current_streak)
            self.total_days_studied += 1
            self.last_activity_date = today
            self.save()
            return True
        elif days_diff == 2 and self.freeze_count > 0:
            # Usar freeze
            self.freeze_count -= 1
            self.current_streak += 1
            self.longest_streak = max(self.longest_streak, self.current_streak)
            self.total_days_studied += 1
            self.last_activity_date = today
            self.save()
            return True
        else:
            # Perdió la racha
            self.current_streak = 1
            self.total_days_studied += 1
            self.last_activity_date = today
            self.save()
            return True


class DailyChallenge(models.Model):
    """Desafíos que cambian diariamente"""
    CHALLENGE_TYPES = [
        ('FLASHCARDS', 'Completar Flashcards'),
        ('LESSONS', 'Completar Lecciones'),
        ('CHATBOT', 'Practicar con Chatbot'),
        ('SCORE', 'Obtener Puntaje Alto'),
        ('XP', 'Ganar XP'),
        ('VOCAB', 'Aprender Vocabulario'),
    ]
    
    challenge_type = models.CharField(max_length=20, choices=CHALLENGE_TYPES)
    description = models.CharField(max_length=200)
    target_value = models.IntegerField()
    xp_reward = models.IntegerField(default=50)
    date = models.DateField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'daily_challenges'
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.date} - {self.description}"


class UserChallengeProgress(models.Model):
    """Progreso del usuario en desafíos diarios"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='challenge_progress'
    )
    challenge = models.ForeignKey(DailyChallenge, on_delete=models.CASCADE)
    current_value = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'user_challenge_progress'
        unique_together = ('user', 'challenge')
    
    def __str__(self):
        return f"{self.user.username} - {self.challenge.description}"
    
    def check_completion(self):
        """Verificar si se completó el desafío"""
        if not self.completed and self.current_value >= self.challenge.target_value:
            from django.utils import timezone
            self.completed = True
            self.completed_at = timezone.now()
            
            # Dar recompensa en XP
            self.user.total_xp += self.challenge.xp_reward
            self.user.save()
            
            # Actualizar mascota
            mascot, _ = Mascot.objects.get_or_create(user=self.user)
            mascot.add_xp(self.challenge.xp_reward)
            
            self.save()
            return True
        return False


class StudySession(models.Model):
    """Sesiones de estudio para tracking de tiempo"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='study_sessions'
    )
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(default=0)
    activity_type = models.CharField(max_length=50)  # lesson, flashcards, chatbot
    lesson_id = models.CharField(max_length=100, null=True, blank=True)
    
    class Meta:
        db_table = 'study_sessions'
        ordering = ['-start_time']
    
    def __str__(self):
        return f"{self.user.username} - {self.start_time.date()} ({self.duration_minutes}min)"
    
    def end_session(self):
        """Finalizar sesión y calcular duración"""
        from django.utils import timezone
        self.end_time = timezone.now()
        delta = self.end_time - self.start_time
        self.duration_minutes = int(delta.total_seconds() / 60)
        self.save()


class ActivityLog(models.Model):
    """Log de actividades para el heatmap"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='activity_logs'
    )
    date = models.DateField()
    lessons_completed = models.IntegerField(default=0)
    flashcards_reviewed = models.IntegerField(default=0)
    chatbot_messages = models.IntegerField(default=0)
    time_studied_minutes = models.IntegerField(default=0)
    xp_earned = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'activity_logs'
        unique_together = ('user', 'date')
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.user.username} - {self.date}"
    
    @staticmethod
    def log_activity(user, activity_type, value=1, xp=0):
        """Registrar actividad del día"""
        from django.utils import timezone
        today = timezone.now().date()
        
        log, created = ActivityLog.objects.get_or_create(
            user=user,
            date=today
        )
        
        if activity_type == 'lesson':
            log.lessons_completed += value
        elif activity_type == 'flashcard':
            log.flashcards_reviewed += value
        elif activity_type == 'chatbot':
            log.chatbot_messages += value
        elif activity_type == 'time':
            log.time_studied_minutes += value
        
        log.xp_earned += xp
        log.save()
        
        # Actualizar racha
        streak, _ = UserStreak.objects.get_or_create(user=user)
        streak.update_streak()

# api/models.py (AGREGAR al final)

class ConversationMode(models.Model):
    """Modos de conversación temáticos"""
    MODE_CHOICES = [
        ('FREE', 'Conversación Libre'),
        ('MARKET', 'En el Mercado'),
        ('GREETINGS', 'Saludos y Presentaciones'),
        ('RESTAURANT', 'En el Restaurante'),
        ('EMERGENCY', 'Emergencias'),
        ('HOME', 'En Casa'),
        ('CELEBRATION', 'Celebraciones'),
    ]
    
    name = models.CharField(max_length=50, choices=MODE_CHOICES, unique=True)
    icon = models.CharField(max_length=10, default='💬')
    description = models.TextField()
    system_prompt = models.TextField()
    example_phrases = models.JSONField(default=list)
    difficulty_level = models.CharField(max_length=20, default='beginner')
    
    class Meta:
        db_table = 'conversation_modes'
    
    def __str__(self):
        return self.get_name_display()


class ChatSession(models.Model):
    """Sesión de chat completa"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_sessions'
    )
    mode = models.ForeignKey(
        ConversationMode,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    message_count = models.IntegerField(default=0)
    difficulty_level = models.CharField(max_length=20, default='beginner')
    
    # Estadísticas de la sesión
    words_used = models.IntegerField(default=0)
    new_words_learned = models.JSONField(default=list)
    grammar_errors = models.IntegerField(default=0)
    pronunciation_score = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'chat_sessions'
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.started_at.date()}"
    
    def end_session(self):
        """Finalizar sesión y calcular duración"""
        from django.utils import timezone
        self.ended_at = timezone.now()
        delta = self.ended_at - self.started_at
        self.duration_seconds = int(delta.total_seconds())
        self.save()


class ChatMessage(models.Model):
    """Mensajes individuales del chat (reemplaza ChatHistory)"""
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages',
        null=True,
        blank=True
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_messages'
    )
    message = models.TextField()
    response = models.TextField()
    is_user_message = models.BooleanField(default=True)
    
    # Análisis del mensaje
    detected_language = models.CharField(max_length=10, default='es')
    grammar_corrections = models.JSONField(default=list, blank=True)
    word_count = models.IntegerField(default=0)
    sentiment = models.CharField(max_length=20, default='neutral')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.username}: {self.message[:50]}"


class GrammarCorrection(models.Model):
    """Correcciones gramaticales sugeridas"""
    message = models.ForeignKey(
        ChatMessage,
        on_delete=models.CASCADE,
        related_name='corrections'
    )
    original_text = models.TextField()
    corrected_text = models.TextField()
    error_type = models.CharField(max_length=50)  # verb, article, preposition, etc.
    explanation = models.TextField()
    severity = models.CharField(
        max_length=20,
        choices=[('low', 'Leve'), ('medium', 'Media'), ('high', 'Alta')],
        default='medium'
    )
    
    class Meta:
        db_table = 'grammar_corrections'
    
    def __str__(self):
        return f"{self.error_type}: {self.original_text[:30]}"


class ConversationChallenge(models.Model):
    """Desafíos específicos de conversación"""
    CHALLENGE_TYPES = [
        ('TURNS', 'Mantener X turnos de conversación'),
        ('VERBS', 'Usar X verbos diferentes'),
        ('TOPIC', 'Hablar sobre un tema específico'),
        ('TRANSLATE', 'Traducir X frases correctamente'),
        ('QUESTIONS', 'Hacer X preguntas'),
    ]
    
    challenge_type = models.CharField(max_length=20, choices=CHALLENGE_TYPES)
    description = models.CharField(max_length=200)
    target_value = models.IntegerField()
    xp_reward = models.IntegerField(default=30)
    difficulty = models.CharField(max_length=20, default='beginner')
    mode = models.ForeignKey(
        ConversationMode,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'conversation_challenges'
    
    def __str__(self):
        return self.description


class UserConversationLevel(models.Model):
    """Nivel de conversación del usuario"""
    LEVELS = [
        ('A1', 'Principiante'),
        ('A2', 'Elemental'),
        ('B1', 'Intermedio'),
        ('B2', 'Intermedio Alto'),
        ('C1', 'Avanzado'),
        ('C2', 'Maestría'),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversation_level'
    )
    current_level = models.CharField(max_length=2, choices=LEVELS, default='A1')
    total_sessions = models.IntegerField(default=0)
    total_messages = models.IntegerField(default=0)
    total_time_minutes = models.IntegerField(default=0)
    vocabulary_size = models.IntegerField(default=0)
    
    # Evaluación por habilidad
    grammar_score = models.FloatField(default=0.0)
    vocabulary_score = models.FloatField(default=0.0)
    fluency_score = models.FloatField(default=0.0)
    comprehension_score = models.FloatField(default=0.0)
    
    class Meta:
        db_table = 'user_conversation_levels'
    
    def __str__(self):
        return f"{self.user.username} - {self.get_current_level_display()}"
    
    def calculate_overall_score(self):
        """Calcular puntaje general"""
        return (
            self.grammar_score * 0.3 +
            self.vocabulary_score * 0.25 +
            self.fluency_score * 0.25 +
            self.comprehension_score * 0.2
        )