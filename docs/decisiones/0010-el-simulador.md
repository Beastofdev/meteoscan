# 0010 · El simulador

**Estado:** vigente
**Fecha:** 2026-09-16 · **Decide:** Carlos

## El problema

Los [requisitos](../especificacion.md) piden «un script que simule sensores
enviando datos automáticamente cada X segundos (setInterval), generando
lecturas aleatorias e insertándolas en la BD». Sin él, el panel no tiene nada
que dibujar.

La frase deja cuatro preguntas abiertas: por dónde escribe, qué sensores
simula, cada cuánto y qué valores genera.

## Lo que se decidió

1. **Escribe por `POST /lecturas`**, no directamente en la base. Es la puerta
   por la que entraría un sensor de verdad, pasa por las mismas reglas que
   todo lo demás —la validación, el disparador de la baja, la lectura
   repetida— y ejercita la API entera. Las lecturas acaban en la base, como
   piden los requisitos, pero entrando por delante.
2. **Simula los sensores en servicio, y pide la lista en cada vuelta.** Así un
   sensor dado de alta en el panel empieza a recibir lecturas sin reiniciar
   nada, y uno dado de baja deja de recibirlas en la vuelta siguiente. Si no
   hay ninguno, lo dice y espera.
3. **Una vuelta cada 5 segundos**, con `SIM_INTERVAL_MS` para cambiarlo. Si
   una vuelta tarda más que el intervalo, se salta la siguiente en vez de
   amontonarlas.
4. **Los valores son un paseo aleatorio por tipo**, con un decimal: cada valor
   sale del anterior, movido un poco, sin salirse de su rango. Un número al
   azar en cada vuelta daría un gráfico de sierra que no se parece a un sensor.

   Fuente de los rangos: Carlos, 2026-09-16
   ([0003](0003-el-vocabulario-no-se-inventa.md)).

   | Tipo | Rango | Paso | Por qué |
   |---|---|---|---|
   | `temperature` | 15 a 40 `Cel` | 0,4 | Pasa de 35 a propósito: la alerta del panel salta ahí |
   | `humidity` | 30 a 90 `%RH` | 1,5 | Lo normal dentro y fuera, sin llegar a la saturación |
   | `pm25` | 5 a 50 `ug/m3` | 1,2 | De aire limpio a un día malo de ciudad |

   **Un tipo sin rango no se simula**, y se avisa una vez: el simulador no se
   inventa valores.
5. **La hora de cada lectura es la de ahora**, en la forma que acepta la API.
   Como cada sensor manda una por vuelta, nunca choca consigo mismo.
6. **No se para nunca.** Un error de la API se escribe y se sigue; con la API
   caída, lo dice y reintenta en la vuelta siguiente. Un simulador que se cae
   al primer error no sirve para dejarlo corriendo.
7. **Vive en [`backend/src/simulator.js`](../../backend/src/simulator.js)** y
   se lanza con `npm run simular`. Sin librerías nuevas: `fetch` viene con
   Node 24, y `AbortSignal.timeout` evita quedarse esperando a la API. La
   dirección, en `API_URL`. Se para con Ctrl+C.

## Lo que se descartó, y por qué

- **Escribir directamente en la base con `pg`**, que es lo que dice la letra de
  los requisitos: es más rápido y no necesita la API, pero abre una segunda
  puerta con reglas distintas, y el simulador podría meter lo que la API
  prohíbe.
- **Leer la lista de sensores una sola vez, al arrancar**: no seguiría los
  cambios, y habría que reiniciarlo cada vez que se da de alta un sensor.
- **Que el simulador cree sus propios sensores**: serían datos que nadie ha
  pedido, y el panel ya tiene su formulario de alta.
- **Un valor al azar en cada vuelta**: el gráfico sería ruido, no una medida.
- **Pararse al primer error**: el simulador se queda corriendo mientras se
  trabaja en el panel; un `409` suelto no puede tumbarlo.
- **Una carpeta aparte, con su propio `package.json`**: más estructura para un
  fichero, cuando `backend/` ya tiene lo que necesita.

## Lo que cuesta

- **Hace falta la API en marcha**, y la base detrás.
- **Cada lectura es una petición HTTP.** Con muchos sensores, el simulador va
  más lento que escribiendo directamente en la base.
- **Los rangos son de simulación**, y no dicen nada de sensores reales: sirven
  para que el panel tenga algo que dibujar y para ver la alerta.
- **Un tipo de sensor nuevo necesita su rango aquí**, o sus sensores se saltan.

## Dónde vive en el código

- [`backend/src/simulator.js`](../../backend/src/simulator.js) — el simulador
  entero
- [`backend/package.json`](../../backend/package.json) — el script `simular`
