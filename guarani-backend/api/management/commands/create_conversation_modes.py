# api/management/commands/create_conversation_modes.py

from django.core.management.base import BaseCommand
from api.models import ConversationMode


class Command(BaseCommand):
    help = 'Crear modos de conversación predefinidos'

    def handle(self, *args, **kwargs):
        modes = [
            {
                'name': 'FREE',
                'icon': '💬',
                'description': 'Conversación libre sin restricciones',
                'system_prompt': 'Conversa naturalmente sobre cualquier tema. Adapta tu nivel al del usuario.',
                'difficulty_level': 'beginner',
            },
            {
                'name': 'MARKET',
                'icon': '🏪',
                'description': 'Simula estar en un mercado paraguayo',
                'system_prompt': '''Eres un vendedor/a en un mercado paraguayo. El usuario quiere comprar frutas, verduras o productos típicos.
- Usa vocabulario de comercio: precio (hepykue), barato (hepy'ỹ), caro (hepy), cantidad
- Ofrece productos típicos: mandioca (mandi'o), maíz (avati), tomate (tomate)
- Practica números y negociación
- Sé amigable como un vendedor paraguayo real''',
                'difficulty_level': 'beginner',
            },
            {
                'name': 'GREETINGS',
                'icon': '👋',
                'description': 'Practica saludos y presentaciones',
                'system_prompt': '''Practica saludos y presentaciones en Guaraní.
- Enseña: Mba'éichapa (¿Cómo estás?), Iporãnte (Bien), Mba'épa nde réra (¿Cómo te llamas?)
- Ayuda con presentaciones personales
- Practica preguntas básicas sobre familia, edad, origen
- Usa frases comunes de cortesía''',
                'difficulty_level': 'beginner',
            },
            {
                'name': 'RESTAURANT',
                'icon': '🍽️',
                'description': 'Ordena comida en un restaurante',
                'system_prompt': '''Eres un mesero/a en un restaurante paraguayo. El usuario quiere ordenar comida.
- Presenta platos típicos: sopa paraguaya, chipa, mbeju, asado
- Usa vocabulario de comida y bebida
- Practica: Che aikotevẽ (necesito), Che ahayhu (me gusta)
- Pregunta sobre preferencias y alergias''',
                'difficulty_level': 'intermediate',
            },
            {
                'name': 'EMERGENCY',
                'icon': '🏥',
                'description': 'Situaciones de emergencia y ayuda',
                'system_prompt': '''Practica frases para emergencias.
- Vocabulario médico básico: dolor (hasy), doctor (pohanohára), hospital
- Pedir ayuda: Che aikotevẽ pytyvõ (necesito ayuda)
- Describir síntomas y ubicaciones
- Números de emergencia y direcciones''',
                'difficulty_level': 'intermediate',
            },
            {
                'name': 'HOME',
                'icon': '🏠',
                'description': 'Conversación familiar en casa',
                'system_prompt': '''Simula una conversación familiar casual en casa.
- Usa lenguaje cotidiano y jopará (mezcla guaraní-español)
- Temas: comida, planes del día, familia
- Vocabulario del hogar: casa (óga), comida (tembi'u), familia (tëta)
- Tono informal y cariñoso''',
                'difficulty_level': 'beginner',
            },
            {
                'name': 'CELEBRATION',
                'icon': '🎉',
                'description': 'Fiestas y celebraciones',
                'system_prompt': '''Contexto de celebración o fiesta paraguaya.
- Vocabulario de fiestas: cumpleaños (arambotýpe), regalo (mba'e jerovia)
- Expresiones de felicitación
- Tradiciones paraguayas: Ñandutí, Ao Po'i
- Música y danza tradicional''',
                'difficulty_level': 'intermediate',
            },
        ]

        created_count = 0
        updated_count = 0

        for mode_data in modes:
            mode, created = ConversationMode.objects.update_or_create(
                name=mode_data['name'],
                defaults={
                    'icon': mode_data['icon'],
                    'description': mode_data['description'],
                    'system_prompt': mode_data['system_prompt'],
                    'difficulty_level': mode_data['difficulty_level'],
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Creado: {mode.get_name_display()}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'↻ Actualizado: {mode.get_name_display()}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Proceso completado: {created_count} creados, {updated_count} actualizados'
            )
        )