import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatDateAndTime, formatNumber } from '../format.js'
import './ReadingsChart.css'

// Las horas del eje, en la zona del navegador y con formato espanol (0016).
const WITH_SECONDS = new Intl.DateTimeFormat('es-ES', { timeStyle: 'medium' })
const WITH_MINUTES = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' })
const WITH_DAY = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

// Cuanto detalle lleva cada marca del eje depende del tiempo que cubren las
// lecturas: con unos minutos, las marcas van cada pocos segundos, y sin los
// segundos varias seguidas dirian la misma hora.
function axisTimeFormat(points) {
  const span = points[points.length - 1].time - points[0].time
  if (span <= 30 * MINUTE) return WITH_SECONDS
  if (span <= DAY) return WITH_MINUTES
  return WITH_DAY
}

// La evolucion de las lecturas de un sensor, de la mas antigua a la mas nueva,
// que es el orden en que las da la API. Nunca recibe una lista vacia: de eso se
// encarga quien lo usa. threshold puede ser null: hay tipos sin umbral.
export default function ReadingsChart({ readings, unit, threshold }) {
  // La hora, como numero de milisegundos: asi el eje separa los puntos segun el
  // tiempo que paso entre ellos, y no uno por lectura.
  const points = readings.map((reading) => ({
    time: Date.parse(reading.recorded_at),
    value: reading.value,
  }))
  const axisTime = axisTimeFormat(points)

  return (
    <div className="readings-chart">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(time) => axisTime.format(time)}
          />
          <YAxis
            width={64}
            domain={['auto', 'auto']}
            tickFormatter={(value) => formatNumber(value)}
          />
          <Tooltip
            labelFormatter={(time) => formatDateAndTime(new Date(time).toISOString())}
            formatter={(value) => `${formatNumber(value)} ${unit}`}
          />
          {/* La linea del umbral, para ver de un vistazo cuando se cruzo. */}
          {threshold !== null && (
            <ReferenceLine
              y={threshold}
              className="readings-chart-threshold"
              strokeDasharray="6 4"
              label={{
                value: `Umbral ${formatNumber(threshold)} ${unit}`,
                position: 'insideTopRight',
                // La etiqueta se dibuja fuera del grupo de la linea, en otra
                // capa: necesita su propia clase para el color.
                className: 'readings-chart-threshold-label',
              }}
            />
          )}
          {/* Sin puntos: con cientos de lecturas taparian la linea. Y sin
              animacion: con el refresco cada 5 segundos, se dibujaria entera
              otra vez cada vez. */}
          <Line type="linear" dataKey="value" name="Valor" dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
