"""
Configuration for the ML Bottleneck service.
"""
import os

# ML Service settings
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "training", "data")

BOTTLENECK_MODEL_PATH = os.path.join(MODEL_DIR, "bottleneck_lgbm.pkl")
FPS_MODEL_PATH = os.path.join(MODEL_DIR, "fps_lgbm.pkl")

# FastAPI settings
HOST = os.getenv("ML_HOST", "0.0.0.0")
PORT = int(os.getenv("ML_PORT", "8000"))

# Resolution weights (higher resolution = GPU-bound workload increases)
RESOLUTION_WEIGHTS = {
    "1080p": 1.0,
    "1440p": 1.5,
    "4k": 2.5,
    "4K": 2.5,
    "2160p": 2.5,
}
