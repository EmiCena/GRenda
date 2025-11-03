# 🦜 Guaraní Renda - Plataforma de Aprendizaje del Idioma Guaraní

<div align="center">

![Guaraní Renda Logo](https://via.placeholder.com/800x200/4F46E5/FFFFFF?text=Guaraní+Renda+-+El+Lugar+del+Guaraní)

**Una plataforma educativa interactiva y gratuita para aprender guaraní**

[![Python Version](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Django Version](https://img.shields.io/badge/django-5.2.7-green.svg)](https://www.djangoproject.com/)
[![React Version](https://img.shields.io/badge/react-18.2.0-61dafb.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](tests/)
[![Coverage](https://img.shields.io/badge/coverage-79%25-yellow.svg)](htmlcov/)

[Demo en Vivo](#) | [Documentación](#) | [Reportar Bug](https://github.com/tu-usuario/guarani-renda/issues) | [Solicitar Feature](https://github.com/tu-usuario/guarani-renda/issues)

</div>

---

## 📖 Tabla de Contenidos

- [Sobre el Proyecto](#-sobre-el-proyecto)
- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Comenzar](#-comenzar)
  - [Requisitos Previos](#requisitos-previos)
  - [Instalación](#instalación)
  - [Variables de Entorno](#variables-de-entorno)
- [Uso](#-uso)
- [Testing](#-testing)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)
- [Contacto](#-contacto)
- [Agradecimientos](#-agradecimientos)

---

## 🎯 Sobre el Proyecto

**Guaraní Renda** (en guaraní: "El Lugar del Guaraní") es una plataforma web educativa diseñada para preservar y difundir el idioma guaraní en la provincia de Misiones, Argentina.

### Problema que Resuelve

- 📉 **Pérdida generacional** del idioma guaraní
- 🚫 **Falta de recursos digitales** modernos para el aprendizaje
- 💰 **Barreras económicas** de acceso a cursos presenciales
- 🌍 **Dispersión geográfica** que dificulta el acceso a centros educativos

### Solución

Una plataforma **100% gratuita, accesible 24/7** con:
- ✅ Lecciones interactivas con gamificación
- ✅ Chatbot con IA para práctica conversacional
- ✅ Sistema de progreso y logros
- ✅ Glosario español-guaraní
- ✅ Panel administrativo para gestión de contenidos

---

## ✨ Características

### 🎓 Para Estudiantes

- **20 lecciones estructuradas** desde nivel básico a intermedio
- **Ejercicios interactivos**: opción múltiple, traducción, completar espacios
- **Chatbot "Arami"** (Sabiduría) con IA de Google Gemini para practicar conversaciones
- **Sistema de gamificación**: XP, niveles, rachas de días, logros desbloqueables
- **Mascota virtual** que evoluciona con tu progreso
- **Glosario interactivo** con 500+ palabras y búsqueda en tiempo real
- **Dashboard personalizado** con gráficos de rendimiento
- **Responsive design**: funciona en móvil, tablet y desktop

### 👨‍🏫 Para Docentes

- Ver progreso de alumnos asignados
- Exportar reportes de avance
- Sugerir contenidos nuevos

### 👑 Para Administradores

- **CRUD completo** de lecciones y ejercicios
- **Gestión de usuarios** (activar/desactivar, cambiar roles)
- **Analíticas globales** (usuarios activos, lecciones más populares, retención)
- **Panel Django Admin** incluido

---

## 🛠️ Stack Tecnológico

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| ![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python) | 3.11+ | Lenguaje principal |
| ![Django](https://img.shields.io/badge/Django-5.2.7-green?logo=django) | 5.2.7 | Framework web |
| ![DRF](https://img.shields.io/badge/DRF-3.16.1-red) | 3.16.1 | API REST |
| ![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat&compact=true&logo=sqlite&logoColor=white) | 15+ | Base de datos |
| ![JWT](https://img.shields.io/badge/JWT-5.5.1-black) | 5.5.1 | Autenticación |
| ![Gemini](https://img.shields.io/badge/Gemini-0.8.5-blue?logo=google) | 0.8.5 | IA Chatbot |

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| ![React](https://img.shields.io/badge/React-18.2.0-61dafb?logo=react) | 18.2.0 | Framework UI |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript) | 5.0+ | Tipado estático |
| ![Vite](https://img.shields.io/badge/Vite-4.3-646CFF?logo=vite) | 4.3+ | Build tool |
| ![Tailwind](https://img.shields.io/badge/Tailwind-3.3-38B2AC?logo=tailwind-css) | 3.3+ | CSS Framework |
| ![Recharts](https://img.shields.io/badge/Recharts-2.5-blue) | 2.5+ | Gráficos |

### DevOps & Testing

| Herramienta | Propósito |
|-------------|-----------|
| **pytest** | Testing backend |
| **Jest** | Testing frontend |
| **Git/GitHub** | Control de versiones |


---

## 📸 Capturas de Pantalla

<details>
<summary>🖼️ Ver Capturas</summary>

### Dashboard Principal
![Dashboard](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Dashboard+con+Estadísticas+y+Gráficos)

### Vista de Lección
![Lección](https://via.placeholder.com/800x400/10B981/FFFFFF?text=Lección+Interactiva+con+Ejercicios)

### Chatbot Arami
![Chatbot](https://via.placeholder.com/800x400/8B5CF6/FFFFFF?text=Chatbot+IA+para+Práctica)

### Panel Admin
![Admin](https://via.placeholder.com/800x400/F59E0B/FFFFFF?text=Panel+de+Administración)

</details>

---

## 🚀 Comenzar

### Requisitos Previos

Asegúrate de tener instalado:

- **Python 3.11+** - [Descargar](https://www.python.org/downloads/)
- **Node.js 18+** y npm - [Descargar](https://nodejs.org/)
- **PostgreSQL 15+** - [Descargar](https://www.postgresql.org/download/)
- **Git** - [Descargar](https://git-scm.com/)
- **Google Gemini API Key** - [Obtener](https://makersuite.google.com/app/apikey)

### Instalación

#### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/guarani-renda.git
cd guarani-renda

# Navegar a la carpeta backend
cd guarani-backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo .env (ver sección Variables de Entorno)
cp .env.example .env
# Editar .env con tus valores

# Aplicar migraciones
python manage.py migrate

# Cargar datos de ejemplo (opcional)
python manage.py load_mock_lessons

# Crear superusuario
python manage.py createsuperuser

# Iniciar servidor de desarrollo
python manage.py runserver

# En otra terminal, navegar a frontend
cd guarani-frontend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env
# Editar .env si es necesario

# Iniciar servidor de desarrollo
npm run dev
