# users/views.py (CREAR)

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model

from .serializers import RegisterSerializer, LoginSerializer, UserProfileSerializer
from api.models import Mascot

User = get_user_model()


class RegisterView(APIView):
    """Registro de nuevos usuarios"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Crear mascota automáticamente para el nuevo usuario
            Mascot.objects.get_or_create(
                user=user,
                defaults={'name': 'Tatú'}
            )
            
            # Generar tokens JWT
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserProfileSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'message': '¡Cuenta creada exitosamente!'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """Login con username y password"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generar tokens JWT
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserProfileSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'message': '¡Bienvenido de vuelta!'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """Logout - invalida el refresh token"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'message': 'Sesión cerrada exitosamente.'
            }, status=status.HTTP_200_OK)
        except TokenError:
            return Response({
                'error': 'Token inválido o ya expirado.'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': 'Error al cerrar sesión.'
            }, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    """Obtener y actualizar perfil del usuario"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """Cambiar contraseña del usuario"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not old_password or not new_password:
            return Response({
                'error': 'Se requiere contraseña actual y nueva.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.check_password(old_password):
            return Response({
                'error': 'Contraseña actual incorrecta.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from django.contrib.auth.password_validation import validate_password
            validate_password(new_password, user)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Contraseña actualizada exitosamente.'
        }, status=status.HTTP_200_OK)