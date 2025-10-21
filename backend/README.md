# Dime Backend API

Python FastAPI backend for the Dime brand ambassador platform.

## Setup

1. Create a virtual environment and install dependencies:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your Supabase credentials:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
FRONTEND_URL=http://localhost:3000
```

## Running the Server

### Development Mode
```bash
./start.sh
```

Or manually:
```bash
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`

### API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Auth
- `POST /api/auth/check-user-exists` - Check if a user exists and get their role
- `POST /api/auth/validate-login` - Validate login credentials and role match

### Users
- `DELETE /api/users/delete` - Delete a user and all associated data

## Project Structure

```
backend/
├── main.py              # FastAPI app entry point
├── config.py            # Settings and configuration
├── supabase_client.py   # Supabase client initialization
├── routers/             # API route handlers
│   ├── auth.py         # Authentication endpoints
│   └── users.py        # User management endpoints
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (not in git)
├── .env.example         # Example environment file
└── README.md           # This file
```

## Testing

Run unit tests:
```bash
pytest
```

Run tests with coverage:
```bash
pytest --cov=.
```

## Development

The backend uses:
- **FastAPI** for the web framework
- **Supabase** for database and authentication
- **Pydantic** for data validation
- **Uvicorn** for ASGI server

All API responses follow consistent error handling patterns and return appropriate HTTP status codes.
