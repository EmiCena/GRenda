from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LessonViewSet, 
    ProgressView, 
    TranslateView, 
    ChatbotView,
    MascotView,
    AchievementsView,
    add_xp,
    WeaknessAnalysisView,
    FlashcardViewSet,
    FlashcardReviewView,
    FlashcardBulkCreateView,
    FlashcardDecksView,
    StreakView,
    DailyChallengesView,
    UpdateChallengeProgressView,
    ActivityHeatmapView,
    StudyStatsView,
    StartStudySessionView,
    EndStudySessionView,
    # Nuevas views del chatbot
    ConversationModesView,
    ChatSessionDetailView,
    ChatSessionListView,
    EndChatSessionView,
    UserConversationStatsView,
)

router = DefaultRouter()
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'flashcards', FlashcardViewSet, basename='flashcard')

urlpatterns = [
    # Progress
    path('progress/', ProgressView.as_view(), name='progress'),
    
    # Translation
    path('translate/', TranslateView.as_view(), name='translate'),
    
    # Chatbot Original
    path('chatbot/', ChatbotView.as_view(), name='chatbot'),
    
    # Chatbot Mejorado
    path('chatbot/modes/', ConversationModesView.as_view(), name='conversation-modes'),
    path('chatbot/sessions/', ChatSessionListView.as_view(), name='chat-sessions'),
    path('chatbot/sessions/<int:session_id>/', ChatSessionDetailView.as_view(), name='chat-session-detail'),
    path('chatbot/sessions/end/', EndChatSessionView.as_view(), name='end-chat-session'),
    path('chatbot/stats/', UserConversationStatsView.as_view(), name='conversation-stats'),
    
    # Mascot
    path('mascot/', MascotView.as_view(), name='mascot'),
    path('mascot/add-xp/', add_xp, name='add_xp'),
    
    # Achievements
    path('achievements/', AchievementsView.as_view(), name='achievements'),
    
    # Analytics
    path('analytics/weaknesses/', WeaknessAnalysisView.as_view(), name='weakness-analysis'),
    
    # Flashcards
    path('flashcards/decks/', FlashcardDecksView.as_view(), name='flashcard-decks'),
    path('flashcards/bulk-create/', FlashcardBulkCreateView.as_view(), name='flashcard-bulk-create'),
    path('flashcards/review/', FlashcardReviewView.as_view(), name='flashcard-review'),
    
    # Streak & Challenges
    path('streak/', StreakView.as_view(), name='streak'),
    path('challenges/daily/', DailyChallengesView.as_view(), name='daily-challenges'),
    path('challenges/update/', UpdateChallengeProgressView.as_view(), name='update-challenge'),
    
    # Stats
    path('stats/heatmap/', ActivityHeatmapView.as_view(), name='activity-heatmap'),
    path('stats/study/', StudyStatsView.as_view(), name='study-stats'),
    
    # Study Sessions
    path('study/start/', StartStudySessionView.as_view(), name='start-session'),
    path('study/end/', EndStudySessionView.as_view(), name='end-session'),
    
    # Router
    path('', include(router.urls)),
]