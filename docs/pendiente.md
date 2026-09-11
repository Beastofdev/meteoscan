# Lo que queda para más adelante

Lo que se ha visto y se aparca **a propósito**, con el paso en que se retoma.
Lo que no está aquí ni en la [especificación](especificacion.md) no se ha
pedido: se propone antes de hacerlo.

| Qué | Cuándo | Por qué se espera |
|---|---|---|
| Dónde vive el umbral de alerta: en el tipo de sensor o en cada sensor | Paso 3 | La especificación da un ejemplo —temperatura por encima de 35 °C—; los umbrales de humedad y de calidad del aire no están, y no se inventan |
| Las rutas de la API en castellano (`/sensores`) o en inglés (`/sensors`) | Paso 2 | La especificación las da en castellano, y el código irá en inglés |
| Por dónde escribe el simulador: directamente en la base de datos o a través de `POST /lecturas` | Paso 2 | La especificación dice «insertándolas en la BD», pero también pide un `POST /lecturas`, que es por donde entraría un sensor de verdad |
| Migraciones en lugar de recrear el esquema | Antes de guardar datos que no sean del simulador | Un esquema que se carga tirando y recreando las tablas no actualiza la base: la vacía. Con datos simulados es una virtud —siempre se parte de cero—; con datos de verdad, es un arma |
| La insignia del workflow en el README | Cuando el repositorio esté en GitHub | Hasta entonces no hay dirección a la que apuntar |
| El README final | Al acabar | Cómo se arranca y cómo se usa no se puede contar hasta que exista |
