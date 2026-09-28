## Tecnologías

- Node.js 20+
- Express
- MongoDB + Mongoose
- Winston
- Multer
- Swagger / OpenAPI 3
- Mocha + Chai + Supertest
- mongodb-memory-server para tests aislados
- Docker + Docker Compose

## Arquitectura

Todas las rutas principales respetan el flujo:

`Route → Controller → Service → Repository → Model → MongoDB`

- **Routes:** declaran endpoints y middlewares.
- **Controllers:** traducen HTTP a llamadas de aplicación.
- **Services:** contienen reglas de negocio y validaciones de dominio.
- **Repositories:** concentran todo el acceso a MongoDB/Mongoose.
- **Models:** schemas de persistencia.
- **Middlewares:** errores, logging, uploads y utilidades transversales.

## Estructura

```text
src/
├── config/          # entorno, DB, Winston y Swagger
├── constants/       # estados, límites y MIME types
├── controllers/
├── docs/            # OpenAPI
├── errors/          # errores personalizados
├── middlewares/
├── models/
├── repositories/
├── routes/
├── services/
├── utils/
├── app.js
└── server.js

test/
├── fixtures/
└── api.test.js
```

## Variables de entorno

Copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

Variables disponibles:

| Variable | Uso | Ejemplo |
|---|---|---|
| `NODE_ENV` | entorno | `development` |
| `PORT` | puerto HTTP | `8080` |
| `MONGO_URI` | conexión principal MongoDB | `mongodb://localhost:27017/shipnow` |
| `TEST_MONGO_URI` | DB de test opcional; si está vacía se usa MongoMemoryServer | vacío |
| `LOG_LEVEL` | nivel mínimo de Winston | `info` |
| `MAX_FILE_SIZE_MB` | límite por archivo | `5` |
| `ALLOW_INTERNAL_ENDPOINTS` | habilita `/api/logger/test` | `true` |

Nunca subir el `.env` real al repositorio.

## Instalación y ejecución local

Requiere Node.js 20+ y una instancia de MongoDB disponible.

```bash
npm install
npm run dev
```

Producción/local sin nodemon:

```bash
npm start
```

La API queda disponible en `http://localhost:8080`.

## Swagger

Documentación interactiva:

```text
http://localhost:8080/api/docs
```

Contiene usuarios, envíos, tracking, mocks, logger, health check y carga de archivos/comprobantes, junto con schemas y respuestas relevantes.

## Testing

Ejecutar:

```bash
npm test
```

Los tests usan una base MongoDB independiente. Si `TEST_MONGO_URI` no está definida, se levanta automáticamente una base efímera con `mongodb-memory-server`.

La suite cubre:

- Health check.
- Swagger.
- Alta, consulta y actualización de usuarios.
- Validaciones y errores.
- Creación y actualización del flujo de un envío.
- Transiciones de estado válidas e inválidas.
- Tracking.
- Paginación/filtros.
- Mocks.
- Carga de documentos y comprobantes.
- Middleware 404 estandarizado.

## Endpoints principales

### Sistema

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Health check API/DB |
| GET | `/api/logger/test` | Prueba del logger; endpoint interno configurable |
| GET | `/api/docs` | Swagger UI |

### Usuarios

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/users` | Crear usuario |
| GET | `/api/users` | Listar usuarios paginados |
| GET | `/api/users/:id` | Obtener usuario |
| PATCH | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |
| POST | `/api/users/:id/documents` | Cargar hasta 5 documentos |

En `documents` se aceptan PDF, JPG/JPEG y PNG. El tamaño máximo se controla con `MAX_FILE_SIZE_MB`. Los metadatos quedan guardados en MongoDB.

### Envíos

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/shipments` | Crear envío |
| GET | `/api/shipments` | Listar con paginación y filtro de estado |
| GET | `/api/shipments/:id` | Obtener envío |
| PATCH | `/api/shipments/:id` | Editar mientras está `CREATED` |
| PATCH | `/api/shipments/:id/status` | Cambiar estado |
| GET | `/api/shipments/tracking/:idOrCode` | Tracking por ID o código |
| POST | `/api/shipments/:id/receipt` | Cargar comprobante |
| DELETE | `/api/shipments/:id` | Eliminar cuando el estado lo permite |

Flujo de estado admitido:

```text
CREATED ──► IN_TRANSIT ──► DELIVERED
   └──────► CANCELLED
```

### Mocks

| Método | Ruta | Body |
|---|---|---|
| POST | `/api/mocks/users` | `{ "count": 10 }` |
| POST | `/api/mocks/shipments` | `{ "count": 10 }` |

La cantidad válida es de 1 a 100. Para generar envíos mock debe existir al menos un usuario.

## Respuestas JSON

Éxito:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos inválidos"
  }
}
```

Errores personalizados incluidos: recurso no encontrado, datos inválidos, estado inválido, archivo requerido, tipo de archivo inválido y cantidad inválida de mocks.

## Logs

Winston registra:

- `logs/error.log`: errores.
- `logs/combined.log`: actividad general.
- Consola: solamente en `development`.

Los `.log` generados están ignorados por Git.

## Uploads

Los archivos se guardan en `uploads/`, pero los uploads locales están ignorados por Git. La carpeta conserva solamente `.gitkeep` en el repositorio.

Tipos admitidos:

- `application/pdf`
- `image/jpeg`
- `image/png`

El límite se controla con `MAX_FILE_SIZE_MB`.

## Docker

### Docker Compose recomendado

Construir e iniciar API + MongoDB:

```bash
docker compose up --build
```

En segundo plano:

```bash
docker compose up --build -d
```

Detener:

```bash
docker compose down
```

Eliminar también los volúmenes:

```bash
docker compose down -v
```

`docker-compose.yml` incluye un healthcheck de MongoDB y la API depende de que Mongo esté saludable antes de iniciar.

### Dockerfile manual

```bash
docker build -t shipnow-api .
docker run --rm -p 8080:8080 \
  -e MONGO_URI=mongodb://host.docker.internal:27017/shipnow \
  -e PORT=8080 \
  shipnow-api
```

El Dockerfile utiliza build multi-stage, instala únicamente dependencias de producción y ejecuta la aplicación con un usuario no root.

## Producción y performance

- Variables de entorno centralizadas.
- `.env.example` versionable.
- Health check.
- Paginación con límite máximo de 100 resultados.
- JSON limitado a 1 MB.
- Archivos con límite configurable.
- Endpoint de logger interno controlado por variable de entorno.
- Logs diferenciados por nivel.
- Índices para email, tracking, estado, remitente y fecha.
- Manejo global de excepciones sin exponer stack traces al cliente.
- Helmet y eliminación de `X-Powered-By`.
