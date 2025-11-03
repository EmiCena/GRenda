import os
import django
import pytest
from django.conf import settings

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Fixtures globales
@pytest.fixture
def api_client():
    """Cliente API para tests"""
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def authenticated_client(api_client, test_user):
    """Cliente API autenticado"""
    from rest_framework_simplejwt.tokens import RefreshToken
    
    refresh = RefreshToken.for_user(test_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def test_user(db):
    """Usuario de prueba"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    return User.objects.create_user(
        username='testuser',
        email='test@guaranirenda.com',
        password='TestPass123!',
        first_name='Test',
        last_name='User'
    )

@pytest.fixture
def admin_user(db):
    """Usuario administrador de prueba"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    return User.objects.create_superuser(
        username='admin',
        email='admin@guaranirenda.com',
        password='AdminPass123!'
    )

@pytest.fixture
def test_lesson(db):
    """Lección de prueba"""
    from lessons.models import Lesson
    
    return Lesson.objects.create(
        title='Saludos en Guaraní',
        description='Aprende los saludos básicos',
        order=1,
        vocabulary=[
            {"word": "Mba'éichapa", "translation": "Hola", "example": "Mba'éichapa nde"},
            {"word": "Aguyje", "translation": "Gracias", "example": "Aguyje ndéve"}
        ],
        grammar=[
            {"rule": "Pronombres", "explanation": "Che = Yo, Nde = Tú", "example": "Che Jorge"}
        ],
        exercises=[
            {
                "type": "MULTIPLE_CHOICE",
                "question": "¿Cómo se dice 'Hola' en Guaraní?",
                "options": ["Aguyje", "Mba'éichapa", "Jajotopata"],
                "correctAnswerIndex": 1
            }
        ],
        is_published=True
    )