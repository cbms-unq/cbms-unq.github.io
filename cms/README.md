# Guía Operativa: Headless CMS en Google Sheets para CBMS

Esta guía documenta la configuración y uso del sistema de gestión de contenidos (**Headless CMS Modelo B**) para el portal del **Centro de Bioquímica y Microbiología del Suelo (CBMS - UNQ)**.

---

## 1. Estructura de la Hoja de Cálculo

La hoja de cálculo institucional de Google Sheets debe contener dos pestañas: **`Novedades`** y **`Actividades`**.

### Pestaña A: `Novedades`

| Columna | Tipo | Requerido | Descripción / Opciones |
|---|---|:---:|---|
| `id` | Entero | Sí | Identificador correlativo (1, 2, 3...) |
| `tipo` | Desplegable | Sí | `Noticia`, `Llamado / Beca`, `Seminario`, `Publicación` |
| `titulo_es` | Texto | Sí | Titular de la novedad en español (hasta 160 caracteres) |
| `titulo_en` | Texto | No | Titular en inglés (si se omite, usa el español) |
| `fecha` | Fecha | Sí | Fecha de publicación (`AAAA-MM-DD`) |
| `fecha_expiracion` | Fecha | No | Fecha límite (al cumplirse, el ítem se depura de la web) |
| `resumen_es` | Texto | Sí | Resumen o bajada informativa en español |
| `resumen_en` | Texto | No | Resumen en inglés |
| `enlace_url` | URL | No | Enlace externo opcional (`https://doi.org/...`, formulario UNQ) |
| `estado` | Desplegable | Sí | `Borrador`, `Publicado`, `Archivado` |

### Pestaña B: `Actividades`

| Columna | Tipo | Requerido | Descripción / Opciones |
|---|---|:---:|---|
| `id` | Entero | Sí | Identificador correlativo (1, 2, 3...) |
| `tipo` | Desplegable | Sí | `Seminario`, `Taller`, `Jornada`, `Defensa de Tesis` |
| `titulo_es` | Texto | Sí | Nombre de la actividad en español |
| `titulo_en` | Texto | No | Nombre en inglés |
| `fecha` | Fecha | Sí | Fecha del evento (`AAAA-MM-DD`) |
| `horario_lugar` | Texto | Sí | Horario y aula / modalidad (ej: `14:00 hs - Aula 42 / Virtual`) |
| `resumen_es` | Texto | Sí | Descripción de la actividad y expositores |
| `resumen_en` | Texto | No | Descripción en inglés |
| `enlace_url` | URL | No | Enlace opcional a inscripción o programa |
| `estado` | Desplegable | Sí | `Borrador`, `Publicado`, `Archivado` |

---

## 2. Configuración en Google Apps Script

1. Abra la hoja de cálculo institucional en Google Sheets.
2. Vaya a **Extensiones > Apps Script**.
3. Copie y pegue el código íntegro de [`SyncEngine.gs`](./SyncEngine.gs) en el editor de código.
4. Vaya a **Configuración del proyecto** (icono de engranaje) > **Propiedades de la secuencia de comandos** y configure las siguientes claves:
   - `GITHUB_PAT`: Token personal de GitHub (Fine-Grained) con permisos de escritura limitados (`Contents: Read and write`).
   - `GITHUB_OWNER`: `cbms-unq`
   - `GITHUB_REPO`: `cbms-unq.github.io`
   - `GITHUB_BRANCH`: `main`
   - `WHITELIST_EMAILS`: Lista separada por comas de correos autorizados (ej: `director.cbms@unq.edu.ar, secretaria@unq.edu.ar`).
5. Guarde y recargue la hoja de cálculo. Aparecerá el menú **🌱 CBMS - Gestión Web**.

---

## 3. Flujo Editorial y Publicación

1. **Redacción**: El redactor completa los campos y deja `estado` en `Borrador`.
2. **Revisión y Aprobación**: El director o responsable autorizado cambia el estado a `Publicado`.
3. **Publicación**: En el menú superior de Sheets, haga clic en:
   - `🌱 CBMS - Gestión Web > 🚀 Publicar Novedades`, o
   - `🌱 CBMS - Gestión Web > 📅 Publicar Agenda de Actividades`.
4. El script sincroniza directamente con GitHub Pages generando un commit atómico. El sitio web se actualiza en 30 a 60 segundos.

---

## 4. Procedimiento de Rollback (Sin Intervención de IT)

Si se publica por error un contenido incorrecto:
1. En Google Sheets, vaya a **Archivo > Historial de versiones > Ver historial de versiones**.
2. Seleccione la versión previa al error y haga clic en **Restaurar esta versión**.
3. En el menú superior, haga clic nuevamente en `🌱 CBMS - Gestión Web > 🔄 Sincronizar Todo`.
4. El portal web se restablecerá a la versión correcta de inmediato.
