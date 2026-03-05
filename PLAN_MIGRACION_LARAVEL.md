# 📋 PLAN DE MIGRACIÓN: Frontend React → Backend Laravel

## 🎯 Objetivo
Migrar "La App del Docente" de arquitectura frontend-only (localStorage + IndexedDB) a arquitectura full-stack con Laravel como backend, permitiendo persistencia por usuario y sincronización multi-dispositivo.

---

## 📊 ANÁLISIS DE ESTADO ACTUAL

### Módulos de Persistencia Identificados

| Módulo | Archivo Helper | Storage Key | Tipo | Datos |
|--------|---------------|-------------|------|-------|
| **Escuelas** | `datosEscuelas.js` | `app_escuelas` | localStorage | Array de escuelas |
| **Cursos** | `datosCursos.js` | `app_cursos` | localStorage | Array de cursos (por escuela) |
| **Perfil Docente** | `datosPerfil.js` | `perfilDocente` | localStorage | Datos del docente |
| **Asistencia** | `datosAsistencia.js` | `app_asistencia` | localStorage | Asistencia por fecha/curso/alumno |
| **Trayectorias** | `datosTrayectorias.js` | `trayectorias_registros_v1` | localStorage | Registros por curso/alumno |
| **Seguimiento** | `datosSeguimiento.js` | `seguimiento_v1` | localStorage | Alumnos en seguimiento |
| **Diagnósticos** | `datosDiagnosticos.js` | `diagnosticos_v1` | localStorage | Diagnósticos por curso |
| **Planificación** | `datosPlanificacion.js` | `planificacion_v1` | localStorage | Planes por curso |
| **Planificación IA** | `planificacionPersistencia.js` | `planificacion_ia_*` | localStorage | Borradores IA |
| **Clases** | `datosClases.js` | `clases_curso_*` | localStorage | Config y detalles de clases |
| **Admin Clases** | `datosClasesAdmin.js` | `clases_admin_*` | localStorage | Materiales (teoría/práctica) |
| **Archivos** | `archivosLocal.js` | IndexedDB | IndexedDB | PDFs y documentos |
| **Imponderables** | (implícito) | `appdoc_imponderables` | localStorage | Inasistencias/imponderables |

### Estructura de Datos Actual

```javascript
// Ejemplos de estructura actual
{
  // Escuelas
  escuelas: [{ id, nombre }]
  
  // Cursos
  cursos: [{ id, nombre, escuelaId, horarios: [...] }]
  
  // Asistencia
  asistencia: {
    "2024-01-15": {
      "cursoId": {
        "alumnoId": { presente, tarde, horaIngreso }
      }
    }
  }
  
  // Trayectorias
  trayectorias: {
    "cursoId": {
      "alumnoKey": [registros...]
    }
  }
}
```

---

## 🏗️ ARQUITECTURA LARAVEL PROPUESTA

### Stack Tecnológico

- **Backend**: Laravel 11+ (PHP 8.2+)
- **Base de Datos**: MySQL/PostgreSQL
- **Autenticación**: Laravel Sanctum (API tokens) o Laravel Passport (OAuth2)
- **API**: RESTful API con JSON
- **Storage**: Laravel Storage (local/S3) para archivos
- **Frontend**: React (actual) → consume API Laravel

### Estructura de Base de Datos

```sql
-- Tablas principales
users                    -- Usuarios/docentes
escuelas                 -- Escuelas
cursos                   -- Cursos (relacionados con escuelas y usuarios)
alumnos                  -- Alumnos (por curso)
asistencias              -- Registros de asistencia
trayectorias             -- Registros de trayectorias
seguimientos             -- Alumnos en seguimiento
diagnosticos             -- Diagnósticos
planificaciones          -- Planificaciones
clases                   -- Clases (detalles)
clase_materiales        -- Materiales de clases (teoría/práctica)
imponderables            -- Inasistencias/imponderables del docente
archivos                 -- Archivos subidos (PDFs, etc.)

-- Tablas pivot/relación
curso_usuario            -- Relación muchos a muchos: cursos-docentes
```

---

## 📐 DISEÑO DE BASE DE DATOS DETALLADO

