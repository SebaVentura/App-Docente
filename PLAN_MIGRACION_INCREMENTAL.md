# 📋 PLAN DE MIGRACIÓN INCREMENTAL: Frontend → Laravel Backend

## 🎯 Objetivo
Migración gradual sin romper funcionalidad existente. Cada fase es independiente y entregable en 2-4 días.

**Estrategia de compatibilidad**: Si no hay backend disponible, usar localStorage (fallback). Si hay backend, sincronizar.

---

## 🔧 FASE 0: Setup Laravel Básico (2-3 días)

### Objetivo
Laravel funcionando con autenticación básica y CORS configurado.

### Backend (Laravel)

#### Archivos a crear:
```
backend/
├── .env (configurar DB y APP_URL)
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── API/
│   │   │       └── AuthController.php
│   │   └── Middleware/
│   │       └── (CORS ya viene en Laravel)
│   └── Models/
│       └── User.php (ya existe)
├── config/
│   ├── cors.php (modificar)
│   └── sanctum.php (ya existe)
├── database/
│   └── migrations/
│       └── 2014_10_12_000000_create_users_table.php (ya existe)
└── routes/
    └── api.php
```

#### Migraciones necesarias:
- ✅ `create_users_table` (ya existe en Laravel)

#### Endpoints mínimos:
```php
// routes/api.php
POST   /api/login          → AuthController@login
POST   /api/logout         → AuthController@logout
GET    /api/me             → AuthController@me (usuario autenticado)
```

#### Código exacto:

**1. `app/Http/Controllers/API/AuthController.php`**
```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales no son correctas.'],
            ]);
        }

        $user = Auth::user();
        $token = $user->createToken('app-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada']);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
            ],
        ]);
    }
}
```

**2. `routes/api.php`**
```php
<?php

use App\Http\Controllers\API\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
```

**3. `config/cors.php` (modificar)**
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => ['http://localhost:5173'], // Vite dev server
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

**4. Instalar Sanctum:**
```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

### Frontend (React)

#### Archivos a crear:
```
src/
├── utils/
│   └── apiClient.js          (nuevo)
└── services/
    └── authService.js        (nuevo)
```

#### Archivos a modificar:
```
src/
├── pages/
│   └── Login.jsx             (adaptar para llamar API)
└── .env                      (agregar VITE_API_URL)
```

#### Código exacto:

**1. `src/utils/apiClient.js` (nuevo)**
```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Interceptor: agregar token si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor: manejar errores 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.hash = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

**2. `src/services/authService.js` (nuevo)**
```javascript
import api from '../utils/apiClient'

export async function login(email, password) {
  try {
    const response = await api.post('/login', { email, password })
    const { token, user } = response.data
    localStorage.setItem('auth_token', token)
    return { success: true, user }
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error al iniciar sesión' 
    }
  }
}

export async function logout() {
  try {
    await api.post('/logout')
    localStorage.removeItem('auth_token')
    return { success: true }
  } catch (error) {
    localStorage.removeItem('auth_token') // Limpiar igual
    return { success: true }
  }
}

export async function getMe() {
  try {
    const response = await api.get('/me')
    return { success: true, user: response.data.user }
  } catch (error) {
    return { success: false, error: error.response?.data }
  }
}

// Verificar si hay backend disponible
export async function checkBackendAvailable() {
  try {
    await api.get('/me')
    return true
  } catch {
    return false
  }
}
```

**3. `src/pages/Login.jsx` (modificar)**
```javascript
// Agregar import
import { login } from '../services/authService'

// Modificar handleSubmit:
const handleSubmit = async (e) => {
  e.preventDefault()
  setCargando(true)
  
  // Intentar login con backend
  const result = await login(email, password)
  
  if (result.success) {
    // Guardar flag de que backend está disponible
    localStorage.setItem('backend_available', 'true')
    if (onLogin) {
      onLogin()
    }
  } else {
    // Si falla, intentar modo offline (localStorage)
    // Por ahora mostrar error, luego implementar fallback
    alert(result.error || 'Error al iniciar sesión')
  }
  
  setCargando(false)
}
```

**4. `.env` (agregar)**
```env
VITE_API_URL=http://localhost:8000/api
```

