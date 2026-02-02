"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import close_db, init_db, async_session_maker
from app.api.v1.router import api_router
from app.seeds import run_seeds
from app.logging_config import setup_logging, get_logger

# Initialize logging
setup_logging(
    log_level=settings.log_level,
    json_format=settings.log_json,
)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info("Application starting up", extra={"env": settings.app_env})

    # Startup
    if settings.is_development:
        await init_db()

    # Run seeds (create test user if not exists)
    async with async_session_maker() as db:
        await run_seeds(db)

    logger.info("Application ready")
    yield

    # Shutdown
    logger.info("Application shutting down")
    await close_db()


def create_application() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        description="AI-powered wine collection management and pairing recommendation API",
        version="0.1.0",
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        openapi_url="/openapi.json" if settings.is_development else None,
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API router
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Handle all unhandled exceptions with JSON logging."""
        logger.error(
            "Unhandled exception",
            exc_info=exc,
            extra={
                "request_id": request.headers.get("x-request-id"),
                "method": request.method,
                "path": str(request.url.path),
                "client_ip": request.client.host if request.client else None,
            },
        )
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred",
                },
            },
        )

    return app


app = create_application()


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": "0.1.0",
    }
