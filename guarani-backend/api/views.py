from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from django.conf import settings
import google.generativeai as genai

from .models import Lesson, UserProgress, Translation, ChatHistory
from .serializers import (
    LessonSerializer, 
    UserProgressSerializer, 
    TranslationSerializer, 
    ChatHistorySerializer
)

# Configurar Gemini
genai.configure(api_key=settings.GOOGLE_API_KEY)

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Solo admins pueden crear/editar/eliminar
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

class ProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Obtener todo el progreso del usuario"""
        progress = UserProgress.objects.filter(user=request.user)
        serializer = UserProgressSerializer(progress, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Crear o actualizar progreso de una lección"""
        lesson_id = request.data.get('lesson_id')
        score = request.data.get('score', 0)
        completed = request.data.get('completed', False)
        
        if not lesson_id:
            return Response(
                {'error': 'lesson_id es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Actualizar o crear
        progress, created = UserProgress.objects.update_or_create(
            user=request.user,
            lesson_id=lesson_id,
            defaults={
                'score': score,
                'completed': completed,
                'completed_at': timezone.now() if completed else None,
            }
        )
        
        serializer = UserProgressSerializer(progress)
        return Response(serializer.data, status=status.HTTP_200_OK)

class TranslateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get('text', '')
        
        if not text.strip():
            return Response({'error': 'Texto vacío'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            prompt = f"""Translate the following Spanish word or phrase to Guaraní. 
Provide ONLY the Guaraní translation.

Spanish phrase: "{text}"

Guaraní translation:"""
            
            response = model.generate_content(prompt)
            guarani_text = response.text.strip()
            
            # Guardar en base de datos
            translation = Translation.objects.create(
                user=request.user,
                spanish_text=text,
                guarani_text=guarani_text
            )
            
            serializer = TranslationSerializer(translation)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get(self, request):
        """Obtener historial de traducciones del usuario"""
        translations = Translation.objects.filter(user=request.user)[:20]
        serializer = TranslationSerializer(translations, many=True)
        return Response(serializer.data)

class ChatbotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '')
        
        if not message.strip():
            return Response({'error': 'Mensaje vacío'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            model = genai.GenerativeModel(
                'gemini-2.0-flash-exp',
                system_instruction="You are a friendly and encouraging Guaraní teacher named 'Arami'. Your goal is to help the user practice their Guaraní in a conversational way. Keep your responses short, friendly, and primarily in Spanish but sprinkle in simple Guaraní words and phrases."
            )
            
            chat = model.start_chat()
            response = chat.send_message(message)
            bot_response = response.text.strip()
            
            # Guardar en historial
            chat_history = ChatHistory.objects.create(
                user=request.user,
                message=message,
                response=bot_response
            )
            
            serializer = ChatHistorySerializer(chat_history)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get(self, request):
        """Obtener historial de chat del usuario"""
        chats = ChatHistory.objects.filter(user=request.user)[:20]
        serializer = ChatHistorySerializer(chats, many=True)
        return Response(serializer.data)