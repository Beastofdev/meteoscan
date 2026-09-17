import SensorCard from './SensorCard.jsx'
import './SensorList.css'

// La key va en el elemento que devuelve el map, no dentro de la tarjeta: es lo
// que React usa para saber que tarjeta es cual cuando la lista cambia.
// onRetired no lo usa la lista: lo pasa a cada tarjeta.
export default function SensorList({ sensors, onRetired }) {
  return (
    <ul className="sensor-list">
      {sensors.map((sensor) => (
        <li key={sensor.sensor_id}>
          <SensorCard sensor={sensor} onRetired={onRetired} />
        </li>
      ))}
    </ul>
  )
}
