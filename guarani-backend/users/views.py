from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"message": "Sesión cerrada correctamente"}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"message": "Sesión cerrada"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def quick_login(request):
    """Login rápido solo con nombre (para desarrollo/demo)"""
    name = request.data.get('name')
    
    if not name:
        return Response({'error': 'El nombre es requerido'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Limpiar el nombre para username
    username = name.strip().replace(' ', '_').lower()
    
    # Buscar o crear usuario
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'first_name': name.strip(),
            'email': f'{username}@demo.com',
        }
    )
    
    # Si el usuario no tiene contraseña, asignar una por defecto
    if not user.has_usable_password():
        user.set_password('demo123')
        user.save()
    
    # Generar tokens JWT
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': UserSerializer(user).data,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }, status=status.HTTP_200_OK)