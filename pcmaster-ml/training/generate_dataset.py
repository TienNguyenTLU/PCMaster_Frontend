"""
Synthetic Dataset Generator for PC Bottleneck Training Data.

Generates realistic CPU+GPU+Resolution → bottleneck_percent, fps_estimate
combinations based on real-world benchmark data and physics-based formulas.
"""
import csv
import os
import random
import math

# Output path
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "bottleneck_dataset.csv")

# ---------------------------------------------------------------------------
# REALISTIC CPU DATABASE (based on public benchmarks like Cinebench/PassMark)
# performance_score is a normalized composite score
# ---------------------------------------------------------------------------
CPUS = [
    # Intel 14th Gen
    {"name": "Intel Core i9-14900K", "cores": 24, "threads": 32, "base_clock": 3.2, "boost_clock": 6.0, "cache": 36, "tdp": 125, "score": 41000},
    {"name": "Intel Core i7-14700K", "cores": 20, "threads": 28, "base_clock": 3.4, "boost_clock": 5.6, "cache": 33, "tdp": 125, "score": 37000},
    {"name": "Intel Core i5-14600K", "cores": 14, "threads": 20, "base_clock": 3.5, "boost_clock": 5.3, "cache": 24, "tdp": 125, "score": 30000},
    {"name": "Intel Core i5-14400F", "cores": 10, "threads": 16, "base_clock": 2.5, "boost_clock": 4.7, "cache": 20, "tdp": 65, "score": 24000},
    # Intel 13th Gen
    {"name": "Intel Core i9-13900K", "cores": 24, "threads": 32, "base_clock": 3.0, "boost_clock": 5.8, "cache": 36, "tdp": 125, "score": 40000},
    {"name": "Intel Core i7-13700K", "cores": 16, "threads": 24, "base_clock": 3.4, "boost_clock": 5.4, "cache": 30, "tdp": 125, "score": 35000},
    {"name": "Intel Core i5-13600K", "cores": 14, "threads": 20, "base_clock": 3.5, "boost_clock": 5.1, "cache": 24, "tdp": 125, "score": 28000},
    {"name": "Intel Core i5-13400F", "cores": 10, "threads": 16, "base_clock": 2.5, "boost_clock": 4.6, "cache": 20, "tdp": 65, "score": 22000},
    {"name": "Intel Core i3-13100F", "cores": 4, "threads": 8, "base_clock": 3.4, "boost_clock": 4.5, "cache": 12, "tdp": 58, "score": 14000},
    # Intel 12th Gen
    {"name": "Intel Core i9-12900K", "cores": 16, "threads": 24, "base_clock": 3.2, "boost_clock": 5.2, "cache": 30, "tdp": 125, "score": 35000},
    {"name": "Intel Core i7-12700K", "cores": 12, "threads": 20, "base_clock": 3.6, "boost_clock": 5.0, "cache": 25, "tdp": 125, "score": 30000},
    {"name": "Intel Core i5-12600K", "cores": 10, "threads": 16, "base_clock": 3.7, "boost_clock": 4.9, "cache": 20, "tdp": 125, "score": 25000},
    {"name": "Intel Core i5-12400F", "cores": 6, "threads": 12, "base_clock": 2.5, "boost_clock": 4.4, "cache": 18, "tdp": 65, "score": 19000},
    {"name": "Intel Core i3-12100F", "cores": 4, "threads": 8, "base_clock": 3.3, "boost_clock": 4.3, "cache": 12, "tdp": 58, "score": 13000},
    # AMD Ryzen 7000
    {"name": "AMD Ryzen 9 7950X", "cores": 16, "threads": 32, "base_clock": 4.5, "boost_clock": 5.7, "cache": 80, "tdp": 170, "score": 42000},
    {"name": "AMD Ryzen 9 7900X", "cores": 12, "threads": 24, "base_clock": 4.7, "boost_clock": 5.6, "cache": 76, "tdp": 170, "score": 38000},
    {"name": "AMD Ryzen 7 7800X3D", "cores": 8, "threads": 16, "base_clock": 4.2, "boost_clock": 5.0, "cache": 104, "tdp": 120, "score": 34000},
    {"name": "AMD Ryzen 7 7700X", "cores": 8, "threads": 16, "base_clock": 4.5, "boost_clock": 5.4, "cache": 40, "tdp": 105, "score": 32000},
    {"name": "AMD Ryzen 5 7600X", "cores": 6, "threads": 12, "base_clock": 4.7, "boost_clock": 5.3, "cache": 38, "tdp": 105, "score": 27000},
    {"name": "AMD Ryzen 5 7600", "cores": 6, "threads": 12, "base_clock": 3.8, "boost_clock": 5.1, "cache": 38, "tdp": 65, "score": 25000},
    # AMD Ryzen 5000
    {"name": "AMD Ryzen 9 5950X", "cores": 16, "threads": 32, "base_clock": 3.4, "boost_clock": 4.9, "cache": 72, "tdp": 105, "score": 32000},
    {"name": "AMD Ryzen 9 5900X", "cores": 12, "threads": 24, "base_clock": 3.7, "boost_clock": 4.8, "cache": 70, "tdp": 105, "score": 29000},
    {"name": "AMD Ryzen 7 5800X", "cores": 8, "threads": 16, "base_clock": 3.8, "boost_clock": 4.7, "cache": 36, "tdp": 105, "score": 26000},
    {"name": "AMD Ryzen 7 5700X", "cores": 8, "threads": 16, "base_clock": 3.4, "boost_clock": 4.6, "cache": 36, "tdp": 65, "score": 24000},
    {"name": "AMD Ryzen 5 5600X", "cores": 6, "threads": 12, "base_clock": 3.7, "boost_clock": 4.6, "cache": 35, "tdp": 65, "score": 21000},
    {"name": "AMD Ryzen 5 5600", "cores": 6, "threads": 12, "base_clock": 3.5, "boost_clock": 4.4, "cache": 35, "tdp": 65, "score": 20000},
    {"name": "AMD Ryzen 5 5500", "cores": 6, "threads": 12, "base_clock": 3.6, "boost_clock": 4.2, "cache": 19, "tdp": 65, "score": 18000},
    # Budget / Older
    {"name": "Intel Core i5-10400F", "cores": 6, "threads": 12, "base_clock": 2.9, "boost_clock": 4.3, "cache": 12, "tdp": 65, "score": 14000},
    {"name": "AMD Ryzen 3 4100", "cores": 4, "threads": 8, "base_clock": 3.8, "boost_clock": 4.0, "cache": 6, "tdp": 65, "score": 11000},
    {"name": "Intel Core i3-10100F", "cores": 4, "threads": 8, "base_clock": 3.6, "boost_clock": 4.3, "cache": 6, "tdp": 65, "score": 10000},
]

