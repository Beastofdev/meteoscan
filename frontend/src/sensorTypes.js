// Los codigos de la API sirven para guardar datos, no para mostrarlos: el tipo
// es 'temperature' y la unidad sigue SenML, 'Cel' (0006). Aqui se traducen a
// lo que lee una persona.
//
// Un codigo que no esta en la lista se muestra tal cual: un tipo nuevo en la
// base se ve feo hasta que se anade, pero no rompe el panel. Map y no un objeto
// literal: en un objeto, un codigo como 'constructor' encontraria algo que no
// es una traduccion.

const TYPE_LABELS = new Map([
  ['temperature', 'Temperatura'],
  ['humidity', 'Humedad relativa'],
  ['pm25', 'Partículas PM2.5'],
])

const UNIT_SYMBOLS = new Map([
  ['Cel', '°C'],
  ['%RH', '% HR'],
  ['ug/m3', 'µg/m³'],
])

export function typeLabel(code) {
  return TYPE_LABELS.get(code) ?? code
}

export function unitSymbol(unit) {
  return UNIT_SYMBOLS.get(unit) ?? unit
}