### Checklist Fase 0:
- [ ] Laravel instalado y corriendo
- [ ] Sanctum configurado
- [ ] CORS configurado
- [ ] Endpoint `/api/login` funciona
- [ ] Endpoint `/api/me` funciona (con token)
- [ ] Frontend puede hacer login y guardar token
- [ ] Frontend detecta si backend está disponible

---

## 🏫 FASE 1: Escuelas y Cursos (3-4 días)

### Objetivo
Persistir Escuelas y Cursos en backend, manteniendo compatibilidad con localStorage.

### Backend (Laravel)

#### Migraciones necesarias (3 tablas):
```bash
php artisan make:migration create_escuelas_table
php artisan make:migration create_cursos_table
php artisan make:migration create_curso_usuario_table
```

**1. `database/migrations/XXXX_create_escuelas_table.php`**
```php
Schema::create('escuelas', function (Blueprint $table) {
    $table->id();
    $table->string('nombre');
    $table->timestamps();
});
```

**2. `database/migrations/XXXX_create_cursos_table.php`**
```php
Schema::create('cursos', function (Blueprint $table) {
    $table->id();
    $table->string('nombre');
    $table->foreignId('escuela_id')->constrained()->onDelete('cascade');
    $table->json('horarios')->nullable(); // [{dia, desde, hasta}, ...]
    $table->timestamps();
});
```

**3. `database/migrations/XXXX_create_curso_usuario_table.php`**
```php
Schema::create('curso_usuario', function (Blueprint $table) {
    $table->id();
    $table->foreignId('curso_id')->constrained()->onDelete('cascade');
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->timestamps();
    
    $table->unique(['curso_id', 'user_id']);
});
```

#### Modelos:

**1. `app/Models/Escuela.php`**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Escuela extends Model
{
    protected $fillable = ['nombre'];

    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class);
    }
}
```

**2. `app/Models/Curso.php`**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Curso extends Model
{
    protected $fillable = ['nombre', 'escuela_id', 'horarios'];

    protected $casts = [
        'horarios' => 'array',
    ];

    public function escuela(): BelongsTo
    {
        return $this->belongsTo(Escuela::class);
    }

    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'curso_usuario');
    }
}
```

**3. `app/Models/User.php` (agregar relación)**
```php
public function cursos(): BelongsToMany
{
    return $this->belongsToMany(Curso::class, 'curso_usuario');
}
```

#### Controladores:

**1. `app/Http/Controllers/API/EscuelaController.php`**
```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Escuela;
use Illuminate\Http\Request;

class EscuelaController extends Controller
{
    public function index()
    {
        $escuelas = Escuela::orderBy('nombre')->get();
        return response()->json($escuelas);
    }

    public function store(Request $request)
    {
        $request->validate(['nombre' => 'required|string|max:255']);
        $escuela = Escuela::create($request->only('nombre'));
        return response()->json($escuela, 201);
    }

    public function update(Request $request, Escuela $escuela)
    {
        $request->validate(['nombre' => 'required|string|max:255']);
        $escuela->update($request->only('nombre'));
        return response()->json($escuela);
    }

    public function destroy(Escuela $escuela)
    {
        $escuela->delete();
        return response()->json(['message' => 'Escuela eliminada']);
    }
}
```

**2. `app/Http/Controllers/API/CursoController.php`**
```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Curso;
use Illuminate\Http\Request;

class CursoController extends Controller
{
    public function index(Request $request)
    {
        // Solo cursos del usuario autenticado
        $cursos = $request->user()->cursos()->with('escuela')->get();
        return response()->json($cursos);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'escuela_id' => 'required|exists:escuelas,id',
            'horarios' => 'nullable|array',
        ]);

        $curso = Curso::create($request->only(['nombre', 'escuela_id', 'horarios']));
        $request->user()->cursos()->attach($curso->id);

        return response()->json($curso->load('escuela'), 201);
    }

    public function update(Request $request, Curso $curso)
    {
        // Verificar que el curso pertenece al usuario
        if (!$request->user()->cursos()->where('curso_id', $curso->id)->exists()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $request->validate([
            'nombre' => 'required|string|max:255',
            'escuela_id' => 'required|exists:escuelas,id',
            'horarios' => 'nullable|array',
        ]);

        $curso->update($request->only(['nombre', 'escuela_id', 'horarios']));
        return response()->json($curso->load('escuela'));
    }

    public function destroy(Request $request, Curso $curso)
    {
        if (!$request->user()->cursos()->where('curso_id', $curso->id)->exists()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $curso->delete();
        return response()->json(['message' => 'Curso eliminado']);
    }
}
```

