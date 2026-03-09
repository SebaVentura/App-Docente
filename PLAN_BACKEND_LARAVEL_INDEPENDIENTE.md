# Plan: Backend Laravel + MariaDB (Repositorio Independiente)

**Objetivo:** Implementar el backend de "La App del Docente" como proyecto **separado** de este repo (frontend React). El backend consumirá MariaDB y mantendrá toda la lógica de negocio del MVP actual.

**Estado:** PLAN APROBACIÓN PENDIENTE — no implementar hasta confirmación.

---

## 1. Principios

| Aspecto | Decisión |
|---------|----------|
| **Repo** | Nuevo repositorio Git independiente (no monorepo) |
| **Stack** | Laravel 11+ (PHP 8.2+), MariaDB 10.x/11.x |
| **Comunicación** | API REST JSON; frontend actual se adapta después |
| **Autenticación** | Laravel Sanctum (API tokens) |
| **Lógica MVP** | Se preserva según módulos actuales (localStorage/IndexedDB) |

---

## 2. Alcance del MVP (a replicar en backend)

Módulos que el frontend usa hoy y deben tener contraparte en el backend:

| Módulo | Fuente actual | Entidad principal |
|--------|---------------|-------------------|
| Escuelas | `datosEscuelas.js` | escuelas |
| Cursos | `datosCursos.js` | cursos, horarios (JSON) |
| Perfil docente | `datosPerfil.js` | users (campos extra) |
| Asistencia | `datosAsistencia.js` | asistencias |
| Trayectorias | `datosTrayectorias.js` | trayectorias |
| Seguimiento | `datosSeguimiento.js` | seguimientos |
| Diagnósticos | `datosDiagnosticos.js` | diagnosticos |
| Planificación | `datosPlanificacion.js` | planificaciones |
| Planificación IA | `planificacionPersistencia.js` | planificaciones_ia (JSON) |
| Clases | `datosClases.js`, `datosClasesAdmin.js` | clases, clase_materiales |
| Imponderables | implícito | imponderables |
| Archivos | `archivosLocal.js` (IndexedDB) | archivos (storage) |

---

## 3. Estructura del Proyecto Backend

```
la-app-del-docente-api/          # Nuevo repo
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   ├── Requests/
│   │   ├── Resources/
│   │   └── Middleware/
│   ├── Models/
│   ├── Policies/
│   └── Services/
├── config/
│   ├── database.php             # MariaDB
│   └── cors.php
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   └── api.php
├── .env.example
├── composer.json
└── README.md
```

---

## 4. Base de Datos (MariaDB)

