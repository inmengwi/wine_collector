"""JSON logging configuration for structured logs."""

import json
import logging
import sys
import traceback
from datetime import datetime, timezone
from typing import Any


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as single-line JSON."""
        log_data: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add source location
        if record.pathname and record.lineno:
            log_data["source"] = {
                "file": record.pathname.split("/")[-1],
                "line": record.lineno,
                "function": record.funcName,
            }

        # Add exception info if present
        if record.exc_info:
            exc_type, exc_value, exc_tb = record.exc_info
            if exc_type is not None:
                log_data["error"] = {
                    "type": exc_type.__name__,
                    "message": str(exc_value),
                    "traceback": "".join(
                        traceback.format_exception(exc_type, exc_value, exc_tb)
                    ).replace("\n", " | "),  # Single line traceback
                }

        # Handle exc_text separately (uvicorn sometimes uses this)
        if record.exc_text and "error" not in log_data:
            log_data["error"] = {
                "traceback": record.exc_text.replace("\n", " | "),
            }

        # Add extra fields
        extra_keys = set(record.__dict__.keys()) - {
            "name", "msg", "args", "created", "filename", "funcName",
            "levelname", "levelno", "lineno", "module", "msecs",
            "pathname", "process", "processName", "relativeCreated",
            "stack_info", "exc_info", "exc_text", "thread", "threadName",
            "taskName", "message", "color_message",
        }
        for key in extra_keys:
            value = getattr(record, key)
            if value is not None:
                log_data[key] = value

        return json.dumps(log_data, ensure_ascii=False, default=str)


def setup_logging(log_level: str = "INFO", json_format: bool = True) -> None:
    """Configure application logging.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_format: If True, use JSON format. If False, use standard format.
    """
    level = getattr(logging, log_level.upper())

    # Create formatter
    if json_format:
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    root_logger.addHandler(console_handler)

    # Configure uvicorn loggers to use our formatter
    uvicorn_loggers = [
        "uvicorn",
        "uvicorn.error",
        "uvicorn.access",
    ]
    for logger_name in uvicorn_loggers:
        uvicorn_logger = logging.getLogger(logger_name)
        uvicorn_logger.handlers = []  # Remove default handlers
        uvicorn_logger.addHandler(console_handler)
        uvicorn_logger.propagate = False

    # Suppress noisy loggers
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)

    # Set up global exception handler for uncaught exceptions
    if json_format:
        def json_exception_handler(exc_type, exc_value, exc_tb):
            """Handle uncaught exceptions with JSON logging."""
            if issubclass(exc_type, KeyboardInterrupt):
                sys.__excepthook__(exc_type, exc_value, exc_tb)
                return
            error_data = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "CRITICAL",
                "logger": "sys.excepthook",
                "message": "Uncaught exception",
                "error": {
                    "type": exc_type.__name__,
                    "message": str(exc_value),
                    "traceback": "".join(
                        traceback.format_exception(exc_type, exc_value, exc_tb)
                    ).replace("\n", " | "),
                },
            }
            print(json.dumps(error_data, ensure_ascii=False, default=str), file=sys.stderr)

        sys.excepthook = json_exception_handler


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)
