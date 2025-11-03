import pytest
from django.contrib.auth import get_user_model

# Importa Lesson desde api.models
try:
    from api.models import Lesson
except Exception:
    Lesson = None

# Detecta el modelo de progreso disponible: UserProgress o Progress
ProgressModel = None
try:
    from api.models import UserProgress as ProgressModel  # nombre más común en tu app
except Exception:
    try:
        from api.models import Progress as ProgressModel
    except Exception:
        ProgressModel = None

User = get_user_model()


@pytest.mark.django_db
class TestUserJourney:
    """
    Test de integración básico que valida:
    - Crear usuario
    - Crear lección
    - Registrar progreso (si existe el modelo)
    - Validar integridad básica de la relación user <-> lesson <-> progress
    """

    def test_flujo_basico(self):
        # 1) Crear usuario
        user = User.objects.create_user(
            username='estudiante',
            email='estudiante@guaranirenda.com',
            password='TestPass123!',
        )
        assert user.pk is not None
        assert user.username == 'estudiante'

        # 2) Verificar que existe el modelo Lesson
        assert Lesson is not None, "No se encontró el modelo Lesson en api.models"

        # 3) Crear una lección con los campos más probables
        #    Ajusta estos valores si tu modelo pide campos adicionales obligatorios
        lesson_kwargs = {}
        lesson_fields = {f.name for f in Lesson._meta.fields}

        # Campos comunes
        if 'title' in lesson_fields:
            lesson_kwargs['title'] = 'Saludos en Guaraní'
        if 'description' in lesson_fields:
            lesson_kwargs['description'] = 'Aprende saludos básicos'
        if 'order' in lesson_fields:
            lesson_kwargs['order'] = 1
        if 'is_published' in lesson_fields:
            lesson_kwargs['is_published'] = True
        # Campos JSON comunes si existen
        if 'vocabulary' in lesson_fields:
            lesson_kwargs['vocabulary'] = [
                {"word": "Mba'éichapa", "translation": "Hola"},
                {"word": "Aguyje", "translation": "Gracias"},
            ]
        if 'grammar' in lesson_fields:
            lesson_kwargs['grammar'] = [
                {"rule": "Pronombres", "explanation": "Che = Yo, Nde = Tú", "example": "Che Juan"}
            ]
        if 'exercises' in lesson_fields:
            lesson_kwargs['exercises'] = [
                {
                    "type": "MULTIPLE_CHOICE",
                    "question": "¿Cómo se dice 'Hola'?",
                    "options": ["Aguyje", "Mba'éichapa", "Jajotopata"],
                    "correctAnswerIndex": 1,
                }
            ]

        lesson = Lesson.objects.create(**lesson_kwargs)
        assert lesson.pk is not None
        assert Lesson.objects.count() >= 1

        # 4) Registrar progreso si existe el modelo (UserProgress o Progress)
        if ProgressModel is not None:
            progress_fields = {f.name for f in ProgressModel._meta.fields}
            progress_kwargs = {}

            # Relaciones obligatorias
            if 'user' in progress_fields:
                progress_kwargs['user'] = user
            if 'lesson' in progress_fields:
                progress_kwargs['lesson'] = lesson

            # Campos opcionales comunes
            if 'score' in progress_fields:
                progress_kwargs['score'] = 85
            if 'completed' in progress_fields:
                progress_kwargs['completed'] = True
            if 'attempts' in progress_fields:
                progress_kwargs['attempts'] = 1

            progress = ProgressModel.objects.create(**progress_kwargs)
            assert progress.pk is not None

            # Validar relación
            qs = ProgressModel.objects.filter(**{k: v for k, v in progress_kwargs.items() if k in ['user', 'lesson']})
            assert qs.count() == 1

        # 5) Si el usuario tiene XP, simular aumento para validar campo
        if hasattr(user, 'total_xp'):
            user.total_xp += 100
            user.save()
            user.refresh_from_db()
            assert user.total_xp >= 100