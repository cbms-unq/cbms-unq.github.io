/**
 * ============================================================================
 * CBMS - Google Sheets Headless CMS Synchronization Engine (Model B)
 * ============================================================================
 * Script para vincular Google Sheets con el repositorio GitHub Pages del CBMS.
 * Permite a los editores de contenido publicar novedades y agenda con un solo clic.
 *
 * Modelo de Seguridad en 5 Capas:
 * 1. Acceso a Google Drive restringido a cuentas institucionales (@unq.edu.ar).
 * 2. Moderación por celdas protegidas (Estados: Borrador, Publicado, Archivado).
 * 3. Lista blanca de correos autorizados para disparar la sincronización.
 * 4. Aislamiento del GitHub PAT en ScriptProperties (nunca visible en celdas ni cliente).
 * 5. Token Fine-Grained de mínimo privilegio acotado estrictamente a este repositorio.
 */

/**
 * Hook de inicio: Agrega el menú personalizado al abrir la hoja de cálculo
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🌱 CBMS - Gestión Web')
    .addItem('🚀 Publicar Novedades', 'publicarNovedades')
    .addItem('📅 Publicar Agenda de Actividades', 'publicarActividades')
    .addSeparator()
    .addItem('🔄 Sincronizar Todo (Novedades y Agenda)', 'sincronizarTodo')
    .addToUi();
}

/**
 * Obtiene la configuración segura desde ScriptProperties
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('GITHUB_PAT');
  const owner = props.getProperty('GITHUB_OWNER') || 'cbms-unq';
  const repo = props.getProperty('GITHUB_REPO') || 'cbms-unq.github.io';
  const branch = props.getProperty('GITHUB_BRANCH') || 'main';

  if (!token) {
    throw new Error('Configure GITHUB_PAT en Archivo > Configuración del proyecto > Propiedades de la secuencia de comandos.');
  }

  return { token, owner, repo, branch };
}

/**
 * Valida si el usuario activo pertenece a la lista blanca de publicadores
 */
function validarUsuarioAutorizado() {
  const emailUsuario = Session.getActiveUser().getEmail().toLowerCase();
  const props = PropertiesService.getScriptProperties();
  const whitelistRaw = props.getProperty('WHITELIST_EMAILS') || '';
  const whitelist = whitelistRaw.split(',').map(e => e.trim().toLowerCase()).filter(e => e.length > 0);

  if (whitelist.length > 0 && !whitelist.includes(emailUsuario)) {
    throw new Error(`El usuario ${emailUsuario} no tiene permisos para publicar en la web oficial del CBMS.`);
  }
  return emailUsuario;
}

/**
 * Consulta el archivo en GitHub (GET) para obtener el SHA actual (control de concurrencia)
 */
function getGitHubFile(filePath) {
  const cfg = getConfig();
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}?ref=${cfg.branch}`;

  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${cfg.token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'CBMS-Sheets-CMS/1.0'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const status = response.getResponseCode();

  if (status === 200) {
    const data = JSON.parse(response.getContentText());
    return {
      exists: true,
      sha: data.sha
    };
  } else if (status === 404) {
    return { exists: false, sha: null };
  } else {
    throw new Error(`Error al consultar GitHub (${status}): ${response.getContentText()}`);
  }
}

/**
 * Commitea y actualiza un archivo en GitHub vía REST API (PUT)
 */
function commitGitHubFile(filePath, jsonContent, commitMessage, currentSha) {
  const cfg = getConfig();
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}`;

  // Codificación segura Base64 con soporte pleno UTF-8 (tildes, eñes, diéresis)
  const base64Content = Utilities.base64Encode(jsonContent, Utilities.Charset.UTF_8);

  const payload = {
    message: commitMessage,
    content: base64Content,
    branch: cfg.branch
  };

  if (currentSha) {
    payload.sha = currentSha;
  }

  const options = {
    method: 'put',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${cfg.token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'CBMS-Sheets-CMS/1.0'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const status = response.getResponseCode();

  if (status === 200 || status === 201) {
    return JSON.parse(response.getContentText());
  } else {
    throw new Error(`Fallo al commitear en GitHub (${status}): ${response.getContentText()}`);
  }
}

/**
 * Parsea y formatea un valor a fecha ISO YYYY-MM-DD
 */
function formatISODate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const str = String(val).trim();
  const match = str.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

/**
 * Publica la pestaña de Novedades hacia data/novedades.json
 */
function publicarNovedades() {
  const ui = SpreadsheetApp.getUi();

  try {
    const editorEmail = validarUsuarioAutorizado();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Novedades');

    if (!sheet) {
      ui.alert('Error', 'No se encontró la pestaña "Novedades" en la hoja.', ui.ButtonSet.OK);
      return;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      ui.alert('Aviso', 'La pestaña "Novedades" no contiene filas de datos.', ui.ButtonSet.OK);
      return;
    }

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const colIdx = {
      id: headers.indexOf('id'),
      tipo: headers.indexOf('tipo'),
      titulo_es: headers.indexOf('titulo_es'),
      titulo_en: headers.indexOf('titulo_en'),
      fecha: headers.indexOf('fecha'),
      fecha_expiracion: headers.indexOf('fecha_expiracion'),
      resumen_es: headers.indexOf('resumen_es'),
      resumen_en: headers.indexOf('resumen_en'),
      enlace_url: headers.indexOf('enlace_url'),
      estado: headers.indexOf('estado')
    };

    const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const activeItems = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const estado = String(row[colIdx.estado] || '').trim().toLowerCase();

      // Regla de moderación: Solo filas en estado 'Publicado'
      if (estado !== 'publicado') continue;

      const fechaPub = formatISODate(row[colIdx.fecha]);
      const fechaExp = formatISODate(row[colIdx.fecha_expiracion]);

      // Depuración automática de convocatorias expiradas
      if (fechaExp && fechaExp < todayStr) {
        continue;
      }

      activeItems.push({
        id: Number(row[colIdx.id]) || i,
        tipo: String(row[colIdx.tipo] || 'Noticia').trim(),
        titulo_es: String(row[colIdx.titulo_es] || '').trim(),
        titulo_en: String(row[colIdx.titulo_en] || row[colIdx.titulo_es] || '').trim(),
        fecha: fechaPub || todayStr,
        fecha_expiracion: fechaExp,
        resumen_es: String(row[colIdx.resumen_es] || '').trim(),
        resumen_en: String(row[colIdx.resumen_en] || row[colIdx.resumen_es] || '').trim(),
        enlace_url: row[colIdx.enlace_url] ? String(row[colIdx.enlace_url]).trim() : null
      });
    }

    // Ordenar cronológicamente descendente (más recientes primero)
    activeItems.sort((a, b) => b.fecha.localeCompare(a.fecha));

    const jsonStr = JSON.stringify(activeItems, null, 2);
    const remote = getGitHubFile('data/novedades.json');
    const msg = `content: update news and calls via content manager [skip ci]`;

    const res = commitGitHubFile('data/novedades.json', jsonStr, msg, remote.sha);

    ui.alert(
      'Publicación Exitosa',
      `Se publicaron ${activeItems.length} novedades activas.\nEditor: ${editorEmail}\nCommit: ${res.commit ? res.commit.sha.substring(0, 7) : 'OK'}`,
      ui.ButtonSet.OK
    );

  } catch (err) {
    ui.alert('Error en la Publicación', err.message, ui.ButtonSet.OK);
  }
}

