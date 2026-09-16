import { useEffect, useState } from 'react'
import './App.css'

// La API contesta en /sensores gracias al proxy del servidor de desarrollo
// (vite.config.js): para el navegador, el panel y la API son el mismo sitio.
const RUTA_SENSORES = '/sensores'

export default function App() {
  // null mientras no hay respuesta; un array en cuanto la API contesta.
  const [sensores, setSensores] = useState(null)
  const [error, setError] = useState(null)

  // Se consulta una sola vez, al aparecer el panel: la lista vacia de
  // dependencias es lo que dice "no lo repitas".
  useEffect(() => {
    fetch(RUTA_SENSORES)
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error(`la API respondio ${respuesta.status}`)
        }
        return respuesta.json()
      })
      .then(setSensores)
      .catch((fallo) => setError(fallo.message))
  }, [])

  return (
    <main>
      <h1>MeteoScan</h1>
      <p className={error ? 'estado estado-error' : 'estado'}>
        {resumen(sensores, error)}
      </p>
    </main>
  )
}

// Los tres momentos de cualquier pantalla que depende de un servidor: no ha
// contestado, ha fallado, o ha contestado.
function resumen(sensores, error) {
  if (error) return `No se pudo consultar la API: ${error}.`
  if (sensores === null) return 'Consultando la API...'
  if (sensores.length === 0) return 'La API responde. No hay ningun sensor en servicio.'
  if (sensores.length === 1) return 'La API responde. Hay 1 sensor en servicio.'
  return `La API responde. Hay ${sensores.length} sensores en servicio.`
}
