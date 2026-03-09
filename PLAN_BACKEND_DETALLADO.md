# Plan detallado: Backend Laravel + MariaDB (la-app-del-docente-api)

**Solo plan. No implementar hasta autorización.**

---

## 1. Alcance y restricciones

### 1.1 Objetivo

Reemplazar **localStorage e IndexedDB** por persistencia en MariaDB vía API REST. La lógica de negocio del MVP **no cambia**.

### 1.2 Qué NO se mueve al backend

- **Declaración Jurada:** se arma dinámicamente en el frontend.
- **Excel de DJ:** se genera en el frontend (ExcelJS).
- **PDF borrador de DJ:** se genera en el frontend.
- **Lógica de preparación de datos DJ:** permanece en el frontend.

### 1.3 Qué sí persiste el backend

- Perfil del docente
- Escuelas
- Cursos (incl. campos DJ: situacion_revista, tipo_carga, cantidad_carga)
- Alumnos
- Clases
- Asistencia
- Materiales
- Diagnósticos
- Planificación

### 1.4 Stack

| Componente | Tecnología |
|------------|------------|
| Framework | Laravel 11+ |
| Base de datos | MariaDB |
| Autenticación | Laravel Sanctum |
| API | REST JSON |

---

## 2. Migraciones completas

### 2.1 Convenciones

- **Nombres técnicos:** Sin acentos ni ñ (anio, domicilio, localidad, etc.).
- **users:** Se mantiene tal cual Laravel (compatibilidad auth).
- **Resto:** Tablas y columnas en español.

### 2.2 Orden de creación (respetar foreign keys)

1. `users` (Laravel base)
2. `perfiles_docentes`
3. `escuelas`
4. `cursos`
5. `alumnos`
6. `clases`
7. `asistencias`
8. `registros_clase`
9. `materiales`
10. `diagnosticos`
11. `planificaciones`

### 2.3 Esquema de cada tabla

#### 2.3.1 users (Laravel base, sin cambios)

```
id                  BIGINT UNSIGNED PK AUTO_INCREMENT
name                VARCHAR(255) NOT NULL
email               VARCHAR(255) UNIQUE NOT NULL
email_verified_at   TIMESTAMP NULL
password            VARCHAR(255) NOT NULL
remember_token      VARCHAR(100) NULL
created_at          TIMESTAMP NULL
updated_at          TIMESTAMP NULL
```

#### 2.3.2 perfiles_docentes

```
id          BIGINT UNSIGNED PK AUTO_INCREMENT
user_id     BIGINT UNSIGNED NOT NULL UNIQUE FK -> users(id) ON DELETE CASCADE
nombres     VARCHAR(255) NULL
apellidos   VARCHAR(255) NULL
dni         VARCHAR(20) NULL
cuil        VARCHAR(20) NULL
domicilio   TEXT NULL
localidad   VARCHAR(255) NULL
provincia   VARCHAR(255) NULL
telefono    VARCHAR(50) NULL
created_at  TIMESTAMP NULL
updated_at  TIMESTAMP NULL
```

#### 2.3.3 escuelas

```
id          BIGINT UNSIGNED PK AUTO_INCREMENT
user_id     BIGINT UNSIGNED NOT NULL FK -> users(id) ON DELETE CASCADE
nombre      VARCHAR(255) NOT NULL
localidad   VARCHAR(255) NULL
provincia   VARCHAR(255) NULL
created_at  TIMESTAMP NULL
updated_at  TIMESTAMP NULL
INDEX idx_user (user_id)
```

#### 2.3.4 cursos

```
id                  BIGINT UNSIGNED PK AUTO_INCREMENT
user_id             BIGINT UNSIGNED NOT NULL FK -> users(id) ON DELETE CASCADE
escuela_id          BIGINT UNSIGNED NOT NULL FK -> escuelas(id) ON DELETE CASCADE
nombre              VARCHAR(255) NOT NULL
materia             VARCHAR(255) NULL
anio                VARCHAR(20) NULL
division            VARCHAR(20) NULL
turno               VARCHAR(50) NULL
situacion_revista   VARCHAR(100) NULL
tipo_carga          VARCHAR(100) NULL
cantidad_carga      VARCHAR(50) NULL
horarios            JSON NULL
created_at          TIMESTAMP NULL
updated_at          TIMESTAMP NULL
INDEX idx_user (user_id)
INDEX idx_escuela (escuela_id)
```

