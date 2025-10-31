import { Lesson, ExerciseType } from '../types';

export const lessons: Lesson[] = [
  {
    id: 'l1',
    title: 'Saludos Básicos (Basic Greetings)',
    description: 'Aprende a saludar y presentarte en Guaraní.',
    vocabulary: [
      { word: 'Mba\'éichapa', translation: '¿Hola / Cómo estás?', example: 'Mba\'éichapa, che amigo.' },
      { word: 'Iporãnte', translation: 'Estoy bien', example: 'Che aĩ iporãnte, aguyje.' },
      { word: 'Aguyje', translation: 'Gracias', example: 'Aguyje peẽme.' },
      { word: 'Jajotopata', translation: 'Nos vemos / Hasta luego', example: 'Jajotopata ko\'ẽrõ.' },
    ],
    grammar: [
      { rule: 'Partículas de pregunta', explanation: 'En Guaraní, no siempre se usan signos de interrogación. A menudo, el contexto o partículas como "pa" o "piko" indican una pregunta.', example: 'Nde piko reikuaa?' },
      { rule: 'Pronombres Personales (Che)', explanation: '"Che" significa "Yo". Se usa como sujeto antes del verbo.', example: 'Che ha\'a yvágape. (Yo voy al cielo/fruta).' },
    ],
    exercises: [
      {
        id: 'l1e1',
        type: ExerciseType.MULTIPLE_CHOICE,
        question: '¿Cómo se dice "Hola" en Guaraní?',
        options: ['Aguyje', 'Mba\'éichapa', 'Jajotopata', 'Heẽ'],
        correctAnswerIndex: 1,
      },
      {
        id: 'l1e2',
        type: ExerciseType.TRANSLATION,
        prompt: 'Traduce la siguiente frase al Guaraní:',
        phraseToTranslate: 'Estoy bien',
        correctAnswer: 'Iporãnte',
      },
      {
        id: 'l1e4',
        type: ExerciseType.MULTIPLE_CHOICE,
        question: '¿Qué significa "Aguyje"?',
        options: ['Adiós', 'Por favor', 'Gracias', 'Buenos días'],
        correctAnswerIndex: 2,
      },
    ],
  },
  {
    id: 'l2',
    title: 'Los Números (Papapykuéra)',
    description: 'Cuenta del 1 al 5 en Guaraní.',
    exercises: [
      {
        id: 'l2e1',
        type: ExerciseType.MULTIPLE_CHOICE,
        question: '¿Qué número es "Mokõi"?',
        options: ['Uno', 'Dos', 'Tres', 'Cuatro'],
        correctAnswerIndex: 1,
      },
       {
        id: 'l2e2',
        type: ExerciseType.MULTIPLE_CHOICE,
        question: '¿Cómo se dice "Uno" en Guaraní?',
        options: ['Peteĩ', 'Mokõi', 'Mbohapy', 'Irundy'],
        correctAnswerIndex: 0,
      },
      {
        id: 'l2e3',
        type: ExerciseType.TRANSLATION,
        prompt: 'Escribe el número para "Mbohapy":',
        phraseToTranslate: 'Tres',
        correctAnswer: '3',
      },
    ],
  },
  {
    id: 'l3',
    title: 'La Familia (Che Rogaygua)',
    description: 'Aprende los nombres de los miembros de la familia.',
    exercises: [
       {
        id: 'l3e1',
        type: ExerciseType.TRANSLATION,
        prompt: '¿Cómo se dice "Madre" en Guaraní?',
        phraseToTranslate: 'Madre',
        correctAnswer: 'Sy',
      },
      {
        id: 'l3e2',
        type: ExerciseType.MULTIPLE_CHOICE,
        question: '¿Qué significa "Túva"?',
        options: ['Hermano', 'Abuela', 'Padre', 'Hija'],
        correctAnswerIndex: 2,
      },
    ],
  },
];