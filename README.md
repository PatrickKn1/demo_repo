# Bankroll Tracker

A clean, modern Android app for tracking bankrolls across poker, stocks, gambling, flipping, and more.

## Features

- **Rolls** — Create separate bankroll buckets for different activities (poker, stocks, sports betting, etc.)
- **Sub-Rolls** — Nest rolls inside rolls (e.g., individual session dates within a poker roll)
- **Entry Tracking** — Log buy-in, cash-out, date, and optional notes for each session
- **Live Stats** — Total P/L, win rate, average profit, ROI, biggest win/loss
- **Running P/L Chart** — Visual line chart of cumulative profit over time
- **Filters & Sorting** — Filter by wins/losses, sort by date or profit — collapses out of the way when not in use
- **Collapsible Notes** — Notes stay hidden until tapped, keeping the interface clean
- **Local-first Storage** — Room (SQLite) database on device; Google Sign-In sync planned
- **Dark Theme** — Sleek dark UI with profit-green / loss-red accents

## Project Structure

```
├── app/                        # Android app (Kotlin, Jetpack Compose)
│   └── src/main/java/com/demo/app/
│       ├── data/
│       │   ├── local/          # Room entities, DAOs, database
│       │   ├── remote/         # Retrofit API client + DTOs
│       │   └── repository/     # BankrollRepository
│       ├── ui/
│       │   ├── components/     # RollCard, EntryCard, StatsCard, ProfitChart, FilterBar
│       │   ├── screens/        # Home, RollDetail, AddEditRoll, AddEditEntry, Settings
│       │   ├── viewmodel/      # HomeViewModel, RollDetailViewModel
│       │   ├── navigation/     # NavGraph + Routes
│       │   └── theme/          # Dark/light theme, colors, typography
│       └── util/               # Currency/date formatting
│
├── backend/                    # Ktor server (Kotlin)
│   └── src/main/kotlin/com/demo/backend/
│       ├── models/             # Exposed table definitions (Rolls, Entries)
│       ├── plugins/            # Database, serialization, CORS, routing
│       ├── routes/             # REST API (rolls, entries, math, graph, health)
│       └── services/           # MathService, GraphService
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

## Backend API

| Method   | Endpoint                  | Description              |
|----------|---------------------------|--------------------------|
| `GET`    | `/api/rolls`              | List top-level rolls     |
| `POST`   | `/api/rolls`              | Create a roll            |
| `GET`    | `/api/rolls/{id}`         | Get roll by ID           |
| `PUT`    | `/api/rolls/{id}`         | Update roll              |
| `DELETE` | `/api/rolls/{id}`         | Delete roll + children   |
| `GET`    | `/api/rolls/{id}/stats`   | Roll stats               |
| `GET`    | `/api/entries?rollId=`    | List entries for a roll  |
| `POST`   | `/api/entries`            | Create an entry          |
| `PUT`    | `/api/entries/{id}`       | Update entry             |
| `DELETE` | `/api/entries/{id}`       | Delete entry             |
| `POST`   | `/api/math/calculate`     | Math operations          |
| `POST`   | `/api/graph/shortest-path`| Graph shortest path      |
| `GET`    | `/api/health`             | Health check             |

## Running

**Backend:**
```bash
./gradlew :backend:run
```

**Android App:**
Open in Android Studio and run on emulator or device.
