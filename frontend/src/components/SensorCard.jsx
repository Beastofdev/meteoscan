import { typeLabel, unitSymbol } from '../sensorTypes.js'
import './SensorCard.css'

// Lo necesario para reconocer un sensor. Ni el sensor_id, que a quien mira el
// panel no le dice nada, ni la fecha de alta, que los requisitos no piden.
export default function SensorCard({ sensor }) {
  return (
    <article className="sensor-card">
      <h2 className="sensor-card-name">{sensor.name}</h2>
      <p className="sensor-card-type">
        {typeLabel(sensor.sensor_type)} · {unitSymbol(sensor.unit)}
      </p>
      <p className="sensor-card-location">{sensor.location}</p>
    </article>
  )
}
