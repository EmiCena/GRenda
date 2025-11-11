from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from django.conf import settings
from django.db import models
import google.generativeai as genai

from .models import (
    Lesson, UserProgress, Translation, ChatHistory, Mascot, 
    Achievement, ExerciseResult, Flashcard,
    UserStreak, DailyChallenge, UserChallengeProgress,
    ActivityLog, StudySession,
    ConversationMode, ChatSession, ChatMessage, GrammarCorrection,
    ConversationChallenge, UserConversationLevel
)

from .serializers import (
    LessonSerializer, 
    UserProgressSerializer, 
    TranslationSerializer, 
    ChatHistorySerializer,
    MascotSerializer,
    AchievementSerializer,
    FlashcardSerializer,
    FlashcardReviewSerializer,
    UserStreakSerializer,
    DailyChallengeSerializer,
    UserChallengeProgressSerializer,
    ActivityLogSerializer,
    StudySessionSerializer,
    ConversationModeSerializer,
    ChatSessionSerializer,
    ChatMessageSerializer,
    GrammarCorrectionSerializer,
    ConversationChallengeSerializer,
    UserConversationLevelSerializer,
)

# Configurar Gemini (SOLO SI HAY API KEY)
if hasattr(settings, 'GOOGLE_API_KEY') and settings.GOOGLE_API_KEY:
    genai.configure(api_key=settings.GOOGLE_API_KEY)


# ==================== LESSONS ====================

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Solo admins pueden crear/editar/eliminar
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]


# ==================== PROGRESS ====================

class ProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Obtener todo el progreso del usuario"""
        progress = UserProgress.objects.filter(user=request.user)
        serializer = UserProgressSerializer(progress, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Crear o actualizar progreso de una lección CON resultados detallados"""
        lesson_id = request.data.get('lesson_id')
        score = request.data.get('score', 0)
        completed = request.data.get('completed', False)
        exercise_results = request.data.get('exercise_results', [])
        
        if not lesson_id:
            return Response(
                {'error': 'lesson_id es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Actualizar o crear progreso general
        progress, created = UserProgress.objects.update_or_create(
            user=request.user,
            lesson_id=lesson_id,
            defaults={
                'score': score,
                'completed': completed,
                'completed_at': timezone.now() if completed else None,
            }
        )
        
        # Guardar resultados individuales de ejercicios
        if exercise_results:
            for result_data in exercise_results:
                ExerciseResult.objects.create(
                    user=request.user,
                    lesson_id=lesson_id,
                    exercise_id=result_data.get('exercise_id'),
                    exercise_type=result_data.get('exercise_type'),
                    is_correct=result_data.get('is_correct'),
                    user_answer=result_data.get('user_answer', ''),
                    correct_answer=result_data.get('correct_answer', ''),
                )
        
        # DAR XP AL COMPLETAR LECCIÓN
        if completed:
            mascot, _ = Mascot.objects.get_or_create(user=request.user)
            xp_earned = 50
            if score >= 90:
                xp_earned = 75
            mascot.add_xp(xp_earned)
            mascot.state = 'celebrating'
            mascot.save()
            
            # Actualizar racha
            streak, _ = UserStreak.objects.get_or_create(user=request.user)
            streak.update_streak()
            
            # Registrar actividad
            ActivityLog.log_activity(
                user=request.user,
                activity_type='lesson',
                value=1,
                xp=xp_earned
            )
            
            # Verificar logros
            check_and_unlock_achievements(request.user)
        
        serializer = UserProgressSerializer(progress)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==================== TRANSLATION ====================

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


# ==================== CHATBOT MEJORADO ====================

class ConversationModesView(APIView):
    """Obtener todos los modos de conversación disponibles"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        modes = ConversationMode.objects.all()
        serializer = ConversationModeSerializer(modes, many=True)
        return Response(serializer.data)


class ChatbotView(APIView):
    """Chatbot mejorado con análisis y correcciones"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '')
        mode_id = request.data.get('mode_id')
        session_id = request.data.get('session_id')
        difficulty_level = request.data.get('difficulty_level', 'beginner')
        
        if not message.strip():
            return Response(
                {'error': 'Mensaje vacío'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Obtener o crear sesión
            if session_id:
                try:
                    session = ChatSession.objects.get(
                        id=session_id,
                        user=request.user,
                        ended_at__isnull=True
                    )
                except ChatSession.DoesNotExist:
                    session = self._create_new_session(
                        request.user,
                        mode_id,
                        difficulty_level
                    )
            else:
                session = self._create_new_session(
                    request.user,
                    mode_id,
                    difficulty_level
                )
            
            # Obtener modo de conversación
            mode = None
            if mode_id:
                try:
                    mode = ConversationMode.objects.get(id=mode_id)
                except ConversationMode.DoesNotExist:
                    pass
            
            # Construir system instruction basado en modo y nivel
            system_instruction = self._build_system_instruction(
                mode,
                difficulty_level
            )
            
            # Generar respuesta con Gemini
            model = genai.GenerativeModel(
                'gemini-2.0-flash-exp',
                system_instruction=system_instruction
            )
            
            # Incluir historial de la sesión para contexto
            chat_history = self._get_session_history(session)
            chat = model.start_chat(history=chat_history)
            
            response = chat.send_message(message)
            bot_response = response.text.strip()
            
            # Analizar mensaje del usuario (detección de errores)
            grammar_analysis = self._analyze_grammar(message, model)
            
            # Guardar mensaje
            chat_message = ChatMessage.objects.create(
                session=session,
                user=request.user,
                message=message,
                response=bot_response,
                word_count=len(message.split()),
                grammar_corrections=grammar_analysis.get('corrections', [])
            )
            
            # Guardar correcciones detalladas
            for correction in grammar_analysis.get('corrections', []):
                GrammarCorrection.objects.create(
                    message=chat_message,
                    original_text=correction.get('original', ''),
                    corrected_text=correction.get('corrected', ''),
                    error_type=correction.get('type', 'general'),
                    explanation=correction.get('explanation', ''),
                    severity=correction.get('severity', 'medium')
                )
            
            # Actualizar estadísticas de sesión
            session.message_count += 1
            session.save()
            
            # Actualizar nivel de conversación del usuario
            self._update_user_level(request.user, chat_message)
            
            # Actualizar desafío de chatbot
            try:
                from .views import apiUpdateChallengeProgress
                # Esto se manejará desde el frontend
            except:
                pass
            
            serializer = ChatMessageSerializer(chat_message)
            return Response({
                **serializer.data,
                'session_id': session.id,
                'has_corrections': len(grammar_analysis.get('corrections', [])) > 0
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _create_new_session(self, user, mode_id, difficulty_level):
        """Crear nueva sesión de chat"""
        mode = None
        if mode_id:
            try:
                mode = ConversationMode.objects.get(id=mode_id)
            except ConversationMode.DoesNotExist:
                pass
        
        return ChatSession.objects.create(
            user=user,
            mode=mode,
            difficulty_level=difficulty_level
        )
    
    def _build_system_instruction(self, mode, difficulty_level):
        """Construir instrucciones del sistema según modo y nivel"""
        base_instruction = """Eres Arami, una tutora amigable y alentadora de idioma Guaraní. 
Tu objetivo es ayudar al usuario a practicar Guaraní de manera conversacional."""
        
        # Ajustar según nivel
        level_instructions = {
            'beginner': """
- Usa frases simples y cortas
- Proporciona traducciones frecuentes
- Sé muy alentador con cada intento
- Introduce vocabulario básico gradualmente
""",
            'intermediate': """
- Usa frases de complejidad media
- Proporciona traducciones solo cuando sea necesario
- Introduce modismos y expresiones comunes
- Correcciones suaves pero claras
""",
            'advanced': """
- Usa lenguaje natural y complejo
- Pocas traducciones, enfócate en Guaraní
- Introduce cultura y contexto profundo
- Correcciones directas pero constructivas
"""
        }
        
        instruction = base_instruction + level_instructions.get(
            difficulty_level,
            level_instructions['beginner']
        )
        
        # Agregar contexto del modo
        if mode:
            instruction += f"\n\nMODO ACTUAL: {mode.get_name_display()}\n{mode.system_prompt}"
        
        return instruction
    
    def _get_session_history(self, session):
        """Obtener historial de mensajes de la sesión para contexto"""
        messages = session.messages.order_by('created_at')[:10]
        history = []
        
        for msg in messages:
            history.append({
                'role': 'user',
                'parts': [msg.message]
            })
            history.append({
                'role': 'model',
                'parts': [msg.response]
            })
        
        return history
    
    def _analyze_grammar(self, message, model):
        """Analizar gramática y detectar errores"""
        # Detectar si el mensaje contiene Guaraní
        has_guarani = any(char in message for char in ['ã', 'ẽ', 'ĩ', 'ỹ', 'õ', 'ũ'])
        
        if not has_guarani:
            return {'corrections': []}
        
        try:
            analysis_prompt = f"""Analiza el siguiente texto en Guaraní y detecta errores gramaticales.
Proporciona la respuesta en formato JSON:

Texto: "{message}"

Formato de respuesta:
{{
  "corrections": [
    {{
      "original": "texto con error",
      "corrected": "texto corregido",
      "type": "verb|article|preposition|spelling|other",
      "explanation": "explicación del error",
      "severity": "low|medium|high"
    }}
  ]
}}

Si no hay errores, devuelve: {{"corrections": []}}
"""
            
            response = model.generate_content(analysis_prompt)
            import json
            
            # Extraer JSON de la respuesta
            response_text = response.text.strip()
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0]
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0]
            
            return json.loads(response_text)
        except Exception as e:
            print(f"Error analyzing grammar: {e}")
            return {'corrections': []}
    
    def _update_user_level(self, user, message):
        """Actualizar nivel de conversación del usuario"""
        level, created = UserConversationLevel.objects.get_or_create(user=user)
        
        level.total_messages += 1
        
        # Incrementar score si no tiene errores
        if len(message.grammar_corrections) == 0:
            level.grammar_score = min(100, level.grammar_score + 0.5)
        
        # Incrementar vocabulario
        level.vocabulary_size += max(0, message.word_count - 2)
        
        level.save()


class ChatSessionDetailView(APIView):
    """Ver detalles de una sesión específica"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, session_id):
        try:
            session = ChatSession.objects.get(
                id=session_id,
                user=request.user
            )
            serializer = ChatSessionSerializer(session)
            return Response(serializer.data)
        except ChatSession.DoesNotExist:
            return Response(
                {'error': 'Sesión no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )


class ChatSessionListView(APIView):
    """Listar todas las sesiones del usuario"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        sessions = ChatSession.objects.filter(user=request.user)[:20]
        serializer = ChatSessionSerializer(sessions, many=True)
        return Response(serializer.data)


class EndChatSessionView(APIView):
    """Finalizar sesión y obtener análisis"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        session_id = request.data.get('session_id')
        
        try:
            session = ChatSession.objects.get(
                id=session_id,
                user=request.user,
                ended_at__isnull=True
            )
            
            session.end_session()
            
            # Calcular estadísticas finales
            messages = session.messages.all()
            session.words_used = sum(msg.word_count for msg in messages)
            session.grammar_errors = sum(
                len(msg.grammar_corrections) for msg in messages
            )
            session.save()
            
            # Generar análisis
            analysis = self._generate_session_analysis(session)
            
            serializer = ChatSessionSerializer(session)
            return Response({
                'session': serializer.data,
                'analysis': analysis
            })
        except ChatSession.DoesNotExist:
            return Response(
                {'error': 'Sesión no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def _generate_session_analysis(self, session):
        """Generar análisis de la sesión"""
        messages = session.messages.all()
        
        # Palabras más usadas
        all_words = []
        for msg in messages:
            all_words.extend(msg.message.lower().split())
        
        from collections import Counter
        word_freq = Counter(all_words).most_common(10)
        
        # Tipos de errores
        error_types = Counter()
        for msg in messages:
            for correction in msg.corrections.all():
                error_types[correction.error_type] += 1
        
        return {
            'duration_minutes': round(session.duration_seconds / 60, 1),
            'messages_sent': session.message_count,
            'words_used': session.words_used,
            'grammar_errors': session.grammar_errors,
            'accuracy_rate': round(
                ((session.message_count - session.grammar_errors) / session.message_count * 100)
                if session.message_count > 0 else 0,
                1
            ),
            'most_common_words': [word for word, _ in word_freq],
            'error_breakdown': dict(error_types),
            'performance': self._calculate_performance(session)
        }
    
    def _calculate_performance(self, session):
        """Calcular performance general"""
        if session.message_count == 0:
            return 'beginner'
        
        accuracy = (session.message_count - session.grammar_errors) / session.message_count
        
        if accuracy >= 0.9 and session.message_count >= 10:
            return 'excellent'
        elif accuracy >= 0.75:
            return 'good'
        elif accuracy >= 0.5:
            return 'fair'
        else:
            return 'needs_improvement'


class UserConversationStatsView(APIView):
    """Estadísticas generales de conversación del usuario"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        level, created = UserConversationLevel.objects.get_or_create(
            user=request.user
        )
        
        # Actualizar estadísticas generales
        sessions = ChatSession.objects.filter(user=request.user)
        level.total_sessions = sessions.count()
        level.total_messages = sum(s.message_count for s in sessions)
        level.total_time_minutes = sum(s.duration_seconds for s in sessions) // 60
        level.save()
        
        serializer = UserConversationLevelSerializer(level)
        return Response(serializer.data)


# ==================== MASCOT ====================

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
    """Agregar XP a la mascota"""
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


# ==================== ANALYTICS ====================

class WeaknessAnalysisView(APIView):
    """Análisis de puntos débiles por tipo de ejercicio"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from django.db.models import Count, Q, Avg
        
        user = request.user
        
        # Calcular estadísticas por tipo de ejercicio
        stats = []
        exercise_types = [
            ('MULTIPLE_CHOICE', 'Opción Múltiple', '✅'),
            ('TRANSLATION', 'Traducción', '🔄'),
            ('FILL_IN_THE_BLANK', 'Completar Espacios', '✍️'),
        ]
        
        for ex_type, display_name, icon in exercise_types:
            results = ExerciseResult.objects.filter(
                user=user,
                exercise_type=ex_type
            )
            
            total = results.count()
            if total == 0:
                continue
            
            correct = results.filter(is_correct=True).count()
            accuracy = int((correct / total) * 100) if total > 0 else 0
            
            stats.append({
                'type': ex_type,
                'display_name': display_name,
                'icon': icon,
                'total_attempts': total,
                'correct_answers': correct,
                'accuracy': accuracy,
                'recent_attempts': list(results[:5].values(
                    'exercise_id', 'is_correct', 'created_at'
                ))
            })
        
        # Ordenar por peor rendimiento primero
        stats.sort(key=lambda x: x['accuracy'])
        
        # Análisis de traducción
        translation_results = ExerciseResult.objects.filter(
            user=user,
            exercise_type='TRANSLATION'
        )
        
        es_to_gn = translation_results.filter(
            Q(correct_answer__icontains='ã') | 
            Q(correct_answer__icontains='ẽ') |
            Q(correct_answer__icontains='ĩ') |
            Q(correct_answer__icontains="'")
        )
        gn_to_es = translation_results.exclude(
            Q(correct_answer__icontains='ã') | 
            Q(correct_answer__icontains='ẽ') |
            Q(correct_answer__icontains='ĩ') |
            Q(correct_answer__icontains="'")
        )
        
        translation_breakdown = []
        
        if es_to_gn.exists():
            total_es_gn = es_to_gn.count()
            correct_es_gn = es_to_gn.filter(is_correct=True).count()
            translation_breakdown.append({
                'type': 'ES_TO_GN',
                'display_name': 'Español → Guaraní',
                'icon': '🇪🇸→🇵🇾',
                'total_attempts': total_es_gn,
                'correct_answers': correct_es_gn,
                'accuracy': int((correct_es_gn / total_es_gn) * 100)
            })
        
        if gn_to_es.exists():
            total_gn_es = gn_to_es.count()
            correct_gn_es = gn_to_es.filter(is_correct=True).count()
            translation_breakdown.append({
                'type': 'GN_TO_ES',
                'display_name': 'Guaraní → Español',
                'icon': '🇵🇾→🇪🇸',
                'total_attempts': total_gn_es,
                'correct_answers': correct_gn_es,
                'accuracy': int((correct_gn_es / total_gn_es) * 100)
            })
        
        return Response({
            'overall_stats': stats,
            'translation_breakdown': translation_breakdown,
            'total_exercises_completed': ExerciseResult.objects.filter(user=user).count(),
        })


# ==================== FLASHCARDS ====================

class FlashcardViewSet(viewsets.ModelViewSet):
    """CRUD completo de flashcards del usuario"""
    serializer_class = FlashcardSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Solo flashcards del usuario actual"""
        queryset = Flashcard.objects.filter(user=self.request.user)
        
        # Filtros opcionales
        deck = self.request.query_params.get('deck', None)
        favorites = self.request.query_params.get('favorites', None)
        
        if deck:
            queryset = queryset.filter(deck_name=deck)
        if favorites == 'true':
            queryset = queryset.filter(is_favorite=True)
        
        return queryset
    
    def perform_create(self, serializer):
        """Asignar usuario automáticamente"""
        serializer.save(user=self.request.user)


class FlashcardReviewView(APIView):
    """Registrar revisión de una flashcard"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        flashcard_id = request.data.get('flashcard_id')
        is_correct = request.data.get('is_correct')
        
        try:
            flashcard = Flashcard.objects.get(id=flashcard_id, user=request.user)
        except Flashcard.DoesNotExist:
            return Response({'error': 'Flashcard no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        # Actualizar estadísticas
        flashcard.times_reviewed += 1
        if is_correct:
            flashcard.times_correct += 1
        flashcard.last_reviewed = timezone.now()
        flashcard.save()
        
        # Registrar actividad
        ActivityLog.log_activity(
            user=request.user,
            activity_type='flashcard',
            value=1
        )
        
        return Response(FlashcardSerializer(flashcard).data)


class FlashcardBulkCreateView(APIView):
    """Crear múltiples flashcards de una vez"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        flashcards_data = request.data.get('flashcards', [])
        
        if not flashcards_data:
            return Response({'error': 'No se enviaron flashcards'}, status=status.HTTP_400_BAD_REQUEST)
        
        created = []
        errors = []
        
        for item in flashcards_data:
            # Evitar duplicados
            exists = Flashcard.objects.filter(
                user=request.user,
                spanish_word=item.get('spanish_word'),
                guarani_word=item.get('guarani_word')
            ).exists()
            
            if exists:
                errors.append(f"{item.get('spanish_word')} ya existe")
                continue
            
            flashcard = Flashcard.objects.create(
                user=request.user,
                spanish_word=item.get('spanish_word', ''),
                guarani_word=item.get('guarani_word', ''),
                example=item.get('example', ''),
                deck_name=item.get('deck_name', 'General')
            )
            created.append(FlashcardSerializer(flashcard).data)
        
        return Response({
            'created': len(created),
            'errors': errors,
            'flashcards': created
        })


class FlashcardDecksView(APIView):
    """Obtener lista de mazos del usuario"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        decks = Flashcard.objects.filter(user=request.user).values('deck_name').annotate(
            count=models.Count('id')
        ).order_by('deck_name')
        
        return Response(list(decks))


# ==================== STREAK & CHALLENGES ====================

class StreakView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        streak, created = UserStreak.objects.get_or_create(user=request.user)
        serializer = UserStreakSerializer(streak)
        return Response(serializer.data)


class DailyChallengesView(APIView):
    """Obtener desafíos del día"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        today = timezone.now().date()
        
        # Crear desafíos si no existen para hoy
        if not DailyChallenge.objects.filter(date=today).exists():
            create_daily_challenges(today)
        
        # Obtener desafíos de hoy
        challenges = DailyChallenge.objects.filter(date=today, is_active=True)
        
        # Obtener progreso del usuario
        progress_data = []
        for challenge in challenges:
            progress, _ = UserChallengeProgress.objects.get_or_create(
                user=request.user,
                challenge=challenge
            )
            progress_data.append(UserChallengeProgressSerializer(progress).data)
        
        return Response(progress_data)


class UpdateChallengeProgressView(APIView):
    """Actualizar progreso de un desafío"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        challenge_type = request.data.get('challenge_type')
        increment = request.data.get('increment', 1)
        
        today = timezone.now().date()
        
        try:
            challenge = DailyChallenge.objects.get(
                date=today,
                challenge_type=challenge_type,
                is_active=True
            )
        except DailyChallenge.DoesNotExist:
            return Response({'error': 'Desafío no encontrado'}, status=404)
        
        progress, _ = UserChallengeProgress.objects.get_or_create(
            user=request.user,
            challenge=challenge
        )
        
        progress.current_value += increment
        progress.save()
        
        completed = progress.check_completion()
        
        return Response({
            'progress': UserChallengeProgressSerializer(progress).data,
            'completed': completed
        })


# ==================== STATS ====================

class ActivityHeatmapView(APIView):
    """Obtener datos para heatmap de actividad"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from datetime import timedelta
        
        # Últimos 365 días
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=365)
        
        logs = ActivityLog.objects.filter(
            user=request.user,
            date__gte=start_date,
            date__lte=end_date
        )
        
        serializer = ActivityLogSerializer(logs, many=True)
        return Response(serializer.data)


class StudyStatsView(APIView):
    """Estadísticas de estudio avanzadas"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from datetime import timedelta
        from django.db.models import Sum, Avg, Count
        
        user = request.user
        today = timezone.now().date()
        
        # Total de tiempo estudiado
        total_time = StudySession.objects.filter(user=user).aggregate(
            total=Sum('duration_minutes')
        )['total'] or 0
        
        # Última semana
        week_ago = today - timedelta(days=7)
        week_logs = ActivityLog.objects.filter(
            user=user,
            date__gte=week_ago
        )
        
        week_stats = week_logs.aggregate(
            lessons=Sum('lessons_completed'),
            flashcards=Sum('flashcards_reviewed'),
            messages=Sum('chatbot_messages'),
            time=Sum('time_studied_minutes'),
            xp=Sum('xp_earned')
        )
        
        # Último mes
        month_ago = today - timedelta(days=30)
        month_logs = ActivityLog.objects.filter(
            user=user,
            date__gte=month_ago
        )
        
        month_stats = month_logs.aggregate(
            lessons=Sum('lessons_completed'),
            flashcards=Sum('flashcards_reviewed'),
            messages=Sum('chatbot_messages'),
            time=Sum('time_studied_minutes'),
            xp=Sum('xp_earned')
        )
        
        # Mejor hora de estudio
        sessions = StudySession.objects.filter(user=user)
        hours_count = {}
        for session in sessions:
            hour = session.start_time.hour
            hours_count[hour] = hours_count.get(hour, 0) + 1
        
        best_hour = max(hours_count.items(), key=lambda x: x[1])[0] if hours_count else None
        
        return Response({
            'total_time_minutes': total_time,
            'total_time_hours': round(total_time / 60, 1),
            'week': week_stats,
            'month': month_stats,
            'best_study_hour': best_hour,
            'total_sessions': sessions.count(),
        })


# ==================== STUDY SESSIONS ====================

class StartStudySessionView(APIView):
    """Iniciar sesión de estudio"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        activity_type = request.data.get('activity_type', 'general')
        lesson_id = request.data.get('lesson_id')
        
        session = StudySession.objects.create(
            user=request.user,
            activity_type=activity_type,
            lesson_id=lesson_id
        )
        
        return Response(StudySessionSerializer(session).data)


class EndStudySessionView(APIView):
    """Finalizar sesión de estudio"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        session_id = request.data.get('session_id')
        
        try:
            session = StudySession.objects.get(id=session_id, user=request.user)
            session.end_session()
            
            # Registrar en activity log
            ActivityLog.log_activity(
                user=request.user,
                activity_type='time',
                value=session.duration_minutes
            )
            
            return Response(StudySessionSerializer(session).data)
        except StudySession.DoesNotExist:
            return Response({'error': 'Sesión no encontrada'}, status=404)


# ==================== HELPER FUNCTIONS ====================

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
    try:
        streak = UserStreak.objects.get(user=user)
        if streak.current_streak >= 7:
            Achievement.objects.get_or_create(
                user=user,
                achievement_type='week_streak',
                defaults={
                    'title': 'Racha Semanal',
                    'description': '¡7 días seguidos practicando!',
                    'icon': '🔥'
                }
            )
    except UserStreak.DoesNotExist:
        pass


def create_daily_challenges(date):
    """Crear 3 desafíos aleatorios para el día"""
    import random
    
    challenge_templates = [
        {
            'type': 'FLASHCARDS',
            'description': 'Completa {} flashcards',
            'targets': [5, 10, 15, 20],
            'xp': 30
        },
        {
            'type': 'LESSONS',
            'description': 'Completa {} lecciones',
            'targets': [1, 2, 3],
            'xp': 50
        },
        {
            'type': 'CHATBOT',
            'description': 'Envía {} mensajes al chatbot',
            'targets': [5, 10, 15],
            'xp': 40
        },
        {
            'type': 'SCORE',
            'description': 'Obtén al menos {}% en una lección',
            'targets': [80, 90, 100],
            'xp': 60
        },
        {
            'type': 'XP',
            'description': 'Gana {} XP hoy',
            'targets': [50, 100, 150],
            'xp': 50
        },
        {
            'type': 'VOCAB',
            'description': 'Aprende {} palabras nuevas',
            'targets': [5, 10, 15],
            'xp': 40
        },
    ]
    
    # Elegir 3 desafíos aleatorios
    selected = random.sample(challenge_templates, 3)
    
    for template in selected:
        target = random.choice(template['targets'])
        DailyChallenge.objects.create(
            challenge_type=template['type'],
            description=template['description'].format(target),
            target_value=target,
            xp_reward=template['xp'],
            date=date
        )