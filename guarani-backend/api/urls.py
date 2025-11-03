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
)

router = DefaultRouter()
router.register(r'lessons', LessonViewSet, basename='lesson')

urlpatterns = [
    path('', include(router.urls)),
    path('progress/', ProgressView.as_view(), name='progress'),
    path('translate/', TranslateView.as_view(), name='translate'),
    path('chatbot/', ChatbotView.as_view(), name='chatbot'),
    path('mascot/', MascotView.as_view(), name='mascot'),
    path('mascot/add-xp/', add_xp, name='add_xp'),
    path('achievements/', AchievementsView.as_view(), name='achievements'),
]