# ---------------------------------------------------------------------------
# REALISTIC GPU DATABASE (based on 3DMark / game benchmarks)
# ---------------------------------------------------------------------------
GPUS = [
    # NVIDIA RTX 40 Series
    {"name": "NVIDIA RTX 4090", "vram": 24, "base_clock": 2235, "boost_clock": 2520, "tdp": 450, "bus": 384, "score": 38000},
    {"name": "NVIDIA RTX 4080 SUPER", "vram": 16, "base_clock": 2295, "boost_clock": 2550, "tdp": 320, "bus": 256, "score": 33000},
    {"name": "NVIDIA RTX 4080", "vram": 16, "base_clock": 2205, "boost_clock": 2505, "tdp": 320, "bus": 256, "score": 32000},
    {"name": "NVIDIA RTX 4070 Ti SUPER", "vram": 16, "base_clock": 2340, "boost_clock": 2610, "tdp": 285, "bus": 256, "score": 29000},
    {"name": "NVIDIA RTX 4070 Ti", "vram": 12, "base_clock": 2310, "boost_clock": 2610, "tdp": 285, "bus": 192, "score": 27000},
    {"name": "NVIDIA RTX 4070 SUPER", "vram": 12, "base_clock": 1980, "boost_clock": 2475, "tdp": 220, "bus": 192, "score": 26000},
    {"name": "NVIDIA RTX 4070", "vram": 12, "base_clock": 1920, "boost_clock": 2475, "tdp": 200, "bus": 192, "score": 23000},
    {"name": "NVIDIA RTX 4060 Ti", "vram": 8, "base_clock": 2310, "boost_clock": 2535, "tdp": 160, "bus": 128, "score": 20000},
    {"name": "NVIDIA RTX 4060", "vram": 8, "base_clock": 1830, "boost_clock": 2460, "tdp": 115, "bus": 128, "score": 18000},
    # NVIDIA RTX 30 Series
    {"name": "NVIDIA RTX 3090", "vram": 24, "base_clock": 1395, "boost_clock": 1695, "tdp": 350, "bus": 384, "score": 27000},
    {"name": "NVIDIA RTX 3080", "vram": 10, "base_clock": 1440, "boost_clock": 1710, "tdp": 320, "bus": 320, "score": 25000},
    {"name": "NVIDIA RTX 3070", "vram": 8, "base_clock": 1500, "boost_clock": 1730, "tdp": 220, "bus": 256, "score": 21000},
    {"name": "NVIDIA RTX 3060 Ti", "vram": 8, "base_clock": 1410, "boost_clock": 1665, "tdp": 200, "bus": 256, "score": 19000},
    {"name": "NVIDIA RTX 3060", "vram": 12, "base_clock": 1320, "boost_clock": 1777, "tdp": 170, "bus": 192, "score": 16000},
    {"name": "NVIDIA RTX 3050", "vram": 8, "base_clock": 1552, "boost_clock": 1777, "tdp": 130, "bus": 128, "score": 12000},
    # NVIDIA GTX 16 Series
    {"name": "NVIDIA GTX 1660 SUPER", "vram": 6, "base_clock": 1530, "boost_clock": 1785, "tdp": 125, "bus": 192, "score": 10000},
    {"name": "NVIDIA GTX 1650", "vram": 4, "base_clock": 1485, "boost_clock": 1665, "tdp": 75, "bus": 128, "score": 7000},
    # AMD RX 7000
    {"name": "AMD RX 7900 XTX", "vram": 24, "base_clock": 1855, "boost_clock": 2499, "tdp": 355, "bus": 384, "score": 34000},
    {"name": "AMD RX 7900 XT", "vram": 20, "base_clock": 1500, "boost_clock": 2394, "tdp": 315, "bus": 320, "score": 30000},
    {"name": "AMD RX 7800 XT", "vram": 16, "base_clock": 1295, "boost_clock": 2430, "tdp": 263, "bus": 256, "score": 24000},
    {"name": "AMD RX 7700 XT", "vram": 12, "base_clock": 1700, "boost_clock": 2544, "tdp": 245, "bus": 192, "score": 21000},
    {"name": "AMD RX 7600", "vram": 8, "base_clock": 1720, "boost_clock": 2655, "tdp": 165, "bus": 128, "score": 16000},
    # AMD RX 6000
    {"name": "AMD RX 6900 XT", "vram": 16, "base_clock": 1825, "boost_clock": 2250, "tdp": 300, "bus": 256, "score": 26000},
    {"name": "AMD RX 6800 XT", "vram": 16, "base_clock": 1825, "boost_clock": 2250, "tdp": 300, "bus": 256, "score": 24000},
    {"name": "AMD RX 6700 XT", "vram": 12, "base_clock": 2321, "boost_clock": 2581, "tdp": 230, "bus": 192, "score": 18000},
    {"name": "AMD RX 6600", "vram": 8, "base_clock": 1626, "boost_clock": 2491, "tdp": 132, "bus": 128, "score": 14000},
    {"name": "AMD RX 6500 XT", "vram": 4, "base_clock": 2310, "boost_clock": 2815, "tdp": 107, "bus": 64, "score": 8000},
    # Budget / Older
    {"name": "NVIDIA GT 1030", "vram": 2, "base_clock": 1228, "boost_clock": 1468, "tdp": 30, "bus": 64, "score": 3000},
    {"name": "AMD RX 580", "vram": 8, "base_clock": 1257, "boost_clock": 1340, "tdp": 185, "bus": 256, "score": 9000},
]