#### Rutas:

**`routes/api.php` (agregar)**
```php
use App\Http\Controllers\API\EscuelaController;
use App\Http\Controllers\API\CursoController;

Route::middleware('auth:sanctum')->group(function () {
    // Escuelas
    Route::apiResource('escuelas', EscuelaController::class);
    
    // Cursos
    Route::get('cursos', [CursoController::class, 'index']);
    Route::post('cursos', [CursoController::class, 'store']);
    Route::put('cursos/{curso}', [CursoController::class, 'update']);
    Route::delete('cursos/{curso}', [CursoController::class, 'destroy']);
});
```

### Frontend (React)

#### Archivos a crear:
```
src/
└── utils/
    └── api/
        ├── datosEscuelas.js    (nuevo, wrapper API)
        └── datosCursos.js       (nuevo, wrapper API)
```

#### Archivos a modificar:
```
src/
└── utils/
    ├── datosEscuelas.js         (modificar: agregar fallback)
    └── datosCursos.js           (modificar: agregar fallback)
```

#### Código exacto:

**1. `src/utils/api/datosEscuelas.js` (nuevo)**
```javascript
import api from '../apiClient'
import * as datosEscuelasLocal from '../datosEscuelas'

// Verificar si backend está disponible
async function usarBackend() {
  const token = localStorage.getItem('auth_token')
  return !!token && localStorage.getItem('backend_available') === 'true'
}

export async function obtenerEscuelas() {
  if (await usarBackend()) {
    try {
      const response = await api.get('/escuelas')
      return response.data
    } catch (error) {
      console.error('Error API escuelas, usando localStorage:', error)
      return datosEscuelasLocal.obtenerEscuelas()
    }
  }
  return datosEscuelasLocal.obtenerEscuelas()
}

export async function guardarEscuelas(escuelas) {
  if (await usarBackend()) {
    try {
      // Si es array, guardar todas (para compatibilidad)
      if (Array.isArray(escuelas)) {
        // Por ahora, solo guardar la última (simplificado)
        // En producción, hacer sync completo
        return { success: true }
      }
      return { success: true }
    } catch (error) {
      console.error('Error API escuelas, usando localStorage:', error)
      datosEscuelasLocal.guardarEscuelas(escuelas)
      return { success: true }
    }
  }
  datosEscuelasLocal.guardarEscuelas(escuelas)
  return { success: true }
}

// Funciones específicas para API
export async function crearEscuela(nombre) {
  if (await usarBackend()) {
    try {
      const response = await api.post('/escuelas', { nombre })
      return { success: true, data: response.data }
    } catch (error) {
      throw error
    }
  }
  // Fallback a localStorage
  const escuelas = datosEscuelasLocal.obtenerEscuelas()
  const nueva = {
    id: datosEscuelasLocal.generarIdEscuela(escuelas),
    nombre
  }
  escuelas.push(nueva)
  datosEscuelasLocal.guardarEscuelas(escuelas)
  return { success: true, data: nueva }
}

export async function actualizarEscuela(id, nombre) {
  if (await usarBackend()) {
    try {
      const response = await api.put(`/escuelas/${id}`, { nombre })
      return { success: true, data: response.data }
    } catch (error) {
      throw error
    }
  }
  // Fallback
  const escuelas = datosEscuelasLocal.obtenerEscuelas()
  const index = escuelas.findIndex(e => e.id === id)
  if (index !== -1) {
    escuelas[index].nombre = nombre
    datosEscuelasLocal.guardarEscuelas(escuelas)
    return { success: true, data: escuelas[index] }
  }
  throw new Error('Escuela no encontrada')
}

export async function eliminarEscuela(id) {
  if (await usarBackend()) {
    try {
      await api.delete(`/escuelas/${id}`)
      return { success: true }
    } catch (error) {
      throw error
    }
  }
  // Fallback
  const escuelas = datosEscuelasLocal.obtenerEscuelas()
  const filtradas = escuelas.filter(e => e.id !== id)
  datosEscuelasLocal.guardarEscuelas(filtradas)
  return { success: true }
}
```

