# users/serializers.py (CREAR)

from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}
    )
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': False},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Las contraseñas no coinciden."}
            )
        
        # Validar username
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError(
                {"username": "Este nombre de usuario ya está en uso."}
            )
        
        # Validar email
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError(
                {"email": "Este correo electrónico ya está registrado."}
            )
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password']
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(
                request=self.context.get('request'),
                username=username,
                password=password
            )

            if not user:
                raise serializers.ValidationError(
                    'Usuario o contraseña incorrectos.',
                    code='authorization'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    'Esta cuenta está desactivada.',
                    code='authorization'
                )
        else:
            raise serializers.ValidationError(
                'Debe incluir "username" y "password".',
                code='authorization'
            )

        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'profile_picture', 'level', 'total_xp', 'streak_days',
            'is_staff', 'is_superuser', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'is_staff', 'is_superuser')
