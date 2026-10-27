# Variables BDFD

Guarda, lee, suma, elimina y recupera variables de tu bot de **BDFD** (Bot Designer for Discord) en **tu propio almacenamiento** de SynapseBox, en `BDFD-Variables/<bot>/<scope>/<id>/<nombre>.json`.

## Activar
Menú de usuario → **Variables BDFD** → **Activar y generar clave**. Se muestran tu **ID** y la **clave** (solo una vez). Desactivar invalida la clave.

## Uso
`/api/bdfd/<TU_ID>/<acción>` con la clave en la cabecera `x-api-key` (o `Authorization: Bearer`, o `?key=`). Funciona con GET y POST; los parámetros van en la URL o en el cuerpo.

| Parámetro | Descripción |
| --- | --- |
| `scope` | `user` (por defecto), `server`, `channel`, `member`, `bot`, `global` |
| `id` | ID de Discord (usuario, servidor, canal, bot…). Para `member` usa `servidor:usuario`. No hace falta en `global` |
| `bot` | (Opcional) ID del bot para separar las variables de cada bot |
| `name` | Nombre de la variable (máx. 100 caracteres) |
| `value` | Valor (máx. 64 KB). En `add`, el número a sumar |
| `default` | Valor devuelto por `get` si no existe |

| Acción | Qué hace |
| --- | --- |
| `set` | Crea o actualiza una variable |
| `get` | Devuelve `{ok, exists, value, created_at, updated_at}` |
| `add` | Suma a una variable numérica (negativos para restar) |
| `delete` | Manda la variable a la papelera de variables (sigue ocupando espacio) |
| `recover` | Recupera una variable eliminada (`overwrite=true` si ya existe otra) |
| `purge` | Borra definitivamente una eliminada (`name`) o toda la papelera (`confirm=yes`): **libera espacio** |
| `list` | Lista nombres (`trash=true` para las eliminadas) |
| `info` | Almacenamiento usado, límite, libre y si está lleno |

Ejemplo en BDFD:

```
$httpAddHeader[x-api-key;TU_CLAVE]
$httpGet[https://tu-dominio/api/bdfd/TU_ID/get?scope=user&id=$authorID&name=monedas&default=0]
$httpResult[value]
```

## Límite de almacenamiento
Si tu cuota está llena, `set`, `add` y `recover` responden **HTTP 507** `{"ok":false,"error":"storage_full"}` y no se crea ningún archivo. Para volver a guardar, libera espacio (borra archivos o usa `purge`). `delete`, `purge`, `get`, `list` e `info` siguen funcionando.

## Errores
Siempre JSON `{"ok":false,"error":"codigo","message":"…"}` con el estado HTTP correspondiente: 400 petición inválida, 401 credenciales, 404 acción desconocida, 409 ya existe, 413 valor grande, 429 demasiados intentos fallidos (10 por IP cada 10 min), 507 almacenamiento lleno.

## Seguridad
La clave se guarda solo como hash. Evita poner la clave en la URL (`?key=`) si puedes usar la cabecera: las URL se registran en historiales y proxys.
