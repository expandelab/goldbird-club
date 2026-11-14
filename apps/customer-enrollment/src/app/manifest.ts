import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gold Bird Club - Cafetería Barranca',
    short_name: 'Gold Bird',
    description: 'Tarjeta de sellos y recompensas exclusivas en Cafetería Barranca.',
    start_url: '/mi-tarjeta',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    orientation: 'portrait',
    icons: [
      {
        src: '/goldbird-logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/goldbird-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
