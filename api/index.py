import sys
from pathlib import Path

# Add backend directory to sys.path so app imports resolve
backend_dir = Path(__file__).parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app  # noqa