**2. `src/utils/api/datosCursos.js` (nuevo)**
```javascript
import api from '../apiClient'
import * as datosCursosLocal from '../datosCursos'

async function usarBackend() {
  const token = localStorage.getItem('auth_token')
  return !!token && localStorage.getItem('backend_available') === 'true'
}

export async function obtenerCursos() {
  if (await usarBackend()) {
    try {
      const response = await api.get('/cursos')
      return response.data
    } catch (error) {
      console.error('Error API cursos, usando localStorage:', error)
      return datosCursosLocal.obtenerCursos()
    }
  }
  return datosCursosLocal.obtenerCursos()
}

export async function crearCurso(curso) {
  if (await usarBackend()) {
    try {
      const response = await api.post('/cursos', curso)
      return { success: true, data: response.data }
    } catch (error) {
      throw error
    }
  }
  // Fallback
  const cursos = datosCursosLocal.obtenerCursos()
  const nuevo = {
    ...curso,
    id: datosCursosLocal.generarIdCurso(cursos)
  }
  cursos.push(nuevo)
  datosCursosLocal.guardarCursos(cursos)
  return { success: true, data: nuevo }
}

export async function actualizarCurso(id, curso) {
  if (await usarBackend()) {
    try {
      const response = await api.put(`/cursos/${id}`, curso)
      return { success: true, data: response.data }
    } catch (error) {
      throw error
    }
  }
  // Fallback
  const cursos = datosCursosLocal.obtenerCursos()
  const index = cursos.findIndex(c => c.id === id)
  if (index !== -1) {
    cursos[index] = { ...cursos[index], ...curso }
    datosCursosLocal.guardarCursos(cursos)
    return { success: true, data: cursos[index] }
  }
  throw new Error('Curso no encontrado')
}

export async function eliminarCurso(id) {
  if (await usarBackend()) {
    try {
      await api.delete(`/cursos/${id}`)
      return { success: true }
    } catch (error) {
      throw error
    }
  }
  // Fallback
  const cursos = datosCursosLocal.obtenerCursos()
  const filtrados = cursos.filter(c => c.id !== id)
  datosCursosLocal.guardarCursos(filtrados)
  return { success: true }
}
```

**3. Modificar componentes que usan escuelas/cursos:**

**`src/pages/Escuelas.jsx`** - Cambiar imports:
```javascript
// Antes:
import { obtenerEscuelas, guardarEscuelas, generarIdEscuela } from '../utils/datosEscuelas'

// Después:
import { obtenerEscuelas, crearEscuela, actualizarEscuela, eliminarEscuela } from '../utils/api/datosEscuelas'
```

**`src/pages/Cursos.jsx`** - Cambiar imports:
```javascript
// Antes:
import { obtenerCursos, guardarCursos, generarIdCurso } from '../utils/datosCursos'

// Después:
import { obtenerCursos, crearCurso, actualizarCurso, eliminarCurso } from '../utils/api/datosCursos'
```

### Checklist Fase 1:
- [ ] Migraciones ejecutadas (escuelas, cursos, curso_usuario)
- [ ] Modelos creados con relaciones
- [ ] Controladores funcionando
- [ ] Endpoints probados con Postman
- [ ] Frontend adaptado con fallback a localStorage
- [ ] Escuelas funcionan (crear/editar/eliminar)
- [ ] Cursos funcionan (crear/editar/eliminar)
- [ ] Si no hay backend, sigue usando localStorage

---

## 📅 FASE 2: Horarios (Agenda) (2-3 días)

### Objetivo
Los horarios ya están en `curso.horarios` (JSON). Solo asegurar que se persisten correctamente.

### Backend (Laravel)

#### Cambios mínimos:
- ✅ Los horarios ya se guardan en `cursos.horarios` (JSON) - **NO necesita cambios**
- Solo validar que el JSON se guarda/lee correctamente

#### Validación adicional (opcional):

**`app/Http/Requests/StoreCursoRequest.php`** (crear si no existe)
```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCursoRequest extends FormRequest
{
    public function rules()
    {
        return [
            'nombre' => 'required|string|max:255',
            'escuela_id' => 'required|exists:escuelas,id',
            'horarios' => 'nullable|array',
            'horarios.*.dia' => 'required|string',
            'horarios.*.desde' => 'required|string|regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/',
            'horarios.*.hasta' => 'required|string|regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/',
        ];
    }
}
```

