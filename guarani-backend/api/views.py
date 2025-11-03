from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from django.conf import settings
import google.generativeai as genai

from .models import Lesson, UserProgress, Translation, ChatHistory, Mascot, Achievement
from .serializers import (
    LessonSerializer, 
    UserProgressSerializer, 
    TranslationSerializer, 
    ChatHistorySerializer,
    MascotSerializer,
    AchievementSerializer
)

# Configurar Gemini (SOLO SI HAY API KEY)
if hasattr(settings, 'GOOGLE_API_KEY') and settings.GOOGLE_API_KEY:
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
        
        # ⭐ DAR XP AL COMPLETAR LECCIÓN
        if completed:
            mascot, _ = Mascot.objects.get_or_create(user=request.user)
            xp_earned = 50  # XP por lección completada
            if score >= 90:
                xp_earned = 75  # Bonus por excelencia
            mascot.add_xp(xp_earned)
            mascot.state = 'celebrating'
            mascot.save()
            
            # Verificar logros
            check_and_unlock_achievements(request.user)
        
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


class MascotView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Obtener o crear la mascota del usuario"""
        mascot, created = Mascot.objects.get_or_create(user=request.user)
        
        # Actualizar estado según última interacción
        from datetime import timedelta
        if timezone.now() - mascot.last_interaction > timedelta(days=2):
            mascot.state = 'sleeping'
            mascot.save()
        elif mascot.state == 'sleeping':
            mascot.state = 'happy'
            mascot.save()
        
        serializer = MascotSerializer(mascot)
        return Response(serializer.data)
    
    def patch(self, request):
        """Actualizar mascota (nombre, estado)"""
        mascot = Mascot.objects.get(user=request.user)
        
        name = request.data.get('name')
        state = request.data.get('state')
        
        if name:
            mascot.name = name
        if state:
            mascot.state = state
        
        mascot.save()
        serializer = MascotSerializer(mascot)
        return Response(serializer.data)


class AchievementsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Obtener logros del usuario"""
        achievements = Achievement.objects.filter(user=request.user)
        serializer = AchievementSerializer(achievements, many=True)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_xp(request):
    """Agregar XP a la mascota (se llama al completar lecciones)"""
    amount = request.data.get('amount', 0)
    
    if amount <= 0:
        return Response({'error': 'Amount debe ser positivo'}, status=status.HTTP_400_BAD_REQUEST)
    
    mascot, created = Mascot.objects.get_or_create(user=request.user)
    leveled_up = mascot.add_xp(amount)
    
    # Verificar logros
    check_and_unlock_achievements(request.user)
    
    return Response({
        'mascot': MascotSerializer(mascot).data,
        'leveled_up': leveled_up,
        'message': f"¡Ganaste {amount} XP!" + (" ¡Subiste de nivel! 🎉" if leveled_up else "")
    })


def check_and_unlock_achievements(user):
    """Verificar y desbloquear logros"""
    # Logro: Primera lección
    completed_count = UserProgress.objects.filter(user=user, completed=True).count()
    if completed_count == 1:
        Achievement.objects.get_or_create(
            user=user,
            achievement_type='first_lesson',
            defaults={
                'title': 'Primera Lección',
                'description': '¡Completaste tu primera lección!',
                'icon': '🎓'
            }
        )
    
    # Logro: 5 lecciones
    if completed_count == 5:
        Achievement.objects.get_or_create(
            user=user,
            achievement_type='five_lessons',
            defaults={
                'title': 'Estudiante Dedicado',
                'description': '¡Completaste 5 lecciones!',
                'icon': '📚'
            }
        )
    
    # Logro: 10 lecciones
    if completed_count == 10:
        Achievement.objects.get_or_create(
            user=user,
            achievement_type='ten_lessons',
            defaults={
                'title': 'Maestro del Guaraní',
                'description': '¡Completaste 10 lecciones!',
                'icon': '🏆'
            }
        )
    
    # Logro: Racha de 7 días
    if user.streak_days >= 7:
        Achievement.objects.get_or_create(
            user=user,
            achievement_type='week_streak',
            defaults={
                'title': 'Racha Semanal',
                'description': '¡7 días seguidos practicando!',
                'icon': '🔥'
            }
        )