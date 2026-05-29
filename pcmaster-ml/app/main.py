"""
PCMaster Bottleneck ML Service — FastAPI Application.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models.bottleneck_model import BottleneckModel
from app.schemas.bottleneck import (
    BottleneckRequest,
    BatchBottleneckRequest,
    BottleneckResult,
    HealthResponse,
    ModelInfoResponse,
)
from app.models.feature_engineer import FEATURE_NAMES


# Global model instance
_model: BottleneckModel | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _model
    _model = BottleneckModel()
    yield
    _model = None


app = FastAPI(
    title="PCMaster Bottleneck ML Service",
    description="ML-powered PC component bottleneck analysis",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        model_loaded=_model.model_loaded if _model else False,
        version="1.0.0",
    )


@app.post("/predict", response_model=BottleneckResult)
async def predict(request: BottleneckRequest):
    """
    Predict bottleneck for a CPU + GPU + resolution combination.

    Accepts flexible specs JSON — keys don't need to follow a fixed schema.
    The feature engineer uses fuzzy key matching to extract relevant values.
    """
    if _model is None:
        raise HTTPException(status_code=503, detail="Model not initialized")

    try:
        result = _model.predict(
            cpu_specs=request.cpu.specs,
            gpu_specs=request.gpu.specs,
            resolution=request.resolution,
        )
        return BottleneckResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/batch-predict", response_model=list[BottleneckResult])
async def batch_predict(request: BatchBottleneckRequest):
    """Batch prediction for seeding bottleneck_profiles table."""
    if _model is None:
        raise HTTPException(status_code=503, detail="Model not initialized")

    results = []
    for item in request.items:
        try:
            result = _model.predict(
                cpu_specs=item.cpu.specs,
                gpu_specs=item.gpu.specs,
                resolution=item.resolution,
            )
            results.append(BottleneckResult(**result))
        except Exception as e:
            results.append(BottleneckResult(
                bottleneck_percent=0,
                bottleneck_side="BALANCED",
                fps_estimate=0,
                cpu_score_used=0,
                gpu_score_used=0,
                recommendations=[f"Error: {str(e)}"],
                details={"error": str(e)},
            ))
    return results


@app.get("/model-info", response_model=ModelInfoResponse)
async def model_info():
    return ModelInfoResponse(
        version="1.0.0",
        algorithm="LightGBM" if (_model and _model.model_loaded) else "Rule-based fallback",
        features_used=FEATURE_NAMES,
        training_samples=0,
        metrics={},
    )


@app.post("/reload")
async def reload_model():
    """Reload models from disk after retraining."""
    if _model:
        _model.reload_models()
        return {"status": "reloaded", "model_loaded": _model.model_loaded}
    raise HTTPException(status_code=503, detail="Service not initialized")


if __name__ == "__main__":
    import uvicorn
    from app.config import HOST, PORT
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
