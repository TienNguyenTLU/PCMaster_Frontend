"""
Bottleneck ML Model — loading, inference, and rule-based fallback.

Strategy:
  1. If trained LightGBM model exists → use ML prediction
  2. Otherwise → use rule-based calculation from performance_score ratio
  Both paths share the same feature engineering pipeline.
"""
from __future__ import annotations

import os
import numpy as np
import joblib
from typing import Optional

from app.config import BOTTLENECK_MODEL_PATH, FPS_MODEL_PATH
from app.models.feature_engineer import (
    build_feature_vector,
    extract_cpu_features,
    extract_gpu_features,
    encode_resolution,
    FEATURE_NAMES,
)


class BottleneckModel:
    """Encapsulates both ML and rule-based bottleneck prediction."""

    def __init__(self):
        self.bottleneck_model = None
        self.fps_model = None
        self.model_loaded = False
        self._try_load_models()

    def _try_load_models(self):
        """Attempt to load trained models from disk."""
        try:
            if os.path.exists(BOTTLENECK_MODEL_PATH) and os.path.exists(FPS_MODEL_PATH):
                self.bottleneck_model = joblib.load(BOTTLENECK_MODEL_PATH)
                self.fps_model = joblib.load(FPS_MODEL_PATH)
                self.model_loaded = True
                print(f"[ML] Models loaded successfully from {BOTTLENECK_MODEL_PATH}")
            else:
                print("[ML] No trained models found — using rule-based fallback")
        except Exception as e:
            print(f"[ML] Failed to load models: {e} — using rule-based fallback")
            self.model_loaded = False

    def predict(
        self,
        cpu_specs: dict,
        gpu_specs: dict,
        resolution: str,
    ) -> dict:
        """
        Predict bottleneck metrics for a CPU + GPU + resolution combo.

        Returns dict with:
          bottleneck_percent, bottleneck_side, fps_estimate,
          cpu_score_used, gpu_score_used, recommendations, details
        """
        # Extract features
        feature_vec, feature_names = build_feature_vector(cpu_specs, gpu_specs, resolution)
        cpu_feats = extract_cpu_features(cpu_specs)
        gpu_feats = extract_gpu_features(gpu_specs)
        res_weight = encode_resolution(resolution)

        cpu_score = cpu_feats.get("cpu_performance_score")
        gpu_score = gpu_feats.get("gpu_performance_score")

        if self.model_loaded:
            result = self._ml_predict(feature_vec, cpu_score, gpu_score, res_weight)
        else:
            result = self._rule_based_predict(cpu_feats, gpu_feats, res_weight)

        # Generate recommendations
        result["recommendations"] = self._generate_recommendations(
            result, cpu_specs, gpu_specs, cpu_feats, gpu_feats, resolution
        )

        # Detailed breakdown
        result["details"] = {
            "features_extracted": {
                name: (None if np.isnan(val) else round(val, 2))
                for name, val in zip(feature_names, feature_vec)
            },
            "method": "ml_model" if self.model_loaded else "rule_based",
            "resolution_weight": res_weight,
        }

        return result

    def _ml_predict(
        self,
        feature_vec: np.ndarray,
        cpu_score: Optional[float],
        gpu_score: Optional[float],
        res_weight: float,
    ) -> dict:
        """Use trained LightGBM models for prediction."""
        X = feature_vec.reshape(1, -1)

        bottleneck_pct = float(self.bottleneck_model.predict(X)[0])
        bottleneck_pct = max(0.0, min(100.0, bottleneck_pct))

        fps = int(max(1, round(self.fps_model.predict(X)[0])))

        side = self._determine_side(cpu_score, gpu_score, res_weight)

        return {
            "bottleneck_percent": round(bottleneck_pct, 2),
            "bottleneck_side": side,
            "fps_estimate": fps,
            "cpu_score_used": cpu_score or 0.0,
            "gpu_score_used": gpu_score or 0.0,
        }

    def _rule_based_predict(
        self,
        cpu_feats: dict,
        gpu_feats: dict,
        res_weight: float,
    ) -> dict:
        """
        Rule-based fallback when ML models are not available.
        Uses performance_score ratio with resolution weight adjustment.
        """
        cpu_score = cpu_feats.get("cpu_performance_score")
        gpu_score = gpu_feats.get("gpu_performance_score")

        # If we have benchmark scores, use ratio-based calculation
        if cpu_score and gpu_score and gpu_score > 0:
            # Adjust GPU effective score by resolution weight
            # Higher resolution → GPU matters more → bottleneck shifts toward GPU
            gpu_effective = gpu_score / res_weight

            ratio = cpu_score / gpu_effective

            if ratio < 1.0:
                # CPU is the bottleneck
                bottleneck_pct = (1.0 - ratio) * 100
                side = "CPU"
            elif ratio > 1.0:
                # GPU is the bottleneck
                bottleneck_pct = (1.0 - (1.0 / ratio)) * 100
                side = "GPU"
            else:
                bottleneck_pct = 0.0
                side = "BALANCED"

            bottleneck_pct = min(bottleneck_pct, 100.0)

            # FPS estimation: base FPS from GPU score, adjusted by bottleneck
            base_fps = (gpu_score / 150.0) / res_weight
            fps = int(max(1, round(base_fps * (1 - bottleneck_pct / 200))))

        else:
            # No scores available — try inferring from other specs
            cpu_cores = cpu_feats.get("cpu_cores") or 0
            cpu_boost = cpu_feats.get("cpu_boost_clock") or 0
            gpu_vram = gpu_feats.get("gpu_vram") or 0

            # Very rough heuristic when scores are missing
            if cpu_cores > 0 and gpu_vram > 0:
                cpu_proxy = cpu_cores * (cpu_boost if cpu_boost > 0 else 3.5) * 1000
                gpu_proxy = gpu_vram * 3000
                ratio = cpu_proxy / gpu_proxy if gpu_proxy > 0 else 1.0

                if ratio < 0.8:
                    bottleneck_pct = (1.0 - ratio) * 80
                    side = "CPU"
                elif ratio > 1.25:
                    bottleneck_pct = (1.0 - (1.0 / ratio)) * 80
                    side = "GPU"
                else:
                    bottleneck_pct = abs(1.0 - ratio) * 50
                    side = "BALANCED"

                fps = int(max(1, 60 / res_weight))
            else:
                # Absolute fallback
                bottleneck_pct = 0.0
                side = "BALANCED"
                fps = 60

        return {
            "bottleneck_percent": round(min(max(bottleneck_pct, 0), 100), 2),
            "bottleneck_side": side,
            "fps_estimate": fps,
            "cpu_score_used": cpu_score or 0.0,
            "gpu_score_used": gpu_score or 0.0,
        }

    @staticmethod
    def _determine_side(
        cpu_score: Optional[float],
        gpu_score: Optional[float],
        res_weight: float,
    ) -> str:
        """Determine which component is the bottleneck."""
        if not cpu_score or not gpu_score or gpu_score == 0:
            return "BALANCED"
        ratio = cpu_score / (gpu_score / res_weight)
        if ratio < 0.85:
            return "CPU"
        elif ratio > 1.2:
            return "GPU"
        return "BALANCED"

    def _generate_recommendations(
        self,
        result: dict,
        cpu_specs_raw: dict,
        gpu_specs_raw: dict,
        cpu_feats: dict,
        gpu_feats: dict,
        resolution: str,
    ) -> list[str]:
        """Generate actionable upgrade recommendations based on analysis."""
        recs = []
        pct = result["bottleneck_percent"]
        side = result["bottleneck_side"]

        if pct < 10:
            recs.append("Cấu hình rất cân bằng! Hiệu suất tối ưu.")
            return recs

        if side == "CPU":
            recs.append(
                f"CPU đang gây nghẽn {pct:.1f}%. "
                f"Nên nâng cấp CPU để tận dụng hết sức mạnh GPU."
            )
            cpu_cores = cpu_feats.get("cpu_cores")
            if cpu_cores and cpu_cores < 8:
                recs.append("Nên chọn CPU có ít nhất 8 cores cho gaming hiện đại.")
        elif side == "GPU":
            recs.append(
                f"GPU đang gây nghẽn {pct:.1f}%. "
                f"Nên nâng cấp GPU để tận dụng hết sức mạnh CPU."
            )
            if resolution in ("4k", "4K", "2160p"):
                recs.append("Ở độ phân giải 4K, cần GPU cao cấp (RTX 4080/4090 hoặc RX 7900).")
            gpu_vram = gpu_feats.get("gpu_vram")
            if gpu_vram and gpu_vram < 8:
                recs.append("VRAM dưới 8GB có thể gây thiếu bộ nhớ ở game mới.")

        if pct > 30:
            recs.append("Mức nghẽn trên 30% — nên xem xét nâng cấp linh kiện gây nghẽn.")

        return recs

    def reload_models(self):
        """Reload models from disk (after retraining)."""
        self._try_load_models()
