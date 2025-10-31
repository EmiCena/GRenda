from rest_framework import serializers
from .models import Lesson, UserProgress, Translation, ChatHistory

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