### Frontend (React)

#### Cambios mínimos:
- ✅ Los horarios ya se guardan en `curso.horarios` - **NO necesita cambios**
- Solo verificar que al crear/editar curso, los horarios se envían correctamente

#### Verificación:

**`src/pages/Cursos.jsx`** - Asegurar que al guardar curso se incluyen horarios:
```javascript
// Al crear/editar curso, asegurar que horarios se incluyen:
const cursoData = {
  nombre: curso.nombre,
  escuelaId: curso.escuelaId,
  horarios: curso.horarios || [] // ← Asegurar que se incluye
}
```

### Checklist Fase 2:
- [ ] Horarios se guardan correctamente en backend
- [ ] Dashboard muestra horarios desde backend
- [ ] Crear/editar curso mantiene horarios
- [ ] Fallback a localStorage funciona si no hay backend

---

## ✅ FASE 3: Asistencia (3-4 días)

### Objetivo
Persistir asistencias en backend.

### Backend (Laravel)

#### Migración necesaria (1 tabla):
```bash
php artisan make:migration create_asistencias_table
```

**`database/migrations/XXXX_create_asistencias_table.php`**
```php
Schema::create('asistencias', function (Blueprint $table) {
    $table->id();
    $table->foreignId('curso_id')->constrained()->onDelete('cascade');
    $table->foreignId('alumno_id')->constrained()->onDelete('cascade');
    $table->date('fecha');
    $table->boolean('presente')->default(false);
    $table->boolean('tarde')->default(false);
    $table->time('horaIngreso')->nullable();
    $table->text('observaciones')->nullable();
    $table->timestamps();
    
    $table->unique(['curso_id', 'alumno_id', 'fecha']);
    $table->index(['curso_id', 'fecha']);
});
```

**Nota**: Necesitarás también la tabla `alumnos` (se puede hacer en esta fase o antes).

#### Modelo:

**`app/Models/Asistencia.php`**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asistencia extends Model
{
    protected $fillable = [
        'curso_id', 'alumno_id', 'fecha', 
        'presente', 'tarde', 'horaIngreso', 'observaciones'
    ];

    protected $casts = [
        'fecha' => 'date',
        'presente' => 'boolean',
        'tarde' => 'boolean',
        'horaIngreso' => 'datetime',
    ];

    public function curso()
    {
        return $this->belongsTo(Curso::class);
    }

    public function alumno()
    {
        return $this->belongsTo(Alumno::class);
    }
}
```

#### Controlador:

**`app/Http/Controllers/API/AsistenciaController.php`**
```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Asistencia;
use Illuminate\Http\Request;

class AsistenciaController extends Controller
{
    public function index(Request $request, $cursoId, $fecha = null)
    {
        $query = Asistencia::where('curso_id', $cursoId);
        
        if ($fecha) {
            $query->where('fecha', $fecha);
        }
        
        return response()->json($query->with('alumno')->get());
    }

    public function store(Request $request, $cursoId)
    {
        $request->validate([
            'fecha' => 'required|date',
            'asistencias' => 'required|array', // { alumnoId: { presente, tarde, horaIngreso } }
        ]);

        $fecha = $request->fecha;
        $asistencias = $request->asistencias;

        foreach ($asistencias as $alumnoId => $data) {
            Asistencia::updateOrCreate(
                [
                    'curso_id' => $cursoId,
                    'alumno_id' => $alumnoId,
                    'fecha' => $fecha,
                ],
                [
                    'presente' => $data['presente'] ?? false,
                    'tarde' => $data['tarde'] ?? false,
                    'horaIngreso' => $data['horaIngreso'] ?? null,
                    'observaciones' => $data['observaciones'] ?? null,
                ]
            );
        }

        return response()->json(['message' => 'Asistencias guardadas'], 201);
    }
}
```

#### Ruta:

**`routes/api.php` (agregar)**
```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('cursos/{cursoId}/asistencias', [AsistenciaController::class, 'index']);
    Route::post('cursos/{cursoId}/asistencias', [AsistenciaController::class, 'store']);
});
```

### Frontend (React)

#### Archivo a crear:
```
src/utils/api/datosAsistencia.js
```

#### Archivo a modificar:
```
src/utils/datosAsistencia.js (agregar fallback)
```

**`src/utils/api/datosAsistencia.js` (nuevo)**
```javascript
import api from '../apiClient'
import * as datosAsistenciaLocal from '../datosAsistencia'