*horarios: [{ dia, desde, hasta }] para compatibilidad con DJ en frontend.*

#### 2.3.5 alumnos

```
id          BIGINT UNSIGNED PK AUTO_INCREMENT
curso_id    BIGINT UNSIGNED NOT NULL FK -> cursos(id) ON DELETE CASCADE
apellidos   VARCHAR(255) NOT NULL
nombres     VARCHAR(255) NOT NULL
legajo      VARCHAR(50) NULL
created_at  TIMESTAMP NULL
updated_at  TIMESTAMP NULL
INDEX idx_curso (curso_id)
UNIQUE KEY unique_curso_legajo (curso_id, legajo) -- opcional, solo si legajo se usa de forma consistente
```

#### 2.3.6 clases

```
id          BIGINT UNSIGNED PK AUTO_INCREMENT
curso_id    BIGINT UNSIGNED NOT NULL FK -> cursos(id) ON DELETE CASCADE
fecha       DATE NOT NULL
titulo      VARCHAR(255) NULL
created_at  TIMESTAMP NULL
updated_at  TIMESTAMP NULL
UNIQUE KEY unique_curso_fecha (curso_id, fecha)
INDEX idx_curso (curso_id)
INDEX idx_fecha (fecha)
```

#### 2.3.7 asistencias

```
id          BIGINT UNSIGNED PK AUTO_INCREMENT
clase_id    BIGINT UNSIGNED NOT NULL FK -> clases(id) ON DELETE CASCADE
alumno_id   BIGINT UNSIGNED NOT NULL FK -> alumnos(id) ON DELETE CASCADE
estado      ENUM('present','absent','late','justified') DEFAULT 'present'
comentario  TEXT NULL
created_at  TIMESTAMP NULL
updated_at  TIMESTAMP NULL
UNIQUE KEY unique_clase_alumno (clase_id, alumno_id)
INDEX idx_clase (clase_id)
INDEX idx_alumno (alumno_id)
```

**Valores internos de estado (sin acentos, estables):** `present`, `absent`, `late`, `justified`.  
**Mapeo a etiquetas en español (frontend):** present → "Presente", absent → "Ausente", late → "Tarde", justified → "Justificado".  
*Decisión: El MVP actual puede usar español en localStorage; el backend usa valores internos estables. El frontend traduce al mostrar y envía valores internos al API.*

#### 2.3.8 registros_clase

```
id          BIGINT UNSIGNED PK AUTO_INCREMENT
clase_id    BIGINT UNSIGNED NOT NULL FK -> clases(id) ON DELETE CASCADE
contenido   TEXT NULL
created_at  TIMESTAMP NULL
updated_at  TIMESTAMP NULL
INDEX idx_clase (clase_id)
```

*Se usa INDEX (varios registros por clase). Si el MVP tiene 1 registro por clase, considerar UNIQUE(clase_id).*

#### 2.3.9 materiales

```
id           BIGINT UNSIGNED PK AUTO_INCREMENT
curso_id     BIGINT UNSIGNED NOT NULL FK -> cursos(id) ON DELETE CASCADE
clase_id     BIGINT UNSIGNED NULL FK -> clases(id) ON DELETE SET NULL
seccion      ENUM('teoria','practica') NOT NULL
tipo         ENUM('link','drive','pdf') NOT NULL
titulo       VARCHAR(255) NULL
url          TEXT NULL
ruta_storage VARCHAR(500) NULL
created_at   TIMESTAMP NULL
updated_at   TIMESTAMP NULL
INDEX idx_curso (curso_id)
INDEX idx_clase (clase_id)
```

- **seccion:** teoria | practica — separa secciones en la UI.
- **tipo:** link | drive | pdf — tipo de recurso. **MVP: solo `link`.**
- **ruta_storage:** nullable; en MVP no se suben archivos.

#### 2.3.10 diagnosticos

```
id          BIGINT UNSIGNED PK AUTO_INCREMENT
curso_id    BIGINT UNSIGNED NOT NULL FK -> cursos(id) ON DELETE CASCADE
alumno_id   BIGINT UNSIGNED NULL FK -> alumnos(id) ON DELETE CASCADE
texto       TEXT NOT NULL
evidencia   TEXT NULL
created_at  TIMESTAMP NULL
updated_at  TIMESTAMP NULL
INDEX idx_curso (curso_id)
INDEX idx_alumno (alumno_id)
```

