"""
Feature Engineering for PC Bottleneck Analysis.

CORE DESIGN PRINCIPLE:
  Product specs JSON keys are NOT fixed — they vary across CSV import sources.
  This module uses FUZZY KEY MATCHING with configurable aliases to robustly
  extract features from any specs dict, regardless of key naming conventions.

Example: A CPU's "TDP" might appear as any of:
  "tdp", "tdp_w", "TDP", "power_consumption", "thermal_design_power", "wattage"
  → All map to the same canonical feature: cpu_tdp
"""
from __future__ import annotations

import re
import numpy as np
from typing import Optional


# ---------------------------------------------------------------------------
# KEY ALIAS REGISTRY
# Maps canonical feature names → list of possible raw-JSON key patterns.
# Patterns are matched case-insensitively; partial/substring matching supported.
# Order matters: first match wins.
# ---------------------------------------------------------------------------

CPU_KEY_ALIASES: dict[str, list[str]] = {
    "performance_score": [
        "performance_score", "perf_score", "benchmark_score", "benchmark",
        "score", "cinebench", "passmark", "cpu_score", "cpu_mark",
    ],
    "cores": [
        "cores", "core_count", "num_cores", "physical_cores", "cpu_cores",
    ],
    "threads": [
        "threads", "thread_count", "num_threads", "logical_processors",
    ],
    "base_clock": [
        "base_clock_ghz", "base_clock", "base_freq", "clock_speed",
        "base_frequency", "clock_ghz", "frequency_ghz",
    ],
    "boost_clock": [
        "boost_clock_ghz", "boost_clock", "turbo_clock", "max_clock",
        "boost_freq", "turbo_freq", "max_frequency", "boost_frequency",
    ],
    "cache": [
        "cache_mb", "cache", "l3_cache", "l3_cache_mb", "total_cache",
        "cache_size", "smart_cache",
    ],
    "tdp": [
        "tdp_w", "tdp", "power_consumption", "thermal_design_power",
        "wattage", "power", "processor_tdp", "default_tdp",
    ],
}

GPU_KEY_ALIASES: dict[str, list[str]] = {
    "performance_score": [
        "performance_score", "perf_score", "benchmark_score", "benchmark",
        "score", "3dmark", "gpu_score", "gpu_mark", "graphics_score",
    ],
    "vram": [
        "vram_gb", "vram", "memory_gb", "video_memory", "gpu_memory",
        "memory_size", "memory_size_gb", "framebuffer",
    ],
    "base_clock": [
        "base_clock_mhz", "base_clock", "gpu_clock", "core_clock",
        "clock_speed", "clock_mhz", "engine_clock",
    ],
    "boost_clock": [
        "boost_clock_mhz", "boost_clock", "game_clock", "max_clock",
        "boost_freq", "oc_clock", "overclock",
    ],
    "tdp": [
        "tdp_w", "tdp", "power_consumption", "total_board_power",
        "wattage", "power", "gpu_power", "tgp", "tbp",
        "total_graphics_power",
    ],
    "vram_type": [
        "vram_type", "memory_type", "ram_type", "gddr_type",
    ],
    "memory_bus": [
        "memory_bus", "bus_width", "memory_bus_width", "memory_interface",
        "bus_width_bit",
    ],
}

# ---------------------------------------------------------------------------
# RESOLUTION ENCODING
# ---------------------------------------------------------------------------

RESOLUTION_MAP: dict[str, float] = {
    "720p": 0.5,
    "1080p": 1.0,
    "fhd": 1.0,
    "1920x1080": 1.0,
    "1440p": 1.5,
    "2k": 1.5,
    "qhd": 1.5,
    "2560x1440": 1.5,
    "4k": 2.5,
    "uhd": 2.5,
    "2160p": 2.5,
    "3840x2160": 2.5,
}


def _normalize_key(key: str) -> str:
    """Normalize a key: lowercase, strip spaces, replace separators with underscore."""
    return re.sub(r"[\s\-\.]+", "_", key.strip().lower())


def _extract_value(specs: dict, aliases: list[str]) -> Optional[float]:
    """
    Look up a value from a specs dict using a list of alias patterns.
    Tries exact match first, then substring match as fallback.
    Returns float or None if not found / not numeric.
    """
    # Normalize all keys in the input specs
    normalized: dict[str, any] = {_normalize_key(k): v for k, v in specs.items()}

    # Pass 1: Exact match against aliases
    for alias in aliases:
        norm_alias = _normalize_key(alias)
        if norm_alias in normalized:
            return _to_float(normalized[norm_alias])

    # Pass 2: Substring/contains match (alias is substring of key, or vice versa)
    for alias in aliases:
        norm_alias = _normalize_key(alias)
        for key, value in normalized.items():
            if norm_alias in key or key in norm_alias:
                return _to_float(value)

    return None


