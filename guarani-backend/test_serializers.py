import pytest
from users.serializers import UserSerializer, RegisterSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestUserSerializer:
    """Tests para UserSerializer"""
    
    def test_serializar_usuario(self):
        """Test serializar datos de usuario"""
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='Pass123!',
            first_name='Test',
            last_name='User'
        )
        
        serializer = UserSerializer(user)
        data = serializer.data
        
        assert data['username'] == 'testuser'
        assert data['email'] == 'test@test.com'
        assert data['first_name'] == 'Test'
        assert data['last_name'] == 'User'
        assert 'password' not in data  # Password no debe serializarse
    
    def test_deserializar_usuario(self):
        """Test crear usuario desde datos JSON"""
        data = {
            'username': 'newuser',
            'email': 'new@test.com',
            'first_name': 'New',
            'last_name': 'User'
        }
        
        serializer = UserSerializer(data=data)
        assert serializer.is_valid()
        
        # No crear usuario realmente, solo validar
        validated = serializer.validated_data
        assert validated['username'] == 'newuser'

@pytest.mark.django_db
class TestRegisterSerializer:
    """Tests para RegisterSerializer"""
    
    def test_registro_valido(self):
        """Test registro con datos válidos"""
        data = {
            'username': 'newuser',
            'email': 'new@guaranirenda.com',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
            'first_name': 'New',
            'last_name': 'User'
        }
        
        serializer = RegisterSerializer(data=data)
        assert serializer.is_valid()
        
        user = serializer.save()
        assert user.username == 'newuser'
        assert user.check_password('SecurePass123!')
    
    def test_registro_passwords_no_coinciden(self):
        """Test que passwords deben coincidir"""
        data = {
            'username': 'newuser',
            'email': 'new@test.com',
            'password': 'Pass123!',
            'password2': 'Different123!',
        }
        
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
        assert 'password' in serializer.errors or 'non_field_errors' in serializer.errors
    
    def test_registro_username_duplicado(self):
        """Test que username debe ser único"""
        User.objects.create_user(
            username='existente',
            password='Pass123!'
        )
        
        data = {
            'username': 'existente',
            'email': 'otro@test.com',
            'password': 'Pass123!',
            'password2': 'Pass123!',
        }
        
        serializer = RegisterSerializer(data=data)
        assert not serializer.is_valid()
        assert 'username' in serializer.errors