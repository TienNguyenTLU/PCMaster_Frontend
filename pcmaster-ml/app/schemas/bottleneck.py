"""
Pydantic schemas for the Bottleneck ML API.
"""
from pydantic import BaseModel, Field
from typing import Optional


class ComponentSpecs(BaseModel):
    """
    Flexible specs — accepts ANY key-value pairs from the product's specs JSON.
    The feature engineer will extract what it needs using fuzzy key matching.
    """
    name: Optional[str] = None
    specs: dict = Field(default_factory=dict, description="Raw specs JSON from product, keys are NOT fixed")


class BottleneckRequest(BaseModel):
    cpu: ComponentSpecs
    gpu: ComponentSpecs
    resolution: str = Field(default="1080p", description="Target resolution: 1080p, 1440p, 4K")


class BatchBottleneckRequest(BaseModel):
    items: list[BottleneckRequest]


class BottleneckResult(BaseModel):
    bottleneck_percent: float = Field(ge=0, le=100, description="Overall bottleneck percentage")
    bottleneck_side: str = Field(description="CPU, GPU, or BALANCED")
    fps_estimate: int = Field(ge=0, description="Estimated FPS for average AAA game")
    cpu_score_used: float = Field(description="CPU performance score used in calculation")
    gpu_score_used: float = Field(description="GPU performance score used in calculation")
    recommendations: list[str] = Field(default_factory=list, description="Upgrade suggestions")
    details: dict = Field(default_factory=dict, description="Detailed breakdown")


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str


class ModelInfoResponse(BaseModel):
    version: str
    algorithm: str
    features_used: list[str]
    training_samples: int
    metrics: dict