- **alumno_id nullable:** null = grupal, no null = individual. No se usa columna `tipo` en MVP.
- **texto:** contenido del diagnóstico.
- **evidencia:** text o JSON nullable.

#### 2.3.11 planificaciones

```
id              BIGINT UNSIGNED PK AUTO_INCREMENT
curso_id        BIGINT UNSIGNED NOT NULL FK -> cursos(id) ON DELETE CASCADE
titulo          VARCHAR(255) NULL
contenido       LONGTEXT NULL
fuentes         TEXT NULL
programa_texto  TEXT NULL
plan            JSON NULL
created_at      TIMESTAMP NULL
updated_at      TIMESTAMP NULL
UNIQUE KEY unique_curso_planificacion (curso_id)
INDEX idx_curso (curso_id)
```

### 2.4 Decisión: modelo de asistencia

**Usar clases + asistencias** (no attendance_by_date). El frontend crea una clase con `fecha` para cada día; la asistencia se asocia a esa clase. Modelo normalizado y sin duplicar fechas.

### 2.5 Constraints e índices consolidados

| Tabla | Constraint/Índice | Descripción |
|-------|-------------------|-------------|
| perfiles_docentes | `UNIQUE(user_id)` | Un perfil por usuario |
| escuelas | `INDEX(user_id)` | FK |
| cursos | `INDEX(user_id)`, `INDEX(escuela_id)` | FKs |
| alumnos | `INDEX(curso_id)` | FK |
| alumnos | `UNIQUE(curso_id, legajo)` | Opcional |
| clases | `UNIQUE(curso_id, fecha)` | Una clase por curso y fecha |
| clases | `INDEX(curso_id)` | FK |
| asistencias | `UNIQUE(clase_id, alumno_id)` | Un registro por clase-alumno |
| asistencias | `INDEX(clase_id)`, `INDEX(alumno_id)` | FKs |
| registros_clase | `INDEX(clase_id)` | FK |
| materiales | `INDEX(curso_id)`, `INDEX(clase_id)` | FKs |
| diagnosticos | `INDEX(curso_id)`, `INDEX(alumno_id)` | FKs |
| planificaciones | `UNIQUE(curso_id)` | Un plan por curso |
| planificaciones | `INDEX(curso_id)` | FK |

### 2.6 Enums y validaciones mínimas

| Campo | Tabla | Tipo | Valores / Regla |
|-------|-------|------|-----------------|
| estado | asistencias | ENUM | `present`, `absent`, `late`, `justified` |
| seccion | materiales | ENUM | `teoria`, `practica` |
| tipo | materiales | ENUM | `link`, `drive`, `pdf` — **MVP: solo `link`** |
| tipo_carga | cursos | VARCHAR | Validar contra lista (ej. Titular, Suplente, Interino) |
| cantidad_carga | cursos | VARCHAR(50) | Validar formato (ej. "1", "0.5", "0.25") |

*Validación en Form Requests: rechazar con 422 si el valor no está permitido.*

---

## 3. Relaciones Eloquent

### 3.1 User

- `hasOne(PerfilDocente::class)`
- `hasMany(Escuela::class)`
- `hasMany(Curso::class)` (vía escuela o directo según modelo)

### 3.2 PerfilDocente

- `belongsTo(User::class)`

### 3.3 Escuela

- `belongsTo(User::class)`
- `hasMany(Curso::class)`

### 3.4 Curso

- `belongsTo(User::class)`
- `belongsTo(Escuela::class)`
- `hasMany(Alumno::class)`
- `hasMany(Clase::class)`
- `hasMany(Material::class)`
- `hasMany(Diagnostico::class)`
- `hasOne(Planificacion::class)`

### 3.5 Alumno

- `belongsTo(Curso::class)`
- `hasMany(Asistencia::class)`
- `hasMany(Diagnostico::class)` (nullable, alumno_id)

### 3.6 Clase

- `belongsTo(Curso::class)`
- `hasMany(Asistencia::class)`
- `hasMany(RegistroClase::class)`
- `hasMany(Material::class)` (clase_id nullable)

### 3.7 Asistencia

- `belongsTo(Clase::class)`
- `belongsTo(Alumno::class)`

### 3.8 RegistroClase

