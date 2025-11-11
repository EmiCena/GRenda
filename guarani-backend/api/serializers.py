from rest_framework import serializers
from .models import (
    Lesson, UserProgress, Translation, ChatHistory, Mascot, 
    Achievement, ExerciseResult, Flashcard,
    UserStreak, DailyChallenge, UserChallengeProgress,
    ActivityLog, StudySession,
    ConversationMode, ChatSession, ChatMessage, GrammarCorrection,
    ConversationChallenge, UserConversationLevel
)


# ==================== LESSONS ====================

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ('id', 'title', 'description', 'vocabulary', 'grammar', 
                  'exercises', 'order', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


# ==================== PROGRESS ====================

class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = ('id', 'lesson_id', 'completed', 'score', 'completed_at', 
                  'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


# ==================== TRANSLATION ====================

class TranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Translation
        fields = ('id', 'spanish_text', 'guarani_text', 'created_at')
        read_only_fields = ('id', 'created_at')


# ==================== CHATBOT (Legacy) ====================

class ChatHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatHistory
        fields = ('id', 'message', 'response', 'created_at')
        read_only_fields = ('id', 'created_at')


# ==================== CHATBOT MEJORADO ====================

class ConversationModeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversationMode
        fields = '__all__'


class GrammarCorrectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrammarCorrection
        fields = ('id', 'original_text', 'corrected_text', 'error_type', 
                  'explanation', 'severity')


class ChatMessageSerializer(serializers.ModelSerializer):
    corrections = GrammarCorrectionSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = (
            'id', 'message', 'response', 'is_user_message',
            'detected_language', 'grammar_corrections', 'word_count',
            'sentiment', 'created_at', 'corrections'
        )
        read_only_fields = ('id', 'created_at')


class ChatSessionSerializer(serializers.ModelSerializer):
    mode_name = serializers.CharField(source='mode.get_name_display', read_only=True)
    mode_icon = serializers.CharField(source='mode.icon', read_only=True)
    messages = ChatMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatSession
        fields = (
            'id', 'mode', 'mode_name', 'mode_icon', 'started_at', 'ended_at',
            'duration_seconds', 'message_count', 'difficulty_level',
            'words_used', 'new_words_learned', 'grammar_errors',
            'pronunciation_score', 'messages'
        )


class ConversationChallengeSerializer(serializers.ModelSerializer):
    mode_name = serializers.CharField(source='mode.get_name_display', read_only=True)
    
    class Meta:
        model = ConversationChallenge
        fields = '__all__'


class UserConversationLevelSerializer(serializers.ModelSerializer):
    overall_score = serializers.SerializerMethodField()
    level_name = serializers.CharField(source='get_current_level_display', read_only=True)
    
    class Meta:
        model = UserConversationLevel
        fields = (
            'current_level', 'level_name', 'total_sessions', 'total_messages',
            'total_time_minutes', 'vocabulary_size', 'grammar_score',
            'vocabulary_score', 'fluency_score', 'comprehension_score',
            'overall_score'
        )
    
    def get_overall_score(self, obj):
        return round(obj.calculate_overall_score(), 1)


# ==================== MASCOT ====================

class MascotSerializer(serializers.ModelSerializer):
    xp_for_next_level = serializers.SerializerMethodField()
    evolution_stage = serializers.SerializerMethodField()
    xp_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Mascot
        fields = ('id', 'name', 'level', 'current_xp', 'total_xp', 'state', 
                  'xp_for_next_level', 'evolution_stage', 'xp_percentage', 
                  'last_interaction', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def get_xp_for_next_level(self, obj):
        return obj.xp_for_next_level()
    
    def get_evolution_stage(self, obj):
        return obj.get_evolution_stage()
    
    def get_xp_percentage(self, obj):
        return int((obj.current_xp / obj.xp_for_next_level()) * 100)


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ('id', 'achievement_type', 'title', 'description', 'icon', 'unlocked_at')
        read_only_fields = ('id', 'unlocked_at')


# ==================== FLASHCARDS ====================

class FlashcardSerializer(serializers.ModelSerializer):
    accuracy = serializers.SerializerMethodField()
    
    class Meta:
        model = Flashcard
        fields = (
            'id', 'spanish_word', 'guarani_word', 'example', 'notes',
            'deck_name', 'is_favorite', 'times_reviewed', 'times_correct',
            'accuracy', 'last_reviewed', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'accuracy')
    
    def get_accuracy(self, obj):
        return obj.accuracy()


class FlashcardReviewSerializer(serializers.Serializer):
    """Para registrar una revisión de flashcard"""
    flashcard_id = serializers.IntegerField()
    is_correct = serializers.BooleanField()


# ==================== STREAK & CHALLENGES ====================

class UserStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStreak
        fields = (
            'current_streak', 'longest_streak', 'last_activity_date',
            'freeze_count', 'total_days_studied'
        )


class DailyChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyChallenge
        fields = '__all__'


class UserChallengeProgressSerializer(serializers.ModelSerializer):
    challenge = DailyChallengeSerializer(read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = UserChallengeProgress
        fields = (
            'id', 'challenge', 'current_value', 'completed',
            'completed_at', 'progress_percentage'
        )
    
    def get_progress_percentage(self, obj):
        if obj.challenge.target_value == 0:
            return 0
        return min(int((obj.current_value / obj.challenge.target_value) * 100), 100)


# ==================== STATS ====================

class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'


class StudySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySession
        fields = '__all__'