async function usarBackend() {
  const token = localStorage.getItem('auth_token')
  return !!token && localStorage.getItem('backend_available') === 'true'
}

export async function obtenerAsistencia(fecha, cursoId) {
  if (await usarBackend()) {
    try {
      const response = await api.get(`/cursos/${cursoId}/asistencias?fecha=${fecha}`)
      // Transformar a formato esperado por frontend
      const asistencias = {}
      response.data.forEach(a => {
        asistencias[a.alumno_id] = {
          presente: a.presente,
          tarde: a.tarde,
          horaIngreso: a.horaIngreso
        }
      })
      return asistencias
    } catch (error) {
      console.error('Error API asistencia, usando localStorage:', error)
      return datosAsistenciaLocal.obtenerAsistencia(fecha, cursoId)
    }
  }
  return datosAsistenciaLocal.obtenerAsistencia(fecha, cursoId)
}

export async function guardarAsistencia(fecha, cursoId, datos) {
  if (await usarBackend()) {
    try {
      await api.post(`/cursos/${cursoId}/asistencias`, {
        fecha,
        asistencias: datos
      })
      return { success: true }
    } catch (error) {
      console.error('Error API asistencia, usando localStorage:', error)
      datosAsistenciaLocal.guardarAsistencia(fecha, cursoId, datos)
      return { success: true }
    }
  }
  datosAsistenciaLocal.guardarAsistencia(fecha, cursoId, datos)
  return { success: true }
}
```

### Checklist Fase 3:
- [ ] Migración de asistencias ejecutada
- [ ] Endpoint de asistencia funciona
- [ ] Frontend guarda asistencias en backend
- [ ] Dashboard lee asistencias desde backend
- [ ] Fallback a localStorage funciona

---

## 📊 FASES SIGUIENTES (Después de Fase 3)

### Fase 4: Alumnos (2-3 días)
- Tabla `alumnos`
- CRUD alumnos
- Importar desde Excel

### Fase 5: Trayectorias (3-4 días)
- Tabla `trayectorias`
- Registros por alumno

### Fase 6: Otros módulos
- Seguimiento
- Diagnósticos
- Planificación
- Clases
- Imponderables

---

## 🔄 ESTRATEGIA DE COMPATIBILIDAD

### Patrón de Fallback

Cada helper API debe seguir este patrón:

```javascript
async function usarBackend() {
  const token = localStorage.getItem('auth_token')
  return !!token && localStorage.getItem('backend_available') === 'true'
}

export async function obtenerDatos() {
  if (await usarBackend()) {
    try {
      const response = await api.get('/endpoint')
      return response.data
    } catch (error) {
      // Si falla API, usar localStorage
      console.error('Error API, usando localStorage:', error)
      return datosLocal.obtenerDatos()
    }
  }
  // Si no hay backend, usar localStorage
  return datosLocal.obtenerDatos()
}
```

### Sincronización (Futuro)

Una vez que todas las fases estén completas, implementar:

1. **Script de migración inicial**: Exportar localStorage → Importar a BD
2. **Sync bidireccional**: Si hay cambios offline, sincronizar al conectar
3. **Conflictos**: Resolver con "último cambio gana" o merge manual

---

## ✅ CHECKLIST GENERAL POR FASE

Para cada fase:

- [ ] Backend: Migraciones ejecutadas
- [ ] Backend: Modelos y relaciones creados
- [ ] Backend: Controladores funcionando
- [ ] Backend: Endpoints probados (Postman)
- [ ] Frontend: Helpers API creados
- [ ] Frontend: Fallback a localStorage implementado
- [ ] Frontend: Componentes adaptados
- [ ] Testing: Funciona con backend
- [ ] Testing: Funciona sin backend (localStorage)
- [ ] Documentación: Endpoints documentados

---

## 🚀 PRÓXIMOS PASOS

1. **Revisar y aprobar este plan**
2. **Comenzar Fase 0**: Setup Laravel básico
3. **Probar login/logout** con Postman
4. **Adaptar Login.jsx** para usar API
5. **Continuar con Fase 1** cuando Fase 0 esté completa

---

**¿Listo para comenzar Fase 0?** 🚀