- `belongsTo(Clase::class)`

### 3.9 Material

- `belongsTo(Curso::class)`
- `belongsTo(Clase::class)` (nullable)

### 3.10 Diagnostico

- `belongsTo(Curso::class)`
- `belongsTo(Alumno::class)` (nullable)

### 3.11 Planificacion

- `belongsTo(Curso::class)`

---

## 4. Controladores necesarios

| Controlador | Responsabilidad |
|-------------|-----------------|
| `AuthController` | login, logout, me |
| `PerfilController` | GET/PUT perfil |
| `EscuelaController` | CRUD escuelas |
| `CursoController` | CRUD cursos |
| `AlumnoController` | CRUD alumnos |
| `ClaseController` | CRUD clases |
| `AsistenciaController` | Crear/actualizar asistencias por clase |
| `RegistroClaseController` | GET/POST registro por clase |
| `MaterialController` | CRUD materiales |
| `DiagnosticoController` | CRUD diagnosticos |
| `PlanificacionController` | CRUD planificaciones |
| `SyncController` | bootstrap, dump |

---

## 5. Rutas api.php (en español)

```
// Auth (login publico, resto auth:sanctum)
POST   /api/login
POST   /api/logout
GET    /api/me

// Perfil
GET    /api/perfil
PUT    /api/perfil

// Escuelas
GET    /api/escuelas
POST   /api/escuelas
PUT    /api/escuelas/{id}
DELETE /api/escuelas/{id}

// Cursos
GET    /api/escuelas/{id}/cursos
POST   /api/escuelas/{id}/cursos
PUT    /api/cursos/{id}
DELETE /api/cursos/{id}

// Alumnos
GET    /api/cursos/{id}/alumnos
POST   /api/cursos/{id}/alumnos
PUT    /api/alumnos/{id}
DELETE /api/alumnos/{id}

// Clases
GET    /api/cursos/{id}/clases
POST   /api/cursos/{id}/clases
PUT    /api/clases/{id}
DELETE /api/clases/{id}

// Asistencias
POST   /api/clases/{id}/asistencias
GET    /api/clases/{id}/asistencias   (opcional)

// Registro de clase
GET    /api/clases/{id}/registro
POST   /api/clases/{id}/registro

// Materiales
GET    /api/cursos/{id}/materiales
POST   /api/cursos/{id}/materiales
PUT    /api/materiales/{id}
DELETE /api/materiales/{id}

// Diagnosticos
GET    /api/alumnos/{id}/diagnosticos
POST   /api/alumnos/{id}/diagnosticos

// Planificaciones
GET    /api/cursos/{id}/planificaciones
POST   /api/cursos/{id}/planificaciones
PUT    /api/planificaciones/{id}

// Sync
POST   /api/sync/bootstrap
GET    /api/sync/dump
```

---

## 6. Estrategia de sincronización inicial

### 6.1 POST /api/sync/bootstrap

**Propósito:** Migrar datos desde localStorage al backend en la primera conexión.

**Payload esperado:**

```json
{
  "profile": { "nombres", "apellidos", "dni", "cuil", "domicilio", "localidad", "provincia", "telefono" },
  "schools": [ { "id", "nombre", "localidad", "provincia" } ],
  "courses": [ { "id", "escuelaId", "nombre", "materia", "anio", "division", "turno", "situacion_revista", "tipo_carga", "cantidad_carga", "horarios" } ],
  "students": [ { "cursoId", "apellidos", "nombres", "legajo" } ],
  "classes": [ { "cursoId", "fecha", "titulo" } ],
  "attendance": { "fecha": { "cursoId": { "alumnoId": { "estado" } } } },
  "materials": [ ... ],
  "diagnostics": [ ... ],
  "plans": { "cursoId": { "titulo", "contenido", "fuentes", "programa_texto", "plan" } }
}
```

#### 6.1.1 Criterio de "DB vacía"

- **DB vacía** = el usuario no tiene escuelas ni cursos en la base.
- Verificación: `Escuela::where('user_id', $user->id)->doesntExist()` **y** `Curso::where('user_id', $user->id)->doesntExist()`.
- Si existe al menos una escuela o un curso del user → **DB NO vacía** → no importar.

#### 6.1.2 Comportamiento

