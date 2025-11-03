from rest_framework import serializers
from .models import Lesson, UserProgress, Translation, ChatHistory, Mascot, Achievement

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ('id', 'title', 'description', 'vocabulary', 'grammar', 
                  'exercises', 'order', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')

class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = ('id', 'lesson_id', 'completed', 'score', 'completed_at', 
                  'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class TranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Translation
        fields = ('id', 'spanish_text', 'guarani_text', 'created_at')
        read_only_fields = ('id', 'created_at')

class ChatHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatHistory
        fields = ('id', 'message', 'response', 'created_at')
        read_only_fields = ('id', 'created_at')

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