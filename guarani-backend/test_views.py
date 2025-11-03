import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

@pytest.mark.django_db
class TestAuthentication:
    """Tests para endpoints de autenticación"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    def test_registro_exitoso(self, api_client):
        """Test registro de nuevo usuario"""
        url = reverse('register')  # Ajusta según tu URL
        data = {
            'username': 'nuevouser',
            'email': 'nuevo@guaranirenda.com',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
            'first_name': 'Nuevo',
            'last_name': 'Usuario'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data
        
        # Verificar que el usuario fue creado
        assert User.objects.filter(username='nuevouser').exists()
    
    def test_registro_username_duplicado(self, api_client):
        """Test registro con username existente"""
        User.objects.create_user(
            username='existente',
            password='Pass123!'
        )
        
        url = reverse('register')
        data = {
            'username': 'existente',
            'email': 'otro@test.com',
            'password': 'Pass123!',
            'password2': 'Pass123!',
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'username' in response.data
    
    def test_login_exitoso(self, api_client):
        """Test login con credenciales correctas"""
        user = User.objects.create_user(
            username='testuser',
            password='TestPass123!'
        )
        
        url = reverse('login')  # Ajusta según tu URL
        data = {
            'username': 'testuser',
            'password': 'TestPass123!'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data
    
    def test_login_credenciales_invalidas(self, api_client):
        """Test login con credenciales incorrectas"""
        User.objects.create_user(
            username='testuser',
            password='CorrectPass123!'
        )
        
        url = reverse('login')
        data = {
            'username': 'testuser',
            'password': 'WrongPass123!'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_refresh_token(self, api_client):
        """Test renovar access token con refresh token"""
        user = User.objects.create_user(
            username='testuser',
            password='Pass123!'
        )
        
        refresh = RefreshToken.for_user(user)
        
        url = reverse('token_refresh')  # Ajusta según tu URL
        data = {
            'refresh': str(refresh)
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data

@pytest.mark.django_db
class TestUserProfile:
    """Tests para endpoints de perfil de usuario"""
    
    @pytest.fixture
    def authenticated_client(self):
        """Cliente autenticado"""
        client = APIClient()
        user = User.objects.create_user(
            username='testuser',
            password='Pass123!'
        )
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return client, user
    
    def test_obtener_perfil_autenticado(self, authenticated_client):
        """Test obtener perfil propio estando autenticado"""
        client, user = authenticated_client
        
        url = reverse('profile')  # Ajusta según tu URL
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == user.username
    
    def test_obtener_perfil_sin_autenticar(self):
        """Test que no se puede obtener perfil sin autenticación"""
        client = APIClient()
        
        url = reverse('profile')
        response = client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_actualizar_perfil(self, authenticated_client):
        """Test actualizar perfil propio"""
        client, user = authenticated_client
        
        url = reverse('profile-update')  # Ajusta según tu URL
        data = {
            'first_name': 'Actualizado',
            'last_name': 'Nombre'
        }
        
        response = client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        user.refresh_from_db()
        assert user.first_name == 'Actualizado'
        assert user.last_name == 'Nombre'