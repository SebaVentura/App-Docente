# Plantillas

## DJ_OFICIAL.xlsx

**TODO: Crear plantilla oficial**

Este directorio debe contener el archivo `DJ_OFICIAL.xlsx` con el formato oficial de la Declaración Jurada.

### Requisitos de la plantilla:

- Hoja: "DJ Anverso"
- Encabezado con campos de perfil docente (nombre, DNI, ciclo lectivo, domicilio, teléfono, email, fecha)
- Tabla única continua con encabezados:
  - Distrito/Servicio educativo
  - Cargo
  - Situación de revista
  - Cant Hs Cátedra (T/P/S)
  - Cant Módulos (T/P/S)
  - Toma de posesión
  - Horarios (Lunes a Sábado)
  - Conformidad
- Filas preformateadas (mínimo 7 filas: filas 10-16)
- Formato aplicado: bordes, merges, diagonales en celdas de horarios vacías

### Mapeo de celdas (según plantilla "Declaración Jurada 2025 (1).xlsx"):

- nombre -> C4
- dni -> J4
- cicloLectivo -> O4
- domicilio -> B6
- telefono -> J6
- email -> O6
- fecha -> K24
- Tabla: ROW_START = 10, MAX_FILAS = 7
