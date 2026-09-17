import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// El panel se sirve en el 5177, que es el puerto de MeteoScan. strictPort
// impide que Vite se mude solo al siguiente puerto libre cuando el 5177 esta
// ocupado: los de alrededor son de otros servicios de la maquina, y un panel
// que aparece en un puerto ajeno es peor que uno que no arranca.
//
// El panel (5177) y la API (8005) son dos origenes distintos, y el navegador
// no deja que una pagina de uno pida datos al otro. El proxy hace que, visto
// desde el navegador, todo venga del 5177. Asi la API no necesita abrir CORS,
// que seria tocar el backend por un problema que solo existe mientras se
// desarrolla.
//
// Lo que el panel pide a la API empieza por /api, y el proxy lo quita al
// reenviarlo: /api/sensores llega a la API como /sensores. Todo lo demas es del
// panel, que puede usar sus propias direcciones —/sensores/<id> es el detalle
// de un sensor— sin que al recargar conteste la API (0016).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8005',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