### 1. Tabla `users` (Laravel Auth estándar + campos adicionales)

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL,
    -- Campos adicionales
    dni VARCHAR(20) NULL,
    telefono VARCHAR(20) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

### 2. Tabla `escuelas`

```sql
CREATE TABLE escuelas (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) NULL,
    direccion TEXT NULL,
    telefono VARCHAR(20) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

### 3. Tabla `cursos`

```sql
CREATE TABLE cursos (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    escuela_id BIGINT UNSIGNED NOT NULL,
    anio INT NULL,
    division VARCHAR(10) NULL,
    materia VARCHAR(255) NULL,
    horarios JSON NULL, -- [{dia, desde, hasta}, ...]
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (escuela_id) REFERENCES escuelas(id) ON DELETE CASCADE
);
```

### 4. Tabla `curso_usuario` (Pivot: muchos docentes pueden tener muchos cursos)

```sql
CREATE TABLE curso_usuario (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    curso_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_curso_user (curso_id, user_id)
);
```

### 5. Tabla `alumnos`

```sql
CREATE TABLE alumnos (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    curso_id BIGINT UNSIGNED NOT NULL,
    legajo VARCHAR(50) NULL,
    apellido VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    dni VARCHAR(20) NULL,
    fecha_nacimiento DATE NULL,
    condicion ENUM('CURSA', 'RECURSA', 'LIBRE', 'OTRO') DEFAULT 'CURSA',
    observaciones TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    INDEX idx_curso (curso_id)
);
```

### 6. Tabla `asistencias`

```sql
CREATE TABLE asistencias (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    curso_id BIGINT UNSIGNED NOT NULL,
    alumno_id BIGINT UNSIGNED NOT NULL,
    fecha DATE NOT NULL,
    presente BOOLEAN DEFAULT FALSE,
    tarde BOOLEAN DEFAULT FALSE,
    horaIngreso TIME NULL,
    observaciones TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_asistencia (curso_id, alumno_id, fecha),
    INDEX idx_fecha (fecha),
    INDEX idx_curso_fecha (curso_id, fecha)
);
```

### 7. Tabla `trayectorias`

```sql
CREATE TABLE trayectorias (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    curso_id BIGINT UNSIGNED NOT NULL,
    alumno_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL, -- Docente que registra
    fecha DATE NOT NULL,
    tipo ENUM('NOTA', 'SEGUIMIENTO', 'OBSERVACION', 'OTRO') NOT NULL,
    detalle TEXT NOT NULL,
    valor DECIMAL(5,2) NULL, -- Para notas
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_alumno (alumno_id),
    INDEX idx_curso_fecha (curso_id, fecha)
);
```

### 8. Tabla `seguimientos`

```sql
CREATE TABLE seguimientos (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    curso_id BIGINT UNSIGNED NOT NULL,
    alumno_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    motivo TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_seguimiento (curso_id, alumno_id, user_id)
);
```

### 9. Tabla `diagnosticos`

```sql
CREATE TABLE diagnosticos (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    curso_id BIGINT UNSIGNED NOT NULL,
    alumno_id BIGINT UNSIGNED NOT NULL,
    fecha DATE NOT NULL,
    tipo VARCHAR(100) NULL,
    detalle TEXT NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    INDEX idx_curso (curso_id)
);
```

### 10. Tabla `planificaciones`

```sql
CREATE TABLE planificaciones (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    curso_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    programa_texto TEXT NULL,
    programa_archivo_path VARCHAR(500) NULL,
    modelo_archivo_path VARCHAR(500) NULL,
    plan JSON NULL, -- Estructura completa del plan
    meta JSON NULL, -- Metadatos del plan
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_planificacion (curso_id, user_id)
);
```

### 11. Tabla `clases`

```sql
CREATE TABLE clases (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    curso_id BIGINT UNSIGNED NOT NULL,
    numero_clase INT NOT NULL,
    detalle TEXT NULL,
    fecha DATE NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_clase (curso_id, numero_clase)
);
```

### 12. Tabla `clase_materiales`

```sql
CREATE TABLE clase_materiales (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    clase_id BIGINT UNSIGNED NOT NULL,
    tipo ENUM('teoria', 'practica') NOT NULL,
    tipo_material ENUM('archivo', 'link') NOT NULL,
    archivo_path VARCHAR(500) NULL, -- Si es archivo
    archivo_nombre VARCHAR(255) NULL,
    archivo_tipo VARCHAR(100) NULL,
    archivo_tamano BIGINT NULL,
    link_url TEXT NULL, -- Si es link
    link_titulo VARCHAR(255) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (clase_id) REFERENCES clases(id) ON DELETE CASCADE,
    INDEX idx_clase_tipo (clase_id, tipo)
);
```

### 13. Tabla `imponderables`

```sql
CREATE TABLE imponderables (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    curso_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    fecha DATE NOT NULL,
    tipo ENUM('Injustificada', 'Lic médico', 'Lic adm', 'Otra lic', 'Paro', 'Profilaxis', 'Otro') NOT NULL,
    observacion TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_curso_fecha (curso_id, fecha)
);
```

### 14. Tabla `archivos` (para archivos subidos)

```sql
CREATE TABLE archivos (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_almacenado VARCHAR(255) NOT NULL,
    ruta VARCHAR(500) NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    tamano BIGINT NOT NULL,
    relacionable_type VARCHAR(255) NULL, -- Polymorphic: puede pertenecer a planificación, clase, etc.
    relacionable_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_relacionable (relacionable_type, relacionable_id)
);
```

---

## 🔐 AUTENTICACIÓN Y AUTORIZACIÓN

### Estrategia: Laravel Sanctum

1. **Login**: POST `/api/login`
   - Email + Password
   - Retorna: `{ token, user }`

2. **Middleware**: `auth:sanctum`
   - Todas las rutas API requieren token
   - Token en header: `Authorization: Bearer {token}`

3. **Logout**: POST `/api/logout`
   - Revoca token actual

4. **Registro** (opcional): POST `/api/register`

### Políticas de Autorización

- Usuario solo puede acceder a **sus propios datos**
- Usuario solo puede ver cursos donde está asignado (`curso_usuario`)
- Validación en cada endpoint: `$user->cursos()->where('curso_id', $cursoId)->exists()`

---

## 📡 API REST - ENDPOINTS PROPUESTOS

### Autenticación
```
POST   /api/login
POST   /api/logout
POST   /api/register (opcional)
GET    /api/user
```

### Escuelas
```
GET    /api/escuelas
GET    /api/escuelas/{id}
POST   /api/escuelas
PUT    /api/escuelas/{id}
DELETE /api/escuelas/{id}
```

### Cursos
```
GET    /api/cursos                    # Cursos del usuario autenticado
GET    /api/cursos/{id}
POST   /api/cursos
PUT    /api/cursos/{id}
DELETE /api/cursos/{id}
GET    /api/escuelas/{escuelaId}/cursos
```

### Alumnos
```
GET    /api/cursos/{cursoId}/alumnos
POST   /api/cursos/{cursoId}/alumnos
PUT    /api/alumnos/{id}
DELETE /api/alumnos/{id}
POST   /api/cursos/{cursoId}/alumnos/importar  # Importar desde Excel
```

### Asistencia
```
GET    /api/cursos/{cursoId}/asistencias?fecha=YYYY-MM-DD
POST   /api/cursos/{cursoId}/asistencias
PUT    /api/asistencias/{id}
GET    /api/cursos/{cursoId}/asistencias/fecha/{fecha}
```

### Trayectorias
```
GET    /api/cursos/{cursoId}/trayectorias
GET    /api/cursos/{cursoId}/trayectorias/alumno/{alumnoId}
POST   /api/cursos/{cursoId}/trayectorias
PUT    /api/trayectorias/{id}
DELETE /api/trayectorias/{id}
```

### Seguimiento
```
GET    /api/cursos/{cursoId}/seguimientos
POST   /api/cursos/{cursoId}/seguimientos
PUT    /api/seguimientos/{id}
DELETE /api/seguimientos/{id}
```

### Planificaciones
```
GET    /api/cursos/{cursoId}/planificaciones
POST   /api/cursos/{cursoId}/planificaciones
PUT    /api/planificaciones/{id}
DELETE /api/planificaciones/{id}
POST   /api/planificaciones/{id}/archivo  # Subir archivo
```

### Clases
```
GET    /api/cursos/{cursoId}/clases
GET    /api/cursos/{cursoId}/clases/{numeroClase}
POST   /api/cursos/{cursoId}/clases
PUT    /api/clases/{id}
GET    /api/cursos/{cursoId}/clases/admin
POST   /api/clases/{id}/materiales
DELETE /api/clase-materiales/{id}
```

### Imponderables
```
GET    /api/cursos/{cursoId}/imponderables
POST   /api/cursos/{cursoId}/imponderables
DELETE /api/imponderables/{id}
```

### Archivos
```
POST   /api/archivos
GET    /api/archivos/{id}
DELETE /api/archivos/{id}
GET    /api/archivos/{id}/descargar
```

---

## 🔄 PLAN DE MIGRACIÓN PASO A PASO

### FASE 1: Setup Laravel (Semana 1)

#### 1.1 Instalación y Configuración
- [ ] Instalar Laravel 11+ (`composer create-project laravel/laravel backend`)
- [ ] Configurar base de datos (`.env`)
- [ ] Instalar Laravel Sanctum (`composer require laravel/sanctum`)
- [ ] Configurar CORS para React (`config/cors.php`)
- [ ] Configurar storage para archivos (`storage/app/public`)

#### 1.2 Migraciones Base
- [ ] Crear migraciones para todas las tablas (ver diseño arriba)
- [ ] Ejecutar migraciones: `php artisan migrate`
- [ ] Crear seeders para datos iniciales (opcional)

#### 1.3 Modelos Eloquent
- [ ] Crear modelos: `User`, `Escuela`, `Curso`, `Alumno`, `Asistencia`, `Trayectoria`, `Seguimiento`, `Diagnostico`, `Planificacion`, `Clase`, `ClaseMaterial`, `Imponderable`, `Archivo`
- [ ] Definir relaciones en modelos
- [ ] Definir fillable/guarded

#### 1.4 Autenticación
- [ ] Configurar Sanctum
- [ ] Crear `AuthController` (login, logout, register)
- [ ] Crear middleware de autenticación
- [ ] Probar login/logout con Postman/Insomnia

---

### FASE 2: API Básica (Semana 2-3)

#### 2.1 Controladores Base
- [ ] `EscuelaController` (CRUD)
- [ ] `CursoController` (CRUD + relación usuario)
- [ ] `AlumnoController` (CRUD + importar Excel)
- [ ] `AsistenciaController` (CRUD + por fecha)
- [ ] `TrayectoriaController` (CRUD + por alumno)
- [ ] `SeguimientoController` (CRUD)

#### 2.2 Recursos API (Formatters)
- [ ] Crear Resources (Laravel API Resources) para formatear respuestas
- [ ] Ejemplo: `EscuelaResource`, `CursoResource`, `AlumnoResource`

#### 2.3 Validación
- [ ] Crear Form Requests para validación
- [ ] Ejemplo: `StoreCursoRequest`, `UpdateCursoRequest`

#### 2.4 Testing API
- [ ] Probar todos los endpoints con Postman
- [ ] Crear colección Postman para documentación

---

### FASE 3: API Avanzada (Semana 4)

#### 3.1 Módulos Restantes
- [ ] `DiagnosticoController`
- [ ] `PlanificacionController` (con manejo de archivos)
- [ ] `ClaseController` + `ClaseMaterialController`
- [ ] `ImponderableController`
- [ ] `ArchivoController` (upload/download)

#### 3.2 Manejo de Archivos
- [ ] Configurar storage (local/S3)
- [ ] Endpoint upload: `POST /api/archivos`
- [ ] Endpoint download: `GET /api/archivos/{id}/descargar`
- [ ] Validar tipos y tamaños

#### 3.3 Políticas de Autorización
- [ ] Crear Policies para cada recurso
- [ ] Validar que usuario solo acceda a sus cursos
- [ ] Middleware de autorización

---

### FASE 4: Adaptación Frontend (Semana 5-6)

#### 4.1 Crear Servicio API
- [ ] Crear `src/services/api.js` o `src/utils/apiClient.js`
- [ ] Configurar axios/fetch con base URL
- [ ] Interceptores para token y errores
- [ ] Funciones helper por módulo

#### 4.2 Adaptar Helpers Actuales
- [ ] **Opción A (Recomendada)**: Crear nuevos helpers que llamen a API
  - `src/utils/api/datosEscuelas.js` → llama a `/api/escuelas`
  - `src/utils/api/datosCursos.js` → llama a `/api/cursos`
  - Mantener misma interfaz que helpers actuales
- [ ] **Opción B**: Modificar helpers existentes para usar API

#### 4.3 Adaptar Login
- [ ] Modificar `Login.jsx` para llamar a `/api/login`
- [ ] Guardar token en localStorage/sessionStorage
- [ ] Redirigir después de login exitoso

#### 4.4 Migrar Módulo por Módulo
- [ ] **Escuelas**: Adaptar `Escuelas.jsx` y `datosEscuelas.js`
- [ ] **Cursos**: Adaptar `Cursos.jsx` y `datosCursos.js`
- [ ] **Asistencia**: Adaptar `Asistencia.jsx` y `datosAsistencia.js`
- [ ] **Trayectorias**: Adaptar `Trayectorias.jsx` y `datosTrayectorias.js`
- [ ] Continuar con resto de módulos...

#### 4.5 Manejo de Estados
- [ ] Agregar estados de loading en componentes
- [ ] Manejo de errores (try/catch, mensajes al usuario)
- [ ] Optimistic updates (opcional)

---

### FASE 5: Migración de Datos (Semana 7)

#### 5.1 Script de Exportación
- [ ] Crear script Node.js que lea localStorage
- [ ] Exportar datos a JSON por módulo
- [ ] Validar estructura de datos

#### 5.2 Script de Importación Laravel
- [ ] Crear comando Artisan: `php artisan import:datos-localstorage`
- [ ] Leer JSON exportado
- [ ] Importar a base de datos
- [ ] Asociar datos a usuario correcto

#### 5.3 Validación Post-Migración
- [ ] Verificar que todos los datos se importaron
- [ ] Comparar conteos (localStorage vs DB)
- [ ] Probar funcionalidad con datos migrados

---

### FASE 6: Testing y Optimización (Semana 8)

#### 6.1 Testing
- [ ] Tests unitarios en Laravel (PHPUnit)
- [ ] Tests de integración API
- [ ] Tests E2E en frontend (opcional)

#### 6.2 Optimización
- [ ] Índices en base de datos
- [ ] Eager loading en relaciones
- [ ] Paginación en endpoints grandes
- [ ] Caché (Redis/Memcached) para datos frecuentes

#### 6.3 Documentación
- [ ] Documentar API (Swagger/OpenAPI)
- [ ] README con instrucciones de setup
- [ ] Guía de migración para usuarios

---

## 🛠️ IMPLEMENTACIÓN TÉCNICA

### Estructura de Proyecto Laravel

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── API/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── EscuelaController.php
│   │   │   │   ├── CursoController.php
│   │   │   │   ├── AlumnoController.php
│   │   │   │   ├── AsistenciaController.php
│   │   │   │   ├── TrayectoriaController.php
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── Requests/
│   │   │   ├── StoreCursoRequest.php
│   │   │   └── ...
│   │   ├── Resources/
│   │   │   ├── EscuelaResource.php
│   │   │   └── ...
│   │   └── Policies/
│   │       ├── CursoPolicy.php
│   │       └── ...
│   ├── Models/
│   │   ├── User.php
│   │   ├── Escuela.php
│   │   ├── Curso.php
│   │   └── ...
│   └── Services/
│       ├── ArchivoService.php
│       └── ImportacionService.php
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   └── api.php
└── storage/
    └── app/
        └── public/
```

