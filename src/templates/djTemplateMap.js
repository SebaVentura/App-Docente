/**
 * Mapa REAL de celdas para la plantilla DJ_OFICIAL.xlsx
 * Hoja: "DJ Anverso"
 * - Encabezado en notación A1 (ExcelJS soporta getCell("C4"))
 * - Tabla con columnas numéricas (A=1 ... Q=17)
 */
export const DJ_TEMPLATE_MAP = {
  sheetName: "DJ Anverso",

  encabezado: {
    nombre: "C4",
    dni: "J4",
    cicloLectivo: "O4",
    domicilio: "B6",
    telefono: "J6",
    email: "O6",
    fecha: "K24", // FECHA de presentación
  },

  tabla: {
    ROW_START: 10,
    MAX_FILAS: 7,

    COL_DISTRITO: 1,        // A
    COL_CARGO: 2,           // B
    COL_SIT_REV: 3,         // C
    COL_HS_T: 4,            // D
    COL_HS_P: 5,            // E
    COL_HS_S: 6,            // F
    COL_MOD_T: 7,           // G
    COL_MOD_P: 8,           // H
    COL_MOD_S: 9,           // I
    COL_TOMA_POSESION: 10,  // J (vacío)
    COL_LUNES: 11,          // K
    COL_MARTES: 12,         // L
    COL_MIERCOLES: 13,      // M
    COL_JUEVES: 14,         // N
    COL_VIERNES: 15,        // O
    COL_SABADO: 16,         // P
    COL_CONFORMIDAD: 17,    // Q (vacío)
  },
};

export const MAPA_DIA_COLUMNA = {
  Lunes: DJ_TEMPLATE_MAP.tabla.COL_LUNES,
  Martes: DJ_TEMPLATE_MAP.tabla.COL_MARTES,
  Miércoles: DJ_TEMPLATE_MAP.tabla.COL_MIERCOLES,
  Miercoles: DJ_TEMPLATE_MAP.tabla.COL_MIERCOLES, // tolerancia por si viene sin tilde
  Jueves: DJ_TEMPLATE_MAP.tabla.COL_JUEVES,
  Viernes: DJ_TEMPLATE_MAP.tabla.COL_VIERNES,
  Sábado: DJ_TEMPLATE_MAP.tabla.COL_SABADO,
  Sabado: DJ_TEMPLATE_MAP.tabla.COL_SABADO, // tolerancia sin tilde
};
