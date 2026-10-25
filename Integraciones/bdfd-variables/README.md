# 🤖 Variables BDFD — guía fácil

Guarda datos de tu bot de **BDFD** (monedas, niveles, configuraciones…) en **tu propio almacenamiento de SynapseBox**, sin depender de las variables de BDFD. Cada dato es un archivo pequeño dentro de tu carpeta, así que lo ves, lo descargas y cuenta para tu espacio.

> **Versión 1.1.0** · Funciona con `$httpGet` y `$httpPost` de BDFD · Respuestas siempre en JSON

---

## 1. Puesta en marcha (3 minutos)

1. **Activa el plugin** (administrador): *Admin → Plugins → Instalados → Variables BDFD*.
2. **Activa tu acceso**: abre el menú de usuario → **Variables BDFD** → **Activar y generar clave**.
3. **Apunta dos cosas**:
   - 🆔 **Tu ID** (siempre visible en esa ventana).
   - 🔑 **Tu clave** (empieza por `sbv_`). **Solo se muestra una vez.** Si la pierdes, pulsa *Regenerar clave* (la anterior deja de funcionar).
4. **Prueba la conexión** en un comando de BDFD:

```
$httpAddHeader[x-api-key;TU_CLAVE]
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/ping]
$httpResult[message]
```
Si el bot responde *"Conexión correcta: ID y clave válidos"*, ya está.

> Cambia `TU-DOMINIO`, `TU_ID` y `TU_CLAVE`. El menú del plugin te da estos ejemplos ya con tu ID puesto.

---

## 2. Cómo se escribe una petición

```
https://TU-DOMINIO/api/bdfd/TU_ID/ACCIÓN?scope=…&id=…&name=…&value=…
                                  └─┬──┘        └──────── parámetros ────────┘
                              qué quieres hacer
```
La **clave** va en la cabecera con `$httpAddHeader[x-api-key;TU_CLAVE]` (recomendado) o al final de la URL como `&key=TU_CLAVE` (menos seguro: las URL quedan en registros).

### Los parámetros

| Parámetro | Para qué sirve | Ejemplo |
| --- | --- | --- |
| `scope` | **A quién pertenece** la variable | `user`, `server`, `channel`, `member`, `bot`, `global` |
| `id` | **ID de Discord** de ese “alguien” | `$authorID`, `$guildID`, `$channelID` |
| `name` | Nombre de la variable (máx. 100 caracteres) | `monedas` |
| `value` | El valor. En `add`, el número a sumar | `100` |
| `default` | Lo que devuelve `get` si la variable no existe | `0` |
| `bot` | *(Opcional)* ID de tu bot, para **separar** las variables de cada bot | `$clientID` |

### ¿Qué `scope` uso?

| Quiero guardar… | scope | id |
| --- | --- | --- |
| Algo de **cada usuario** (monedas, XP) | `user` | `$authorID` |
| Algo de **cada servidor** (prefijo, canal de logs) | `server` | `$guildID` |
| Algo de **cada canal** | `channel` | `$channelID` |
| Algo de **un usuario dentro de un servidor** (nivel por servidor) | `member` | `$guildID:$authorID` |
| Algo **del propio bot** | `bot` | `$clientID` |
| Algo **para todo el mundo** (contador total) | `global` | *(no hace falta)* |

---

## 3. Acciones

| Acción | Qué hace | Devuelve (lo más útil) |
| --- | --- | --- |
| `ping` | Comprueba ID y clave | `message` |
| `set` | Crea o cambia una variable | `value`, `created` |
| `get` | Lee una variable | `exists`, `value` |
| `add` | Suma (o resta con negativos) a un número | `value` (el nuevo total) |
| `delete` | Elimina → va a la **papelera de variables** | `deleted` |
| `recover` | Recupera una eliminada | `recovered` |
| `purge` | Borra **para siempre** y **libera espacio** | `purged`, `freed` |
| `list` | Lista nombres (`prefix=` filtra, `trash=true` ve las eliminadas) | `variables`, `count` |
| `info` | Espacio usado, límite y libre | `used`, `limit`, `free`, `full` |

Todas las respuestas llevan `"ok": true` si fue bien. En BDFD se leen con `$httpResult[campo]`.

---

## 4. Ejemplos listos para copiar

> En todos, pon antes (una vez por comando):
> `$httpAddHeader[x-api-key;TU_CLAVE]`

### 💰 Economía: ver y ganar monedas
**Ver mis monedas** (si nunca tuvo, sale 0):
```
$httpAddHeader[x-api-key;TU_CLAVE]
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/get?scope=user&id=$authorID&name=monedas&default=0]
Tienes $httpResult[value] monedas 💰
```

**Daily: ganar 100 monedas**:
```
$httpAddHeader[x-api-key;TU_CLAVE]
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/add?scope=user&id=$authorID&name=monedas&value=100]
¡Ganaste 100! Ahora tienes $httpResult[value] monedas.
```

**Gastar 30 monedas** (suma negativa):
```
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/add?scope=user&id=$authorID&name=monedas&value=-30]
```

### ⭐ Nivel por servidor (member)
```
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/add?scope=member&id=$guildID:$authorID&name=xp&value=15]
XP total en este servidor: $httpResult[value]
```

### ⚙️ Configuración del servidor (prefijo, canal de logs)
**Guardar:**
```
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/set?scope=server&id=$guildID&name=prefijo&value=!]
```
**Leer** (con valor por defecto `!`):
```
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/get?scope=server&id=$guildID&name=prefijo&default=!]
Mi prefijo es $httpResult[value]
```