### Ejemplo de Controlador

```php
// app/Http/Controllers/API/CursoController.php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Curso;
use App\Http\Resources\CursoResource;
use App\Http\Requests\StoreCursoRequest;
use Illuminate\Http\Request;

class CursoController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $cursos = $user->cursos()->with('escuela')->get();
        
        return CursoResource::collection($cursos);
    }

    public function store(StoreCursoRequest $request)
    {
        $user = $request->user();
        $curso = Curso::create($request->validated());
        $user->cursos()->attach($curso->id);
        
        return new CursoResource($curso);
    }

    public function show(Curso $curso)
    {
        $this->authorize('view', $curso);
        return new CursoResource($curso->load('escuela', 'alumnos'));
    }

    public function update(StoreCursoRequest $request, Curso $curso)
    {
        $this->authorize('update', $curso);
        $curso->update($request->validated());
        
        return new CursoResource($curso);
    }

    public function destroy(Curso $curso)
    {
        $this->authorize('delete', $curso);
        $curso->delete();
        
        return response()->json(['message' => 'Curso eliminado']);
    }
}
```

### Ejemplo de Servicio API en Frontend

```javascript
// src/utils/apiClient.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido, redirigir a login
      localStorage.removeItem('auth_token')
      window.location.hash = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

```javascript
// src/utils/api/datosCursos.js
import api from '../apiClient'

