# DemoApp

Android application with a Ktor backend server, database support, and math/graph utilities.

## Project Structure

```
├── app/                    # Android app (Kotlin, Jetpack Compose)
│   └── src/main/java/com/demo/app/
│       ├── data/
│       │   ├── local/      # Room database (SQLite)
│       │   └── remote/     # Retrofit API client
│       ├── ui/             # Compose UI screens & theme
│       └── MainActivity.kt
│
├── backend/                # Ktor server (Kotlin)
│   └── src/main/kotlin/com/demo/backend/
│       ├── models/         # Exposed DB table definitions
│       ├── plugins/        # Ktor plugins (DB, serialization, CORS, routing)
│       ├── routes/         # REST API endpoints
│       ├── services/       # Math & Graph business logic
│       └── Application.kt
```

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| UI          | Jetpack Compose + Material 3      |
| Local DB    | Room (SQLite)                     |
| Networking  | Retrofit + OkHttp                 |
| Backend     | Ktor + Netty                      |
| Backend DB  | Exposed + SQLite                  |
| Language    | Kotlin                            |

## Backend API Endpoints

- `GET  /api/health` — Health check
- `POST /api/math/calculate` — Math operations (sum, mean, stddev, pow, etc.)
- `POST /api/graph/shortest-path` — Dijkstra's shortest path
- `POST /api/graph/neighbors` — Get node neighbors
- `GET  /api/data` — List all data items
- `POST /api/data` — Create a data item
- `GET  /api/data/{id}` — Get data item by ID
- `DELETE /api/data/{id}` — Delete data item

## Running

**Backend:**
```bash
./gradlew :backend:run
```

**Android App:**
Open in Android Studio and run on emulator or device.
