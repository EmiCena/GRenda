from django.core.management.base import BaseCommand
from api.models import Lesson

MOCK_LESSONS = [
    {
        'id': 'l1',
        'title': 'Saludos Básicos (Basic Greetings)',
        'description': 'Aprende a saludar y presentarte en Guaraní.',
        'vocabulary': [
            {'word': "Mba'éichapa", 'translation': '¿Hola / Cómo estás?', 'example': "Mba'éichapa, che amigo."},
            {'word': 'Iporãnte', 'translation': 'Estoy bien', 'example': 'Che aĩ iporãnte, aguyje.'},
            {'word': 'Aguyje', 'translation': 'Gracias', 'example': 'Aguyje peẽme.'},
            {'word': 'Jajotopata', 'translation': 'Nos vemos / Hasta luego', 'example': "Jajotopata ko'ẽrõ."},
        ],
        'grammar': [
            {
                'rule': 'Partículas de pregunta',
                'explanation': 'En Guaraní, no siempre se usan signos de interrogación. A menudo, el contexto o partículas como "pa" o "piko" indican una pregunta.',
                'example': 'Nde piko reikuaa?'
            },
            {
                'rule': 'Pronombres Personales (Che)',
                'explanation': '"Che" significa "Yo". Se usa como sujeto antes del verbo.',
                'example': "Che ha'a yvágape."
            },
        ],
        'exercises': [
            {
                'id': 'l1e1',
                'type': 'MULTIPLE_CHOICE',
                'question': '¿Cómo se dice "Hola" en Guaraní?',
                'options': ['Aguyje', "Mba'éichapa", 'Jajotopata', 'Heẽ'],
                'correctAnswerIndex': 1,
            },
            {
                'id': 'l1e2',
                'type': 'TRANSLATION',
                'prompt': 'Traduce la siguiente frase al Guaraní:',
                'phraseToTranslate': 'Estoy bien',
                'correctAnswer': 'Iporãnte',
            },
            {
                'id': 'l1e4',
                'type': 'MULTIPLE_CHOICE',
                'question': '¿Qué significa "Aguyje"?',
                'options': ['Adiós', 'Por favor', 'Gracias', 'Buenos días'],
                'correctAnswerIndex': 2,
            },
        ],
        'order': 1,
    },
    {
        'id': 'l2',
        'title': 'Los Números (Papapykuéra)',
        'description': 'Cuenta del 1 al 5 en Guaraní.',
        'vocabulary': [
            {'word': 'Peteĩ', 'translation': 'Uno', 'example': 'Peteĩ táva.'},
            {'word': 'Mokõi', 'translation': 'Dos', 'example': 'Mokõi mita.'},
            {'word': 'Mbohapy', 'translation': 'Tres', 'example': 'Mbohapy ára.'},
            {'word': 'Irundy', 'translation': 'Cuatro', 'example': 'Irundy óga.'},
            {'word': 'Po', 'translation': 'Cinco', 'example': 'Po sãso.'},
        ],
        'grammar': [
            {
                'rule': 'Números Cardinales',
                'explanation': 'Los números en Guaraní se usan de forma similar al español.',
                'example': 'Che areko mokõi mitã.'
            },
        ],
        'exercises': [
            {
                'id': 'l2e1',
                'type': 'MULTIPLE_CHOICE',
                'question': '¿Qué número es "Mokõi"?',
                'options': ['Uno', 'Dos', 'Tres', 'Cuatro'],
                'correctAnswerIndex': 1,
            },
            {
                'id': 'l2e2',
                'type': 'MULTIPLE_CHOICE',
                'question': '¿Cómo se dice "Uno" en Guaraní?',
                'options': ['Peteĩ', 'Mokõi', 'Mbohapy', 'Irundy'],
                'correctAnswerIndex': 0,
            },
            {
                'id': 'l2e3',
                'type': 'TRANSLATION',
                'prompt': 'Escribe el número para "Mbohapy":',
                'phraseToTranslate': 'Tres',
                'correctAnswer': '3',
            },
        ],
        'order': 2,
    },
    {
        'id': 'l3',
        'title': 'La Familia (Che Rogaygua)',
        'description': 'Aprende los nombres de los miembros de la familia.',
        'vocabulary': [
            {'word': 'Sy', 'translation': 'Madre', 'example': 'Che sy oguata.'},
            {'word': 'Túva', 'translation': 'Padre', 'example': 'Che rúva omba\'apo.'},
            {'word': 'Hermano', 'translation': 'Kyvy (hermano mayor)', 'example': 'Che kyvy oime.'},
            {'word': 'Jarýi', 'translation': 'Abuela', 'example': 'Che jarýi iporã.'},
        ],
        'grammar': [
            {
                'rule': 'Posesivos',
                'explanation': 'En Guaraní, los posesivos se anteponen: che (mi), nde (tu), i (su)',
                'example': 'Che sy = Mi madre'
            },
        ],
        'exercises': [
            {
                'id': 'l3e1',
                'type': 'TRANSLATION',
                'prompt': '¿Cómo se dice "Madre" en Guaraní?',
                'phraseToTranslate': 'Madre',
                'correctAnswer': 'Sy',
            },
            {
                'id': 'l3e2',
                'type': 'MULTIPLE_CHOICE',
                'question': '¿Qué significa "Túva"?',
                'options': ['Hermano', 'Abuela', 'Padre', 'Hija'],
                'correctAnswerIndex': 2,
            },
        ],
        'order': 3,
    },
]

class Command(BaseCommand):
    help = 'Carga las lecciones de ejemplo en la base de datos'

    def handle(self, *args, **kwargs):
        self.stdout.write('Cargando lecciones...')
        
        for lesson_data in MOCK_LESSONS:
            lesson, created = Lesson.objects.update_or_create(
                id=lesson_data['id'],
                defaults=lesson_data
            )
            action = '✅ Creada' if created else '🔄 Actualizada'
            self.stdout.write(
                self.style.SUCCESS(f'{action}: {lesson.title}')
            )
        
        self.stdout.write(self.style.SUCCESS(f'\n✨ Total: {len(MOCK_LESSONS)} lecciones cargadas'))