RESOLUTIONS = ["1080p", "1440p", "4K"]
RESOLUTION_WEIGHTS = {"1080p": 1.0, "1440p": 1.5, "4K": 2.5}

# Base FPS factors per GPU score tier (at 1080p, no bottleneck)
# Calibrated roughly to real-world gaming averages
GPU_FPS_BASE = 160  # Score=38000 → ~160 FPS at 1080p for average AAA game


def calculate_bottleneck(cpu_score: float, gpu_score: float, res_weight: float) -> tuple[float, str]:
    """
    Calculate bottleneck percentage and side.

    The formula models a real-world relationship:
      - At 1080p: CPU matters more → CPU bottleneck is more common
      - At 4K: GPU matters more → GPU bottleneck is more common
      - 'ratio' compares CPU effective power to GPU demand at given resolution
    """
    # GPU effective score at this resolution (higher res = GPU needs more power)
    gpu_demand = gpu_score * res_weight

    # CPU effective contribution (CPU contributes less at higher resolutions)
    # At 4K, even a mid-range CPU is rarely the bottleneck
    cpu_weight = 1.0 / (res_weight ** 0.3)
    cpu_effective = cpu_score * cpu_weight

    # Ratio: how well CPU keeps up with GPU demand
    ratio = cpu_effective / gpu_demand if gpu_demand > 0 else 1.0

    if ratio < 0.95:
        # CPU can't keep up → CPU bottleneck
        bottleneck_pct = (1.0 - ratio) * 100
        side = "CPU"
    elif ratio > 1.08:
        # CPU is overkill, GPU is the limiter
        bottleneck_pct = (1.0 - (1.0 / ratio)) * 100
        side = "GPU"
    else:
        # Balanced
        bottleneck_pct = abs(1.0 - ratio) * 40
        side = "BALANCED"

    return min(max(bottleneck_pct, 0.0), 95.0), side


