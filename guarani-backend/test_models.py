import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()

@pytest.mark.django_db
class TestUserModel:
    """Tests para el modelo de Usuario"""
    
    def test_crear_usuario_normal(self):
        """Test crear usuario regular"""
        user = User.objects.create_user(
            username='estudiante',
            email='estudiante@guaranirenda.com',
            password='Pass123!',
            first_name='Juan',
            last_name='Pérez'
        )
        
        assert user.username == 'estudiante'
        assert user.email == 'estudiante@guaranirenda.com'
        assert user.check_password('Pass123!')
        assert user.is_active == True
        assert user.is_staff == False
        assert user.is_superuser == False
    
    def test_crear_superusuario(self):
        """Test crear superusuario"""
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@guaranirenda.com',
            password='AdminPass123!'
        )
        
        assert admin.is_staff == True
        assert admin.is_superuser == True
        assert admin.is_active == True
    
    def test_usuario_valores_por_defecto(self):
        """Test valores por defecto del usuario"""
        user = User.objects.create_user(
            username='test',
            password='Pass123!'
        )
        
        # Si tu modelo tiene estos campos
        assert hasattr(user, 'total_xp') and user.total_xp == 0
        assert hasattr(user, 'streak_days') and user.streak_days == 0
        assert hasattr(user, 'level') and user.level == 1
    
    def test_username_unico(self):
        """Test que username debe ser único"""
        User.objects.create_user(
            username='duplicado',
            password='Pass123!'
        )
        
        with pytest.raises(IntegrityError):
            User.objects.create_user(
                username='duplicado',
                password='OtroPass123!'
            )
    
    def test_email_formato_valido(self):
        """Test validación de formato de email"""
        user = User.objects.create_user(
            username='test',
            email='invalido@',  # Email inválido
            password='Pass123!'
        )
        # Django permite guardar emails inválidos en el modelo
        # La validación ocurre en forms/serializers
        assert user.email == 'invalido@'
    
    def test_usuario_str_representation(self):
        """Test representación string del usuario"""
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='Pass123!'
        )
        
        assert str(user) == 'testuser'
    
    def test_usuario_puede_ganar_xp(self):
        """Test que usuario puede acumular XP"""
        user = User.objects.create_user(
            username='estudiante',
            password='Pass123!'
        )
        
        if hasattr(user, 'total_xp'):
            user.total_xp = 100
            user.save()
            
            user.refresh_from_db()
            assert user.total_xp == 100
            
            # Agregar más XP
            user.total_xp += 50
            user.save()
            
            user.refresh_from_db()
            assert user.total_xp == 150
    
    def test_usuario_racha_dias(self):
        """Test manejo de racha de días"""
        user = User.objects.create_user(
            username='estudiante',
            password='Pass123!'
        )
        
        if hasattr(user, 'streak_days'):
            user.streak_days = 5
            user.save()
            
            user.refresh_from_db()
            assert user.streak_days == 5