export async function obtenerCursos() {
  try {
    const response = await api.get('/cursos')
    return response.data.data // Si usas API Resources
  } catch (error) {
    console.error('Error al obtener cursos:', error)
    return []
  }
}

export async function guardarCursos(curso) {
  try {
    if (curso.id) {
      const response = await api.put(`/cursos/${curso.id}`, curso)
      return response.data.data
    } else {
      const response = await api.post('/cursos', curso)
      return response.data.data
    }
  } catch (error) {
    console.error('Error al guardar curso:', error)
    throw error
  }
}
```

---

## ⚠️ CONSIDERACIONES Y RIESGOS

### Riesgos Identificados

1. **Pérdida de datos durante migración**
   - Mitigación: Backup completo de localStorage antes de migrar
   - Script de rollback

2. **Downtime durante migración**
   - Mitigación: Migración gradual, mantener frontend funcionando con localStorage mientras se migra

3. **Incompatibilidad de datos**
   - Mitigación: Validar estructura antes de importar
   - Scripts de transformación de datos

4. **Performance en API**
   - Mitigación: Índices en BD, caché, paginación

5. **CORS y seguridad**
   - Mitigación: Configurar CORS correctamente, validar tokens

### Mejores Prácticas

- ✅ Usar transacciones en importación de datos
- ✅ Validar datos antes de guardar
- ✅ Logging de errores
- ✅ Versionado de API (`/api/v1/...`)
- ✅ Rate limiting en endpoints
- ✅ Backup automático de BD

---

## 📅 CRONOGRAMA ESTIMADO

| Fase | Duración | Tareas Principales |
|------|----------|-------------------|
| **Fase 1** | 1 semana | Setup Laravel, migraciones, modelos |
| **Fase 2** | 2 semanas | API básica (Escuelas, Cursos, Alumnos, Asistencia) |
| **Fase 3** | 1 semana | API avanzada (Planificación, Clases, Archivos) |
| **Fase 4** | 2 semanas | Adaptación frontend módulo por módulo |
| **Fase 5** | 1 semana | Migración de datos |
| **Fase 6** | 1 semana | Testing y optimización |
| **TOTAL** | **8 semanas** | ~2 meses |

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. **Revisar y aprobar este plan**
2. **Setup inicial Laravel**:
   ```bash
   composer create-project laravel/laravel backend
   cd backend
   composer require laravel/sanctum
   php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
   ```
3. **Crear primera migración** (tabla `users` ya existe, empezar con `escuelas`)
4. **Configurar CORS** para permitir requests desde React
5. **Crear primer endpoint de prueba** (`GET /api/escuelas`)

---

## 📚 RECURSOS Y DOCUMENTACIÓN

- [Laravel Docs](https://laravel.com/docs)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)
- [Laravel API Resources](https://laravel.com/docs/eloquent-resources)
- [RESTful API Design](https://restfulapi.net/)

---

**¿Listo para comenzar?** 🚀
