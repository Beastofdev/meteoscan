# Lo que queda para más adelante

Lo que se ha visto y se aparca **a propósito**, con el paso en que se retoma.
Lo que no está aquí ni en la [especificación](especificacion.md) no se ha
pedido: se propone antes de hacerlo.

| Qué | Cuándo | Por qué se espera |
|---|---|---|
| Pedir un tramo del histórico: `?desde`, `?hasta`, `?limite` o paginación | Cuando haya que ver un tramo que no sean las últimas mil lecturas | `GET /sensores/:id/lecturas` devuelve las últimas 1000, que es lo que dibuja el gráfico. Si el panel necesita ver otro tramo, o recorrer el histórico entero, habrá que poder pedirlo |
| Límites de lo plausible para cada tipo de sensor: una humedad por encima del 100 %, un PM2.5 negativo | Cuando lleguen sensores reales | Los requisitos no los dan, y un sensor mal calibrado manda valores algo fuera de rango: rechazarlos es perder el dato, y lo correcto —rechazar, marcar o recortar— depende del sensor. `POST /lecturas` no los mira. Una regla de la tabla de lecturas no puede mirar la de tipos: si se validan, será en la API |
| Migraciones en lugar de recrear el esquema | Antes de guardar datos que no sean del simulador | Un esquema que se carga tirando y recreando las tablas no actualiza la base: la vacía. Con datos simulados es una virtud —siempre se parte de cero—; con datos de verdad, es un arma |
| Lecturas «del futuro»: medidas después de haber llegado | Cuando lleguen lecturas de sensores reales | El reloj del sensor y el de la base pueden no coincidir, y una regla estricta rechazaría lecturas buenas |
| Rechazar un cuerpo que no sea UTF-8 válido | Cuando la API tenga clientes que no sean del proyecto | `express.json()` decodifica el cuerpo con `iconv-lite`, que cambia lo que no es UTF-8 válido por `U+FFFD` sin dar error: un cliente que mande los acentos en otra codificación guarda «Jard�n» y recibe un `201`. El panel y el simulador mandan siempre UTF-8, así que hoy no ocurre; con sensores reales o integraciones, lo correcto sería un `400` que diga qué pasa |
