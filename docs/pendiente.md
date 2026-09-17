# Lo que queda para más adelante

Lo que se ha visto y se aparca **a propósito**, con el paso en que se retoma.
Lo que no está aquí ni en la [especificación](especificacion.md) no se ha
pedido: se propone antes de hacerlo.

| Qué | Cuándo | Por qué se espera |
|---|---|---|
| Dónde vive el umbral de alerta: en el tipo de sensor o en cada sensor | Paso 3 | La especificación da un ejemplo —temperatura por encima de 35 °C—; los umbrales de humedad y de calidad del aire no están, y no se inventan |
| De dónde saca el formulario del panel la lista de tipos de sensor: de una ruta nueva o de una copia en el panel | Paso 3 | Los requisitos piden un formulario de alta, pero ninguna ruta que dé los tipos. Una ruta nueva sería algo fuera de los requisitos; una copia en el panel, una segunda lista, y dos copias de la misma lista acaban siendo distintas |
| Pedir un tramo del histórico: `?desde`, `?hasta`, `?limite` o paginación | Paso 3 | `GET /sensores/:id/lecturas` devuelve las últimas 1000, que es lo que dibuja el gráfico. Si el panel necesita ver otro tramo, o recorrer el histórico entero, habrá que poder pedirlo |
| El último valor de cada sensor, para la alerta | Paso 3 | `GET /sensores` no lo trae, y la alerta necesita saber qué sensor pasa de su umbral. Hay dos caminos: pedir el histórico de cada sensor por separado —una petición por sensor, y hasta 1000 lecturas para quedarse con la última—, o que la API lo devuelva, que es cambiar una ruta de los requisitos |
| Límites de lo plausible para cada tipo de sensor: una humedad por encima del 100 %, un PM2.5 negativo | Cuando lleguen sensores reales | Los requisitos no los dan, y un sensor mal calibrado manda valores algo fuera de rango: rechazarlos es perder el dato, y lo correcto —rechazar, marcar o recortar— depende del sensor. `POST /lecturas` no los mira. Una regla de la tabla de lecturas no puede mirar la de tipos: si se validan, será en la API |
| Migraciones en lugar de recrear el esquema | Antes de guardar datos que no sean del simulador | Un esquema que se carga tirando y recreando las tablas no actualiza la base: la vacía. Con datos simulados es una virtud —siempre se parte de cero—; con datos de verdad, es un arma |
| Lecturas «del futuro»: medidas después de haber llegado | Cuando lleguen lecturas de sensores reales | El reloj del sensor y el de la base pueden no coincidir, y una regla estricta rechazaría lecturas buenas |
| El README final | Al acabar | Cómo se arranca y cómo se usa no se puede contar hasta que exista |