/**
 * Publica la pestaña de Actividades hacia data/actividades.json
 */
function publicarActividades() {
  const ui = SpreadsheetApp.getUi();

  try {
    const editorEmail = validarUsuarioAutorizado();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Actividades');

    if (!sheet) {
      ui.alert('Error', 'No se encontró la pestaña "Actividades" en la hoja.', ui.ButtonSet.OK);
      return;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      ui.alert('Aviso', 'La pestaña "Actividades" no contiene filas de datos.', ui.ButtonSet.OK);
      return;
    }

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const colIdx = {
      id: headers.indexOf('id'),
      tipo: headers.indexOf('tipo'),
      titulo_es: headers.indexOf('titulo_es'),
      titulo_en: headers.indexOf('titulo_en'),
      fecha: headers.indexOf('fecha'),
      horario_lugar: headers.indexOf('horario_lugar'),
      resumen_es: headers.indexOf('resumen_es'),
      resumen_en: headers.indexOf('resumen_en'),
      enlace_url: headers.indexOf('enlace_url'),
      estado: headers.indexOf('estado')
    };

    const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const activeItems = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const estado = String(row[colIdx.estado] || '').trim().toLowerCase();

      // Regla de moderación: Solo filas en estado 'Publicado'
      if (estado !== 'publicado') continue;

      const fechaEvt = formatISODate(row[colIdx.fecha]);

      activeItems.push({
        id: Number(row[colIdx.id]) || i,
        tipo: String(row[colIdx.tipo] || 'Seminario').trim(),
        titulo_es: String(row[colIdx.titulo_es] || '').trim(),
        titulo_en: String(row[colIdx.titulo_en] || row[colIdx.titulo_es] || '').trim(),
        fecha: fechaEvt || todayStr,
        horario_lugar: String(row[colIdx.horario_lugar] || '').trim(),
        resumen_es: String(row[colIdx.resumen_es] || '').trim(),
        resumen_en: String(row[colIdx.resumen_en] || row[colIdx.resumen_es] || '').trim(),
        enlace_url: row[colIdx.enlace_url] ? String(row[colIdx.enlace_url]).trim() : null
      });
    }

    // Ordenar cronológicamente ascendente (próximos eventos primero)
    activeItems.sort((a, b) => a.fecha.localeCompare(b.fecha));

    const jsonStr = JSON.stringify(activeItems, null, 2);
    const remote = getGitHubFile('data/actividades.json');
    const msg = `content: update academic activities calendar via content manager [skip ci]`;

    const res = commitGitHubFile('data/actividades.json', jsonStr, msg, remote.sha);

    ui.alert(
      'Publicación Exitosa',
      `Se publicaron ${activeItems.length} actividades activas.\nEditor: ${editorEmail}\nCommit: ${res.commit ? res.commit.sha.substring(0, 7) : 'OK'}`,
      ui.ButtonSet.OK
    );

  } catch (err) {
    ui.alert('Error en la Publicación', err.message, ui.ButtonSet.OK);
  }
}

/**
 * Sincroniza tanto Novedades como Actividades de forma consecutiva
 */
function sincronizarTodo() {
  publicarNovedades();
  publicarActividades();
}
