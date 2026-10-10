"""Dataset profiling service — collects metadata before sending to Gemini."""

import pandas as pd
import numpy as np
import io
from typing import Any


def profile_dataset(file_bytes: bytes, filename: str) -> dict[str, Any]:
    """
    Profile a dataset and return structured metadata.
    This metadata is sent to Gemini so it doesn't need the full dataset.
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext == "csv":
        df = pd.read_csv(io.BytesIO(file_bytes))
    elif ext in ("xlsx", "xls"):
        df = pd.read_excel(io.BytesIO(file_bytes))
    else:
        raise ValueError(f"Unsupported file format: .{ext}")

    # Drop fully empty rows
    df = df.dropna(how="all")

    if df.empty:
        raise ValueError("The uploaded file contains no data rows.")

    num_cols = df.select_dtypes(include=["number"]).columns.tolist()
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    date_cols = []
    for col in df.columns:
        if df[col].dtype == "object":
            try:
                pd.to_datetime(df[col].dropna().head(20))
                date_cols.append(col)
            except (ValueError, TypeError):
                pass

    # Missing data
    missing_counts = df.isnull().sum()
    missing_pct = ((missing_counts / len(df)) * 100).round(2)
    missing_info = {
        col: {"count": int(missing_counts[col]), "percent": float(missing_pct[col])}
        for col in df.columns
        if missing_counts[col] > 0
    }

    # Duplicate rows
    dup_count = int(df.duplicated().sum())

    # Numerical summary
    numerical_summary = {}
    if num_cols:
        desc = df[num_cols].describe().round(3)
        for col in num_cols:
            numerical_summary[col] = {
                "mean": _safe_float(desc.at["mean", col]),
                "std": _safe_float(desc.at["std", col]),
                "min": _safe_float(desc.at["min", col]),
                "max": _safe_float(desc.at["max", col]),
                "median": _safe_float(df[col].median()),
            }

    # Categorical summary
    categorical_summary = {}
    for col in cat_cols:
        if col not in date_cols:
            vc = df[col].value_counts().head(5)
            categorical_summary[col] = {
                "unique_count": int(df[col].nunique()),
                "top_values": {str(k): int(v) for k, v in vc.items()},
            }

    # Column metadata
    column_metadata = []
    for col in df.columns:
        column_metadata.append({
            "name": col,
            "dtype": str(df[col].dtype),
            "non_null_count": int(df[col].count()),
            "null_count": int(df[col].isnull().sum()),
        })

    # Data quality warnings
    warnings = []
    if dup_count > 0:
        warnings.append(f"{dup_count} duplicate rows detected ({round(dup_count/len(df)*100, 1)}%)")
    high_missing = [col for col, info in missing_info.items() if info["percent"] > 30]
    if high_missing:
        warnings.append(f"High missing data (>30%) in: {', '.join(high_missing)}")
    if len(df) < 10:
        warnings.append("Very small dataset — results may not be statistically meaningful.")

    # Sample data (first 3 rows, sanitized)
    sample_records = df.head(3).fillna("").to_dict(orient="records")
    # Convert numpy types to native Python types
    sample_records = _sanitize_records(sample_records)

    profile = {
        "row_count": len(df),
        "col_count": len(df.columns),
        "columns": column_metadata,
        "numeric_columns": num_cols,
        "categorical_columns": cat_cols,
        "date_columns": date_cols,
        "missing_data": missing_info,
        "duplicate_rows": dup_count,
        "numerical_summary": numerical_summary,
        "categorical_summary": categorical_summary,
        "warnings": warnings,
        "sample_data": sample_records,
    }

    return profile


def _safe_float(val) -> float | None:
    """Convert numpy/pandas numeric to Python float, handling NaN/Inf."""
    if val is None or (isinstance(val, float) and (np.isnan(val) or np.isinf(val))):
        return None
    try:
        return round(float(val), 4)
    except (ValueError, TypeError):
        return None


def _sanitize_records(records: list[dict]) -> list[dict]:
    """Convert numpy types in records to native Python types."""
    sanitized = []
    for row in records:
        clean = {}
        for k, v in row.items():
            if isinstance(v, (np.integer,)):
                clean[k] = int(v)
            elif isinstance(v, (np.floating,)):
                clean[k] = float(v) if not np.isnan(v) else None
            elif isinstance(v, np.bool_):
                clean[k] = bool(v)
            else:
                clean[k] = v
            clean[k] = str(clean[k]) if clean[k] is not None else ""
        sanitized.append(clean)
    return sanitized