### 4.1 Configuración

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=app_docente
DB_USERNAME=...
DB_PASSWORD=...
```

*Nota: Laravel usa driver `mysql` para MariaDB; es compatible.*

### 4.2 Tablas principales

- `users` — Laravel + campos extra (DNI, teléfono)
- `escuelas` — id, nombre, codigo, direccion, telefono
- `cursos` — id, escuela_id, nombre, anio, division, materia, horarios (JSON)
- `curso_usuario` — pivot docente–curso
- `alumnos` — por curso: legajo, apellido, nombre, DNI, fecha_nac, condicion
- `asistencias` — curso_id, alumno_id, fecha, presente, tarde, horaIngreso
- `trayectorias` — curso_id, alumno_id, user_id, fecha, tipo, detalle, valor
- `seguimientos` — curso_id, alumno_id, user_id, activo, motivo
- `diagnosticos` — curso_id, alumno_id, fecha, tipo, detalle
- `planificaciones` — curso_id, user_id, programa_texto, plan (JSON), meta (JSON)
- `planificaciones_ia` — curso_id, user_id, borrador (JSON) — opcional, puede ir en planificaciones
- `clases` — curso_id, numero_clase, detalle, fecha
- `clase_materiales` — clase_id, tipo (teoria/practica), archivo_path o link_url
- `imponderables` — curso_id, user_id, fecha, tipo, observacion
- `archivos` — user_id, nombre, ruta, tipo, relacionable (polimórfico)

El diseño detallado (SQL/migraciones) se toma de `PLAN_MIGRACION_LARAVEL.md`.

---

## 5. API REST (Endpoints)

### Autenticación
- `POST /api/login` — email, password → token + user
- `POST /api/logout` — revocar token
- `GET /api/user` — usuario autenticado

### Escuelas
- `GET /api/escuelas` | `GET /api/escuelas/{id}`
- `POST /api/escuelas` | `PUT /api/escuelas/{id}` | `DELETE /api/escuelas/{id}`

### Cursos
- `GET /api/cursos` (del usuario) | `GET /api/cursos/{id}`
- `POST /api/cursos` | `PUT /api/cursos/{id}` | `DELETE /api/cursos/{id}`
- `GET /api/escuelas/{id}/cursos`

### Alumnos
- `GET /api/cursos/{cursoId}/alumnos` | `POST` | `PUT /api/alumnos/{id}` | `DELETE`
- `POST /api/cursos/{cursoId}/alumnos/importar` — Excel

### Asistencia, Trayectorias, Seguimiento, Diagnósticos
- CRUD por curso; ej.: `GET /api/cursos/{cursoId}/asistencias?fecha=YYYY-MM-DD`

### Planificación, Clases, Imponderables, Archivos
- CRUD según recurso; subida de archivos vía multipart/form-data

Autorización: solo acceso a cursos donde el usuario está en `curso_usuario`.

---

## 6. Fases de Implementación

### Fase 1 — Setup (1 semana)
- Crear repo nuevo `la-app-del-docente-api`
- `composer create-project laravel/laravel .`
- Configurar MariaDB en `.env`
- Instalar Sanctum
- Migraciones base (users, escuelas, cursos, curso_usuario, alumnos, etc.)
- Modelos Eloquent + relaciones
- CORS para dominio del frontend

### Fase 2 — Auth + módulos base (1–2 semanas)
- AuthController (login, logout)
- EscuelaController, CursoController, AlumnoController
- Form Requests y API Resources
- Policies básicas

### Fase 3 — Módulos de datos (1–2 semanas)
- AsistenciaController, TrayectoriaController, SeguimientoController
- DiagnosticoController, PlanificacionController
- ClaseController, ClaseMaterialController
- ImponderableController

### Fase 4 — Archivos y ajustes (1 semana)
- ArchivoController — upload/download
- Storage local (o S3) para PDFs/documentos
- Importación de alumnos desde Excel

### Fase 5 — Integración frontend (fuera de este plan)
- Este repo (frontend) se adapta en otro momento
- Crear `apiClient.js` y helpers que llamen a la API
- Sustituir localStorage/IndexedDB por llamadas HTTP

---

## 7. Independencia y Comunicación

### Repos
- **Frontend:** `la app del docente` (este repo)
- **Backend:** `la-app-del-docente-api` (nuevo repo)

### Despliegue
- Backend y frontend pueden desplegarse por separado
- Frontend usa `VITE_API_URL` (ej. `https://api.appdocente.local`)
- CORS configurado en backend para orígenes permitidos

### Versionado API
- Rutas bajo `/api` (opcional: `/api/v1` si se planea evolución)

---

## 8. Checklist Pre-implementación

- [ ] Confirmar versión de Laravel (11 recomendado)
- [ ] Confirmar versión de MariaDB (10.6+ o 11.x)
- [ ] Definir URL base de la API
- [ ] Definir orígenes CORS (dominios del frontend)
- [ ] Decidir si registro de usuarios está habilitado o solo login

---

## 9. Próximos pasos (tras aprobación)

1. Crear el repositorio `la-app-del-docente-api`
2. Ejecutar Fase 1
3. Documentar endpoints (Postman/Insomnia)
4. Continuar con Fases 2–4
5. Luego, adaptar frontend (Fase 5)

---

**¿Aprobás este plan?** Respondé "OK" para dar luz verde a la implementación.
