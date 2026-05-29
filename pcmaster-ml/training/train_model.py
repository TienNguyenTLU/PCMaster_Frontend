"""
LightGBM Training Pipeline for Bottleneck Prediction.

Trains two models:
  1. bottleneck_lgbm.pkl — predicts bottleneck_percent (regression)
  2. fps_lgbm.pkl — predicts fps_estimate (regression)

bottleneck_side is derived from cpu_gpu_score_ratio, not a separate model.
"""
import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(SCRIPT_DIR, "data", "bottleneck_dataset.csv")
MODEL_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "models")

BOTTLENECK_MODEL_PATH = os.path.join(MODEL_DIR, "bottleneck_lgbm.pkl")
FPS_MODEL_PATH = os.path.join(MODEL_DIR, "fps_lgbm.pkl")
METRICS_PATH = os.path.join(MODEL_DIR, "training_metrics.json")

# Feature columns used for training (must match feature_engineer.py output order)
FEATURE_COLS = [
    "cpu_performance_score", "cpu_cores", "cpu_threads",
    "cpu_base_clock", "cpu_boost_clock", "cpu_cache", "cpu_tdp",
    "gpu_performance_score", "gpu_vram", "gpu_base_clock",
    "gpu_boost_clock", "gpu_tdp", "gpu_memory_bus",
    "resolution_weight",
    "cpu_gpu_score_ratio", "total_tdp", "vram_bandwidth",
]

TARGET_BOTTLENECK = "bottleneck_percent"
TARGET_FPS = "fps_estimate"


def load_data() -> pd.DataFrame:
    """Load and validate the training dataset."""
    if not os.path.exists(DATA_PATH):
        print(f"Dataset not found at {DATA_PATH}")
        print("Run `python training/generate_dataset.py` first!")
        sys.exit(1)

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} samples from {DATA_PATH}")
    print(f"Columns: {list(df.columns)}")

    # Verify required columns
    missing = [c for c in FEATURE_COLS + [TARGET_BOTTLENECK, TARGET_FPS] if c not in df.columns]
    if missing:
        print(f"Missing columns: {missing}")
        sys.exit(1)

    return df


def train_model(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    feature_names: list[str],
    target_name: str,
) -> lgb.LGBMRegressor:
    """Train a single LightGBM model with early stopping."""
    print(f"\n{'='*60}")
    print(f"Training model for: {target_name}")
    print(f"  Train: {len(X_train)}, Val: {len(X_val)}")
    print(f"{'='*60}")

    model = lgb.LGBMRegressor(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=8,
        num_leaves=63,
        min_child_samples=10,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=0.1,
        random_state=42,
        verbose=-1,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        eval_metric="mae",
        callbacks=[
            lgb.early_stopping(stopping_rounds=50),
            lgb.log_evaluation(period=50),
        ],
    )

    # Evaluate
    y_pred = model.predict(X_val)
    mae = mean_absolute_error(y_val, y_pred)
    rmse = np.sqrt(mean_squared_error(y_val, y_pred))
    r2 = r2_score(y_val, y_pred)

    print(f"\n  Results for {target_name}:")
    print(f"    MAE:  {mae:.4f}")
    print(f"    RMSE: {rmse:.4f}")
    print(f"    R²:   {r2:.4f}")

    # Feature importance
    importance = model.feature_importances_
    feat_imp = sorted(zip(feature_names, importance), key=lambda x: -x[1])
    print(f"\n  Top 5 features:")
    for name, imp in feat_imp[:5]:
        print(f"    {name}: {imp}")

    return model, {"mae": mae, "rmse": rmse, "r2": r2}


def main():
    """Full training pipeline."""
    # 1. Load data
    df = load_data()

    # 2. Prepare features and targets
    X = df[FEATURE_COLS].values
    y_bn = df[TARGET_BOTTLENECK].values
    y_fps = df[TARGET_FPS].values

    # 3. Train/test split
    X_train, X_val, y_bn_train, y_bn_val, y_fps_train, y_fps_val = train_test_split(
        X, y_bn, y_fps, test_size=0.2, random_state=42
    )

    # 4. Train bottleneck model
    bn_model, bn_metrics = train_model(
        X_train, y_bn_train, X_val, y_bn_val,
        FEATURE_COLS, TARGET_BOTTLENECK,
    )

    # 5. Train FPS model
    fps_model, fps_metrics = train_model(
        X_train, y_fps_train, X_val, y_fps_val,
        FEATURE_COLS, TARGET_FPS,
    )

    # 6. Save models
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(bn_model, BOTTLENECK_MODEL_PATH)
    joblib.dump(fps_model, FPS_MODEL_PATH)
    print(f"\nModels saved:")
    print(f"  {BOTTLENECK_MODEL_PATH}")
    print(f"  {FPS_MODEL_PATH}")

    # 7. Save metrics
    metrics = {
        "training_samples": len(X_train),
        "validation_samples": len(X_val),
        "features": FEATURE_COLS,
        "bottleneck_model": {k: round(v, 4) for k, v in bn_metrics.items()},
        "fps_model": {k: round(v, 4) for k, v in fps_metrics.items()},
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"  Metrics -> {METRICS_PATH}")

    # 8. Quick sanity check
    print(f"\n{'='*60}")
    print("Sanity check — sample predictions:")
    print(f"{'='*60}")

    test_cases = [
        ("High-end balanced (i9-14900K + RTX 4090 @ 1080p)", 0),
        ("Budget bottleneck (i3 + RTX 4090 @ 1080p)", min(len(X_val)-1, 5)),
    ]
    for label, idx in test_cases:
        bn_pred = bn_model.predict(X_val[idx:idx+1])[0]
        fps_pred = fps_model.predict(X_val[idx:idx+1])[0]
        print(f"  {label}")
        print(f"    BN% pred={bn_pred:.1f}, actual={y_bn_val[idx]:.1f}")
        print(f"    FPS pred={fps_pred:.0f}, actual={y_fps_val[idx]:.0f}")


if __name__ == "__main__":
    main()