def estimate_fps(gpu_score: float, bottleneck_pct: float, res_weight: float) -> int:
    """
    Estimate FPS based on GPU power, resolution, and bottleneck.

    Formula:
      base_fps = (gpu_score / max_gpu_score) * GPU_FPS_BASE / res_weight
      actual_fps = base_fps * (1 - bottleneck_impact)
    """
    max_score = 38000  # RTX 4090 baseline

    # Base FPS from raw GPU power at this resolution
    base_fps = (gpu_score / max_score) * GPU_FPS_BASE / res_weight

    # Bottleneck reduces effective FPS
    # Impact is non-linear: small bottleneck has small impact, large has big impact
    bottleneck_impact = (bottleneck_pct / 100) ** 0.8 * 0.6
    actual_fps = base_fps * (1 - bottleneck_impact)

    # Add some natural variance
    actual_fps *= random.uniform(0.93, 1.07)

    return max(5, int(round(actual_fps)))


def generate_dataset():
    """Generate the full synthetic dataset."""
    os.makedirs(DATA_DIR, exist_ok=True)

    headers = [
        "cpu_name", "cpu_performance_score", "cpu_cores", "cpu_threads",
        "cpu_base_clock", "cpu_boost_clock", "cpu_cache", "cpu_tdp",
        "gpu_name", "gpu_performance_score", "gpu_vram", "gpu_base_clock",
        "gpu_boost_clock", "gpu_tdp", "gpu_memory_bus",
        "resolution", "resolution_weight",
        "cpu_gpu_score_ratio", "total_tdp", "vram_bandwidth",
        # Targets
        "bottleneck_percent", "bottleneck_side", "fps_estimate",
    ]

    rows = []
    for cpu in CPUS:
        for gpu in GPUS:
            for res in RESOLUTIONS:
                res_w = RESOLUTION_WEIGHTS[res]

                # Calculate targets
                bn_pct, bn_side = calculate_bottleneck(cpu["score"], gpu["score"], res_w)

                # Add noise for realism
                bn_pct_noisy = max(0, min(95, bn_pct + random.gauss(0, 2.0)))
                fps = estimate_fps(gpu["score"], bn_pct, res_w)

                # Derived features
                score_ratio = cpu["score"] / gpu["score"] if gpu["score"] > 0 else 1.0
                total_tdp = cpu["tdp"] + gpu["tdp"]
                vram_bw = gpu["vram"] * gpu["bus"]

                row = [
                    cpu["name"], cpu["score"], cpu["cores"], cpu["threads"],
                    cpu["base_clock"], cpu["boost_clock"], cpu["cache"], cpu["tdp"],
                    gpu["name"], gpu["score"], gpu["vram"], gpu["base_clock"],
                    gpu["boost_clock"], gpu["tdp"], gpu["bus"],
                    res, res_w,
                    round(score_ratio, 4), total_tdp, vram_bw,
                    round(bn_pct_noisy, 2), bn_side, fps,
                ]
                rows.append(row)

    # Shuffle for training
    random.shuffle(rows)

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)

    print(f"Generated {len(rows)} samples -> {OUTPUT_FILE}")
    print(f"  CPUs: {len(CPUS)}")
    print(f"  GPUs: {len(GPUS)}")
    print(f"  Resolutions: {len(RESOLUTIONS)}")
    print(f"  Combos: {len(CPUS)} × {len(GPUS)} × {len(RESOLUTIONS)} = {len(rows)}")

    # Print some stats
    bn_pcts = [r[-3] for r in rows]
    fps_vals = [r[-1] for r in rows]
    sides = [r[-2] for r in rows]
    print(f"\n  Bottleneck %: min={min(bn_pcts):.1f}, max={max(bn_pcts):.1f}, avg={sum(bn_pcts)/len(bn_pcts):.1f}")
    print(f"  FPS: min={min(fps_vals)}, max={max(fps_vals)}, avg={sum(fps_vals)/len(fps_vals):.0f}")
    print(f"  Sides: CPU={sides.count('CPU')}, GPU={sides.count('GPU')}, BALANCED={sides.count('BALANCED')}")


if __name__ == "__main__":
    generate_dataset()
