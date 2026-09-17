// Como se escriben en el panel los numeros y las horas de una lectura, y cuando
// un sensor esta en alerta. La API da las horas en UTC; aqui se pasan a la zona
// del navegador y al formato espanol (0016).

const NUMBER = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 })
const TIME = new Intl.DateTimeFormat('es-ES', { timeStyle: 'medium' })
const DATE_AND_TIME = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'medium' })

export function formatNumber(value) {
  return NUMBER.format(value)
}

export function formatTime(isoTime) {
  return TIME.format(Date.parse(isoTime))
}

export function formatDateAndTime(isoTime) {
  return DATE_AND_TIME.format(Date.parse(isoTime))
}

// Un sensor esta en alerta si su ultima lectura pasa del umbral de su tipo. Sin
// umbral —la humedad no tiene— o sin lecturas, no hay alerta. "Supera" es
// mayor, no igual (0017).
export function isOverThreshold({ alert_threshold, last_reading }) {
  if (typeof alert_threshold !== 'number') return false
  if (last_reading === null || last_reading === undefined) return false
  return last_reading.value > alert_threshold
}
