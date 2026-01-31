# Wine Collector API

AI-powered wine collection management and pairing recommendation API.

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy 2.0
- **AI**: Claude API (Anthropic) for label recognition and recommendations
- **Storage**: Cloudflare R2 (S3-compatible)
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Docker (optional)

### Local Development

1. **Clone and setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements-dev.txt
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start PostgreSQL** (using Docker)
   ```bash
   docker-compose up db -d
   ```

4. **Run migrations**
   ```bash
   alembic upgrade head
   ```

5. **Start development server**
   ```bash
   uvicorn app.main:app --reload
   ```

6. **Access API docs**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

### Using Docker

```bash
docker-compose up --build
```

## Project Structure

```
backend/
├── app/
│   ├── api/          # API routes
│   │   └── v1/       # API version 1
│   ├── models/       # SQLAlchemy models
│   ├── schemas/      # Pydantic schemas
│   ├── services/     # Business logic
│   └── utils/        # Utility functions
├── alembic/          # Database migrations
├── tests/            # Test files
└── requirements.txt  # Dependencies
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Wine Scanning
- `POST /api/v1/scan` - Scan single wine label
- `POST /api/v1/scan/batch` - Scan multiple wines
- `POST /api/v1/scan/check` - Check for duplicates

### Wine Collection
- `GET /api/v1/wines` - List wines
- `POST /api/v1/wines` - Add wine
- `GET /api/v1/wines/{id}` - Get wine details
- `PATCH /api/v1/wines/{id}` - Update wine
- `DELETE /api/v1/wines/{id}` - Delete wine

### Recommendations
- `POST /api/v1/recommendations` - Get pairing recommendations
- `GET /api/v1/recommendations/history` - Get history

### Tags
- `GET /api/v1/tags` - List tags
- `POST /api/v1/tags` - Create tag
- `PATCH /api/v1/tags/{id}` - Update tag
- `DELETE /api/v1/tags/{id}` - Delete tag

### Dashboard
- `GET /api/v1/dashboard/summary` - Cellar summary
- `GET /api/v1/dashboard/expiring` - Expiring wines

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection URL | Yes |
| JWT_SECRET_KEY | Secret key for JWT | Yes |
| ANTHROPIC_API_KEY | Claude API key | For AI features |
| R2_ACCESS_KEY_ID | R2 access key | For file uploads |
| R2_SECRET_ACCESS_KEY | R2 secret key | For file uploads |
| R2_BUCKET_NAME | R2 bucket name | For file uploads |

## Running Tests

```bash
pytest
```

## Deployment

### Render

1. Connect your GitHub repository to Render
2. Create a new Blueprint instance
3. Select `render.yaml` from the repository
4. Configure environment variables
5. Deploy

## License

MIT
