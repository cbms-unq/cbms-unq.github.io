# Centro de Bioquímica y Microbiología del Suelo (CBMS - UNQ)

Sitio web oficial del **Centro de Bioquímica y Microbiología del Suelo (CBMS)**, unidad de investigación de la [Universidad Nacional de Quilmes (UNQ)](https://www.unq.edu.ar/) que nuclea y articula al **Laboratorio de Bioquímica y Biofísica de Sistemas (LBBS)** y al **Laboratorio de Fisiología y Genética de Bacterias Beneficiosas para Plantas (LFGBBP)**.

## Arquitectura Técnica

- **Frontend**: HTML5 Semántico, CSS3 moderno (CSS Grid, Flexbox y Custom Properties), y JavaScript Vanilla modular (ES6+).
- **Estilo Visual**: Sistema de diseño "Bio-Organic Dark Mode" derivado de la identidad visual unificada del ecosistema científico UNQ.
- **Sin Dependencias Externas ni CDNs**: 100% autosuficiente, cero librerías de terceros, cero fuentes remotas y cero peticiones de red externas en carga inicial.
- **Internacionalización**: Motor bilingüe cliente instantáneo (Español / Inglés).
- **Gestión de Contenidos**: Headless CMS desacoplado basado en Google Sheets sincronizado vía GitHub REST API.
- **SEO & Descubrimiento Académico**: Datos estructurados Schema.org en JSON-LD (`ResearchOrganization`), Open Graph, Twitter Cards, `hreflang`, `robots.txt` y `sitemap.xml`.
- **Despliegue y Alojamiento**: GitHub Pages (`cbms-unq.github.io`), entrega estática CDN de costo cero ($0/mes).

## Estructura del Directorio

```text
cbms-unq.github.io/
├── index.html                  # Estructura semántica principal con metadatos SEO y JSON-LD
├── robots.txt                  # Directivas de rastreo para motores de búsqueda
├── sitemap.xml                 # Mapa de sitio XML multilingüe
├── README.md                   # Documentación general del repositorio
├── css/
│   ├── tokens.css              # Tokens de diseño y variables CSS (Bio-Organic Dark Mode)
│   └── styles.css              # Maquetación CSS Grid, Flexbox, componentes y responsividad
├── js/
│   ├── main.js                 # Navegación, scroll suave y orquestación general
│   ├── i18n.js                 # Motor de traducción bilingüe (ES/EN)
│   └── content-loader.js       # Carga asíncrona de novedades y agenda académica
├── data/
│   ├── novedades.json          # Anuncios y convocatorias científicas
│   ├── actividades.json        # Agenda de eventos, seminarios y talleres
│   └── translations.json       # Diccionario bilingüe para la interfaz de usuario
├── imgs/
│   ├── seo/                    # Imagen de previsualización para redes sociales
│   ├── logo/                   # Isotipo y logomarca institucional en SVG
│   ├── hero/                   # Fondos vectoriales orgánicos y siluetas del hero
│   ├── laboratorios/           # Fotografías y marcas de laboratorios miembros
│   └── icons/                  # Iconografía temática y de contacto en SVG
└── cms/
    ├── SyncEngine.gs           # Motor de sincronización para Google Apps Script
    └── README.md               # Guía operativa para editores de contenido
```

## Desarrollo y Validación Local

Para servir el sitio localmente y comprobar las peticiones asíncronas de datos sin restricciones de protocolo de archivo:

```bash
# Con Python 3:
python -m http.server 8000

# O con Node.js / npx:
npx serve -l 8000
```

Abra el navegador en `http://localhost:8000`.

## Licencia y Titularidad

© 2026 Centro de Bioquímica y Microbiología del Suelo (CBMS) - Universidad Nacional de Quilmes (UNQ). Todos los derechos reservados.