1. Si **DB NO vacía**: devolver datos equivalentes a `GET /api/sync/dump`. No sobrescribir. HTTP 200.
2. Si **DB vacía**: ejecutar importación dentro de transacción.
3. Respuesta éxito: `{ "ok": true, "message": "Datos importados" }`, HTTP 200.

#### 6.1.3 Idempotencia y evitación de duplicados

- **Idempotencia:** Si el cliente reenvía bootstrap con DB ya poblada, el endpoint no importa; devuelve dump. Comportamiento idéntico en llamadas sucesivas.
- **Duplicados:** Usar UNIQUE constraints y `updateOrCreate`:
  - `perfiles_docentes.user_id` UNIQUE → updateOrCreate por user_id.
  - `clases(curso_id, fecha)` UNIQUE → updateOrCreate por (curso_id, fecha).
  - `asistencias(clase_id, alumno_id)` UNIQUE → updateOrCreate por (clase_id, alumno_id).
  - `planificaciones.curso_id` UNIQUE → updateOrCreate por curso_id.
- En violación de UNIQUE por race condition: capturar excepción, rollback, responder con datos actuales.

### 6.2 GET /api/sync/dump

**Propósito:** Devolver todos los datos del usuario para hidratar el frontend.

**Respuesta esperada:** Estructura compatible con lo que hoy lee el frontend desde localStorage (profile, escuelas, cursos, alumnos, clases, asistencias, materiales, diagnosticos, planificaciones).

---

## 7. Estructura JSON y errores

### 7.1 Formato estándar de éxito

```json
{ "data": { ... } }
```
o
```json
{ "data": [ ... ] }
```

### 7.2 Formato de error

```json
{
  "message": "Descripción del error",
  "errors": { "campo": ["mensaje validación"] }
}
```

### 7.3 Manejo 401 y 403

| Código | Situación | Respuesta |
|--------|-----------|-----------|
| **401 Unauthorized** | Token ausente, inválido o expirado | `{ "message": "Unauthenticated." }` |
| **403 Forbidden** | Usuario autenticado pero sin permiso sobre el recurso | `{ "message": "Forbidden." }` |

---

## 8. Seguridad

### 8.1 Sanctum

- Todas las rutas excepto `POST /api/login` protegidas con `auth:sanctum`.
- Token en header: `Authorization: Bearer {token}`.

### 8.2 Filtrado por user_id

Cada consulta debe asegurar que el usuario solo acceda a sus datos:

- **Escuelas:** `$user->escuelas()`
- **Cursos:** vía `$user->cursos()` o `$escuela->cursos()`
- **Alumnos, Clases, Materiales, Diagnosticos, Planificaciones:** vía curso → user

### 8.3 Policies

- EscuelaPolicy, CursoPolicy, AlumnoPolicy, ClasePolicy, etc. según recurso.

---

## 9. Orden de implementación

### Fase 1 — Base (semana 1)

1. Crear repo `la-app-del-docente-api`
2. Configurar Laravel, MariaDB, Sanctum
3. Migraciones: users, perfiles_docentes, escuelas, cursos, alumnos
4. Modelos y relaciones
5. AuthController (login, logout, me)
6. CORS

### Fase 2 — CRUD base (semana 2)

7. PerfilController, EscuelaController, CursoController, AlumnoController
8. Policies básicas

### Fase 3 — Clases y asistencias (semana 3)

9. Migraciones: clases, asistencias, registros_clase
10. ClaseController, AsistenciaController, RegistroClaseController

### Fase 4 — Materiales, diagnosticos, planificaciones (semana 4)

11. Migraciones: materiales, diagnosticos, planificaciones
12. MaterialController, DiagnosticoController, PlanificacionController

### Fase 5 — Sync (semana 5)

13. SyncController: bootstrap y dump
14. Mapeo de IDs (localStorage → DB)
15. Pruebas end-to-end

---

## 10. Mapeo frontend ↔ backend

| Frontend (localStorage) | Backend |
|-------------------------|---------|
| perfilDocente | perfiles_docentes |
| app_escuelas | escuelas |
| app_cursos | cursos |
| alumnos (por curso) | alumnos |
| app_asistencia | asistencias (vía clases) |
| clases_curso_* | clases |
| clases_admin_* (links) | materiales |
| diagnosticos_v1 | diagnosticos |
| planificacion_v1 | planificaciones |

---

**Fin del plan. No implementar hasta autorización explícita.**
