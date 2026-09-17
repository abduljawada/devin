# SnapCal

Photo-first nutrition tracking. Point the camera at a plate, get calories and macros, log it.

- `app/` — Expo (React Native, TypeScript) mobile app, English + Arabic
- `backend/` — FastAPI service: photo → food identification → nutrition → SQLite diary

## Analyzer modes

The vision backend is swappable via the `ANALYZER` env var. All modes return the same
`/analyze` response shape.

| mode | what runs | key needed | notes |
| --- | --- | --- | --- |
| `mock` | deterministic canned result | no | default; keeps the app demoable offline |
| `openai` | `gpt-4o-mini` vision | `OPENAI_API_KEY` | multi-item plates, portion estimates |
| `qwen` | any OpenAI-compatible VL endpoint | `QWEN_API_KEY` + `QWEN_BASE_URL` | e.g. hosted Qwen2.5-VL |
| `local` | Food-101 ViT classifier on CPU | no | free and offline, single dish only, needs `torch` + `transformers` |

Cost control for the LLM modes: photos are downscaled to 512 px, sent at `detail: low`,
and results are cached by image hash so re-analysing the same photo is free.

## Run the backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env        # set ANALYZER=openai and your key
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Optional local classifier mode:

```bash
.venv/bin/pip install torch --index-url https://download.pytorch.org/whl/cpu
.venv/bin/pip install transformers
```

### API

| method | path | purpose |
| --- | --- | --- |
| `POST` | `/analyze` | multipart `photo` → items with per-portion nutrition |
| `GET` | `/foods?q=` | manual food search over the built-in table |
| `GET`/`POST` | `/entries` | today's diary, add an entry |
| `DELETE` | `/entries/{id}` | remove an entry |
| `GET` | `/summary` | today's totals vs goals |
| `GET` | `/history?days=7` | daily calories for the trend chart |
| `GET`/`PUT` | `/profile` | calorie and macro goals |

## Run the app

```bash
cd app
npm install
EXPO_PUBLIC_API_URL=https://your-backend npx expo start
```

Scan the QR code with Expo Go. The backend URL is also editable in the app's Settings tab,
which is the easier path when the tunnel URL changes.

To reach a backend running on your machine from a physical phone, expose it:

```bash
cloudflared tunnel --url http://localhost:8000
```

## Roadmap

- Barcode scanning for packaged foods (Open Food Facts, free, no key) — `expo-camera`
  already has the scanner enabled
- Reference-object portion sizing to tighten the ±20 % gram estimates
- Per-user accounts and cloud sync