### 🌍 Contador global de comandos usados
```
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/add?scope=global&name=comandos&value=1]
Comandos usados en total: $httpResult[value]
```

### 🔍 ¿Existe la variable?
```
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/get?scope=user&id=$authorID&name=registro]
$if[$httpResult[exists]==true]
Ya estás registrado.
$else
Aún no te has registrado.
$endif
```

### 🤖 Separar varios bots con `bot=`
Si usas el mismo ID y clave en varios bots, añade `&bot=$clientID` para que no se mezclen:
```
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/get?scope=user&id=$authorID&bot=$clientID&name=monedas&default=0]
```

### 🗑️ Borrar y recuperar
**Eliminar** (se puede deshacer):
```
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/delete?scope=user&id=$authorID&name=monedas]
```
**Recuperar** (añade `&overwrite=true` si ya existe otra con ese nombre):
```
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/recover?scope=user&id=$authorID&name=monedas]
```
**Borrar para siempre una eliminada** (libera espacio):
```
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/purge?scope=user&id=$authorID&name=monedas]
```
**Vaciar toda la papelera** (hay que confirmar):
```
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/purge?confirm=yes]
```

### 📋 Listar variables
```
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/list?scope=server&id=$guildID&prefix=conf_]
Hay $httpResult[count] variables.
```

### 📦 Ver el espacio disponible
```
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/info]
Usado: $httpResult[used] bytes · Libre: $httpResult[free] bytes · ¿Lleno?: $httpResult[full]
```

### 📮 Con `$httpPost` (valores largos o con símbolos)
Si el valor lleva espacios, `;`, `&` o saltos de línea, mejor POST con JSON:
```
$httpAddHeader[x-api-key;TU_CLAVE]
$httpAddHeader[Content-Type;application/json]
$httpPost[https://TU-DOMINIO/api/bdfd/TU_ID/set;{"scope":"user","id":"$authorID","name":"bio","value":"Hola, me llamo Ana; vivo en Madrid"}]
```
> Con GET, evita espacios y símbolos raros en `value` o codifícalos (espacio = `%20`, `;` = `%3B`, `&` = `%26`).

---

## 5. ¿Dónde se guardan mis datos?

En tu carpeta de SynapseBox, visible en el explorador de archivos:

```
BDFD-Variables/
├── default/                 ← o el ID del bot si usas bot=
│   ├── user/123456789/monedas.json
│   ├── server/987654321/prefijo.json
│   └── global/_/comandos.json
└── _papelera/               ← variables eliminadas (siguen ocupando espacio)
```
Cada archivo contiene `{ "name", "value", "created_at", "updated_at" }`. Puedes editarlo a mano si lo necesitas.

---

## 6. 🚨 Si se llena el almacenamiento

Cuando llegas al límite de tu espacio:

- ❌ **No se pueden guardar más datos**: `set`, `add` y `recover` responden con error **507** (`storage_full`) y **no se crea ningún archivo**.
- ✅ Siguen funcionando: `get`, `list`, `info`, `delete`, `purge` y `ping`.

**Cómo volver a la normalidad:** libera espacio.
1. Usa `purge` para vaciar la papelera de variables (`purge?confirm=yes`).
2. O borra archivos que ya no necesites de tu carpeta (o variables viejas).
3. Comprueba con `info` que ya hay espacio libre.

> ⚠️ `delete` **no libera espacio** (solo mueve a la papelera). Para liberarlo hay que usar `purge`.

Puedes detectarlo en BDFD así:
```
$httpGet[https://TU-DOMINIO/api/bdfd/TU_ID/set?scope=user&id=$authorID&name=monedas&value=5]
$if[$httpResult[error]==storage_full]
No puedo guardar ahora: el almacenamiento está lleno.
$endif
```

---

## 7. Errores frecuentes

Las respuestas de error son JSON: `{"ok":false,"error":"codigo","message":"explicación"}`.

| Error | Código HTTP | Qué significa | Solución |
| --- | --- | --- | --- |
| `invalid_credentials` | 401 | ID o clave mal, o la opción está desactivada | Revisa el ID, la clave y que sigue activado en tu perfil |
| `too_many_attempts` | 429 | 10 fallos seguidos desde tu IP | Espera 10 minutos y corrige la clave |
| `bad_scope` | 400 | `scope` no válido | Usa `user`, `server`, `channel`, `member`, `bot` o `global` |
| `bad_request` | 400 | Falta `name` o `id`, o son demasiado largos | Añade el parámetro que falta |
| `not_a_number` | 400 | `add` sobre algo que no es número | Usa `set` para texto, `add` solo con números |
| `value_too_large` | 413 | El valor pasa de 64 KB | Guarda menos texto |
| `exists` | 409 | Al recuperar ya hay otra con ese nombre | Añade `overwrite=true` |
| `confirm_required` | 400 | Vaciar la papelera sin confirmar | Añade `confirm=yes` |
| `unknown_action` | 404 | Acción mal escrita | Revisa la tabla de acciones |
| `storage_full` | 507 | Sin espacio | Mira la sección 6 |

---

## 8. Seguridad en pocas palabras

- 🔑 Tu clave es como una contraseña: **no la publiques** ni la pongas en mensajes de Discord. Si se filtra, pulsa **Regenerar clave** o **Desactivar**.
- 🔒 SynapseBox solo guarda un *hash* de la clave, no la clave.
- 🧱 Cada usuario solo puede tocar **su propia** carpeta: la clave está ligada a tu ID.
- 🚫 Tras 10 intentos fallidos desde una IP, se bloquea esa IP 10 minutos.
