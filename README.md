# ID Maxilo — sitio web

Sitio en español desarrollado con Astro y Tailwind CSS, con información de la clínica, perfiles médicos y demostraciones interactivas de tratamientos faciales.

## Desarrollo

```sh
npm ci
npm run dev
```

Abrir `http://localhost:4321/`.

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
