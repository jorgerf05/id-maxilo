# ID Maxilo — sitio web

Sitio en español desarrollado con Astro y Tailwind CSS, con información de la clínica, perfiles médicos y demostraciones interactivas de tratamientos faciales.

## Desarrollo

```sh
npm ci
npm run dev
```

Abrir `http://localhost:4321/id-maxilo/`.

## Compilación

```sh
npm run build
npm run preview
```

La compilación estática se genera en `dist/`.

## Estructura

- `src/`: página, componentes, estilos, datos de contacto y animaciones.
- `assets/web/`: únicamente las imágenes e iconos importados por el sitio.
- `public/fonts/`: fuentes locales y sus licencias.
- `src/data/contact.ts`: datos de contacto y enlaces de la clínica. El horario se consulta por WhatsApp mientras no haya un horario confirmado.

## Recursos de terceros

Iconos Facebook e Instagram: [Simple Icons](https://github.com/simple-icons/simple-icons), CC0; licencia en `assets/web/icons/LICENSE.md`. Tipografías Manrope e Instrument Serif: licencias OFL incluidas en `public/fonts/`.

La fotografía de la escena de valoración contiene un rostro ficticio generado. Las ilustraciones de los tratamientos son conceptuales.

## Publicación

- Repositorio: https://github.com/jorgerf05/id-maxilo
- Sitio: https://jorgerf05.github.io/id-maxilo/

GitHub Actions compila y publica automáticamente cada cambio enviado a `main`.
El workflow usa Node.js 22, `npm ci`, `npm run build` y el artefacto estático de `dist/`.
Las opciones `site` y `base` de Astro corresponden a esta dirección de GitHub Pages.
Las fuentes locales se cargan desde `public/fonts/fonts.css` con rutas relativas,
y las precargas respetan `BASE_URL` para funcionar dentro de `/id-maxilo/`.

Se conserva la directiva `noindex, nofollow` de la versión revisada: el enlace es
público, pero la página no solicita indexación en buscadores todavía.