def _to_float(value) -> Optional[float]:
    """Safely convert any value to float. Handles strings like '125W', '3.2 GHz'."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, bool):
        return 1.0 if value else 0.0
    if isinstance(value, str):
        # Extract first numeric part from strings like "125W", "3.2 GHz", "16 GB"
        match = re.search(r"[-+]?\d*\.?\d+", value.replace(",", ""))
        if match:
            return float(match.group())
    return None


def extract_cpu_features(specs: dict) -> dict[str, Optional[float]]:
    """
    Extract canonical CPU features from a flexible specs dict.
    Returns a dict of feature_name → float_value (or None if missing).
    """
    features = {}
    for canonical, aliases in CPU_KEY_ALIASES.items():
        features[f"cpu_{canonical}"] = _extract_value(specs, aliases)
    return features


def extract_gpu_features(specs: dict) -> dict[str, Optional[float]]:
    """
    Extract canonical GPU features from a flexible specs dict.
    Returns a dict of feature_name → float_value (or None if missing).
    """
    features = {}
    for canonical, aliases in GPU_KEY_ALIASES.items():
        features[f"gpu_{canonical}"] = _extract_value(specs, aliases)
    return features


def encode_resolution(resolution: str) -> float:
    """Convert a resolution string to a numeric weight."""
    return RESOLUTION_MAP.get(_normalize_key(resolution), 1.0)


def build_feature_vector(
    cpu_specs: dict,
    gpu_specs: dict,
    resolution: str,
) -> tuple[np.ndarray, list[str]]:
    """
    Build a complete feature vector from CPU specs, GPU specs, and resolution.

    Returns:
        (feature_array, feature_names)
        - feature_array: np.ndarray of shape (n_features,), NaN for missing values
        - feature_names: list of human-readable feature names

    LightGBM handles NaN natively — missing specs won't crash the model.
    """
    cpu_feats = extract_cpu_features(cpu_specs)
    gpu_feats = extract_gpu_features(gpu_specs)
    res_weight = encode_resolution(resolution)

    # Derived features
    cpu_score = cpu_feats.get("cpu_performance_score")
    gpu_score = gpu_feats.get("gpu_performance_score")

    # CPU/GPU score ratio (key bottleneck indicator)
    if cpu_score is not None and gpu_score is not None and gpu_score > 0:
        score_ratio = cpu_score / gpu_score
    else:
        score_ratio = None

    # Total TDP
    cpu_tdp = cpu_feats.get("cpu_tdp")
    gpu_tdp = gpu_feats.get("gpu_tdp")
    if cpu_tdp is not None and gpu_tdp is not None:
        total_tdp = cpu_tdp + gpu_tdp
    else:
        total_tdp = None

    # Estimated VRAM bandwidth (vram_gb * bus_width_approx)
    gpu_vram = gpu_feats.get("gpu_vram")
    gpu_bus = gpu_feats.get("gpu_memory_bus")
    if gpu_vram is not None and gpu_bus is not None:
        vram_bandwidth = gpu_vram * gpu_bus
    else:
        vram_bandwidth = None

    # Assemble ordered feature vector
    feature_pairs = [
        # CPU raw features
        ("cpu_performance_score", cpu_feats.get("cpu_performance_score")),
        ("cpu_cores", cpu_feats.get("cpu_cores")),
        ("cpu_threads", cpu_feats.get("cpu_threads")),
        ("cpu_base_clock", cpu_feats.get("cpu_base_clock")),
        ("cpu_boost_clock", cpu_feats.get("cpu_boost_clock")),
        ("cpu_cache", cpu_feats.get("cpu_cache")),
        ("cpu_tdp", cpu_feats.get("cpu_tdp")),
        # GPU raw features
        ("gpu_performance_score", gpu_feats.get("gpu_performance_score")),
        ("gpu_vram", gpu_feats.get("gpu_vram")),
        ("gpu_base_clock", gpu_feats.get("gpu_base_clock")),
        ("gpu_boost_clock", gpu_feats.get("gpu_boost_clock")),
        ("gpu_tdp", gpu_feats.get("gpu_tdp")),
        ("gpu_memory_bus", gpu_feats.get("gpu_memory_bus")),
        # Context
        ("resolution_weight", res_weight),
        # Derived
        ("cpu_gpu_score_ratio", score_ratio),
        ("total_tdp", total_tdp),
        ("vram_bandwidth", vram_bandwidth),
    ]

    names = [p[0] for p in feature_pairs]
    values = np.array([p[1] if p[1] is not None else np.nan for p in feature_pairs],
                      dtype=np.float64)
    return values, names


# Canonical feature names (order must match build_feature_vector output)
FEATURE_NAMES = [
    "cpu_performance_score", "cpu_cores", "cpu_threads",
    "cpu_base_clock", "cpu_boost_clock", "cpu_cache", "cpu_tdp",
    "gpu_performance_score", "gpu_vram", "gpu_base_clock",
    "gpu_boost_clock", "gpu_tdp", "gpu_memory_bus",
    "resolution_weight",
    "cpu_gpu_score_ratio", "total_tdp", "vram_bandwidth",
]
