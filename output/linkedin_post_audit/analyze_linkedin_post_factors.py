from __future__ import annotations

import json
import math
import re
from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path("/Users/rafaelalmeida/lifetrek")
OUT = ROOT / "output/linkedin_post_audit"
INPUT = OUT / "linkedin_post_content_audit_2026-05-01.csv"


def safe_float(value):
    if pd.isna(value) or value == "":
        return np.nan
    try:
        return float(value)
    except Exception:
        return np.nan


def post_format_simple(value: str) -> str:
    text = str(value or "").lower()
    if "video" in text:
        return "Video"
    if "carousel" in text or "multi-image" in text:
        return "Carousel"
    if "image" in text:
        return "Image"
    return "Text/Unknown"


def topic_group(value: str) -> str:
    text = str(value or "").lower()
    if "capacity" in text or "integrated oem" in text:
        return "Operations / Capacity"
    if "metrology" in text or "dimensional" in text or "zeiss" in text:
        return "Metrology / Validation"
    if "cleanroom" in text or "contamination" in text:
        return "Cleanroom"
    if "supply" in text or "local manufacturing" in text:
        return "Supply Chain"
    if "prototype" in text or "industrialization" in text or "dfm" in text:
        return "Prototype / DFM"
    if "quality" in text:
        return "Quality"
    if "talent" in text or "institutional" in text:
        return "Institutional / Recruiting"
    if "port-a-cath" in text or "personalized" in text or "spine" in text or "fixation" in text:
        return "Specialized Product"
    return "Other"


def word_count(text: str) -> int:
    return len(re.findall(r"\w+", str(text or ""), flags=re.UNICODE))


def is_outlier_post(row: pd.Series) -> bool:
    hook = str(row.get("hook", "") or "").lower()
    date = str(row.get("date", "") or "")
    return (
        "rafael bianchini rafael bianchini" in hook
        or "vaga de emprego na lifetrek medical" in hook
        or "nosso site está no ar" in hook
        or "nosso site esta no ar" in hook
        or (date.startswith("2025-11-26") and "vagas empresa" in str(row.get("full_caption", "") or "").lower())
    )


def one_dimensional_kmeans(values: np.ndarray, k: int = 3, max_iter: int = 100):
    values = values.astype(float)
    centers = np.quantile(values, np.linspace(0.15, 0.85, k))
    labels = np.zeros(len(values), dtype=int)
    for _ in range(max_iter):
        distances = np.abs(values[:, None] - centers[None, :])
        new_labels = np.argmin(distances, axis=1)
        new_centers = centers.copy()
        for idx in range(k):
            if np.any(new_labels == idx):
                new_centers[idx] = values[new_labels == idx].mean()
        if np.array_equal(new_labels, labels) and np.allclose(new_centers, centers):
            break
        labels = new_labels
        centers = new_centers

    order = np.argsort(centers)
    rank_by_original = {orig: rank for rank, orig in enumerate(order)}
    ranked_labels = np.array([rank_by_original[label] for label in labels])
    ranked_centers = centers[order]
    names = ["Low impressions", "Mid impressions", "High impressions"]
    return [names[i] for i in ranked_labels], ranked_centers


def simple_trend(df: pd.DataFrame, target: str):
    x = df["days_since_start"].to_numpy(dtype=float)
    y = df[target].to_numpy(dtype=float)
    X = np.column_stack([np.ones(len(x)), x])
    coef = np.linalg.pinv(X.T @ X) @ X.T @ y
    pred = X @ coef
    sst = float(np.sum((y - y.mean()) ** 2))
    sse = float(np.sum((y - pred) ** 2))
    r2 = 1 - sse / sst if sst else 0.0
    return {
        "target": target,
        "n": len(df),
        "slope_per_day": coef[1],
        "slope_per_week": coef[1] * 7,
        "intercept": coef[0],
        "r2": r2,
        "first_date": str(df["date"].min().date()),
        "last_date": str(df["date"].max().date()),
    }


def design_matrix(df: pd.DataFrame, include_impressions: bool = False):
    out = pd.DataFrame(index=df.index)
    out["days_since_start"] = df["days_since_start"]
    out["caption_word_count"] = df["caption_word_count"]
    out["hook_length_chars"] = df["hook_length_chars"]
    out["is_carousel"] = (df["post_format_clean"] == "Carousel").astype(int)
    out["hook_is_question"] = (df["hook_category"] == "Question").astype(int)
    for value in ["Problem-aware", "Product-aware", "Solution-aware"]:
        out[f"awareness_{value}"] = (df["awareness_stage"] == value).astype(int)
    for value in [
        "Metrology / Validation",
        "Operations / Capacity",
        "Institutional / Recruiting",
    ]:
        out[f"topic_{value}"] = (df["topic_group"] == value).astype(int)
    if include_impressions:
        out["impressions"] = df["impressions"]
    keep = [col for col in out.columns if out[col].std(ddof=0) > 0]
    return out[keep]


def fit_ols(df: pd.DataFrame, target: str, model_name: str, include_impressions: bool = False):
    X_raw = design_matrix(df, include_impressions=include_impressions)
    y_raw = df[target].astype(float)
    valid = ~(X_raw.isna().any(axis=1) | y_raw.isna())
    X_raw = X_raw.loc[valid]
    y_raw = y_raw.loc[valid]
    n = len(y_raw)
    if n < 5:
        raise ValueError(f"Not enough rows for {model_name}")

    X = X_raw.to_numpy(dtype=float)
    y = y_raw.to_numpy(dtype=float)
    X_with_intercept = np.column_stack([np.ones(n), X])
    beta_raw = np.linalg.pinv(X_with_intercept.T @ X_with_intercept) @ X_with_intercept.T @ y
    y_pred = X_with_intercept @ beta_raw
    sst = float(np.sum((y - y.mean()) ** 2))
    sse = float(np.sum((y - y_pred) ** 2))
    p = X.shape[1]
    r2 = 1 - sse / sst if sst else 0.0
    adj_r2 = 1 - (1 - r2) * (n - 1) / (n - p - 1) if n - p - 1 > 0 else np.nan

    x_mean = X.mean(axis=0)
    x_std = X.std(axis=0, ddof=0)
    y_mean = y.mean()
    y_std = y.std(ddof=0)
    X_std = (X - x_mean) / x_std
    y_std_vec = (y - y_mean) / y_std if y_std else y * 0
    beta_std = np.linalg.pinv(X_std.T @ X_std) @ X_std.T @ y_std_vec

    loo_errors = []
    for i in range(n):
        train_mask = np.ones(n, dtype=bool)
        train_mask[i] = False
        X_train = X[train_mask]
        y_train = y[train_mask]
        train_mean = X_train.mean(axis=0)
        train_std = X_train.std(axis=0, ddof=0)
        train_std[train_std == 0] = 1
        X_train_std = (X_train - train_mean) / train_std
        X_test_std = (X[i : i + 1] - train_mean) / train_std
        X_train_i = np.column_stack([np.ones(len(X_train_std)), X_train_std])
        coef_i = np.linalg.pinv(X_train_i.T @ X_train_i) @ X_train_i.T @ y_train
        pred_i = np.column_stack([np.ones(1), X_test_std]) @ coef_i
        loo_errors.append(float(y[i] - pred_i[0]))
    loocv_rmse = math.sqrt(float(np.mean(np.square(loo_errors))))

    coef_rows = []
    for feature, raw_coef, std_coef in zip(X_raw.columns, beta_raw[1:], beta_std):
        coef_rows.append(
            {
                "model": model_name,
                "target": target,
                "feature": feature,
                "standardized_beta": std_coef,
                "abs_standardized_beta": abs(std_coef),
                "raw_coefficient": raw_coef,
                "direction": "positive" if std_coef > 0 else "negative",
            }
        )

    metrics = {
        "model": model_name,
        "target": target,
        "n": n,
        "predictor_count": p,
        "r2_in_sample": r2,
        "adjusted_r2": adj_r2,
        "loocv_rmse": loocv_rmse,
    }
    return metrics, coef_rows


def pct(series: pd.Series) -> float:
    if len(series) == 0:
        return 0.0
    return float(series.mean())


def main():
    df = pd.read_csv(INPUT)
    df["date"] = pd.to_datetime(df["date"])
    df["impressions"] = df["impressions_current"].apply(safe_float)
    df["reactions"] = df["reactions_current"].apply(safe_float)
    df["clicks_export"] = df["clicks_export"].apply(safe_float)
    df["ctr_export_pct"] = df["ctr_export_pct"].apply(safe_float)
    df["reposts_current"] = df["reposts_current"].apply(safe_float)
    df["video_views_current"] = df["video_views_current"].apply(safe_float)
    df["impressions_export"] = df["impressions_export"].apply(safe_float)
    df["reactions_export"] = df["reactions_export"].apply(safe_float)
    df["post_format_clean"] = df["post_format"].map(post_format_simple)
    df["topic_group"] = df["topic_category"].map(topic_group)
    df["caption_word_count"] = df["full_caption"].map(word_count)
    df["hook_length_chars"] = df["hook"].astype(str).str.len()
    df["excluded_from_model"] = df.apply(is_outlier_post, axis=1)
    excluded = df[df["excluded_from_model"]].copy()
    excluded_out = excluded[["date", "hook", "topic_category", "impressions", "reactions"]].copy()
    excluded_out["exclusion_reason"] = "Launch/recruiting/non-comparable outlier removed from model."
    excluded_out["date"] = excluded_out["date"].dt.strftime("%Y-%m-%d")
    excluded_out.to_csv(OUT / "linkedin_modeling_excluded_outliers_2026-05-01.csv", index=False)

    analysis_df = df[~df["excluded_from_model"]].copy()
    first = analysis_df["date"].min()
    analysis_df["days_since_start"] = (analysis_df["date"] - first).dt.days
    df["month"] = df["date"].dt.to_period("M").astype(str)
    analysis_df["month"] = analysis_df["date"].dt.to_period("M").astype(str)
    analysis_df["is_carousel"] = (analysis_df["post_format_clean"] == "Carousel").astype(int)
    analysis_df["is_video"] = (analysis_df["post_format_clean"] == "Video").astype(int)
    analysis_df["hook_is_question"] = (analysis_df["hook_category"] == "Question").astype(int)

    model_df = analysis_df.dropna(subset=["impressions", "reactions"]).copy()
    cluster_labels, centers = one_dimensional_kmeans(model_df["impressions"].to_numpy(), 3)
    model_df["impression_cluster"] = cluster_labels
    cluster_map = model_df["impression_cluster"]
    analysis_df.loc[model_df.index, "impression_cluster"] = cluster_map
    analysis_df["impression_cluster"] = analysis_df["impression_cluster"].fillna("No current impressions")

    clean_cols = [
        "date",
        "days_since_start",
        "month",
        "post_format_clean",
        "hook",
        "hook_category",
        "awareness_stage",
        "topic_category",
        "topic_group",
        "impression_cluster",
        "impressions",
        "reactions",
        "clicks_export",
        "ctr_export_pct",
        "reposts_current",
        "video_views_current",
        "impressions_export",
        "reactions_export",
        "caption_word_count",
        "hook_length_chars",
        "is_carousel",
        "is_video",
        "hook_is_question",
    ]
    clean = analysis_df[clean_cols].copy()
    clean["date"] = clean["date"].dt.strftime("%Y-%m-%d")
    clean.to_csv(OUT / "linkedin_post_modeling_clean_2026-05-01.csv", index=False)

    cluster_rows = []
    for cluster, group in model_df.groupby("impression_cluster"):
        cluster_rows.append(
            {
                "impression_cluster": cluster,
                "posts": len(group),
                "impressions_min": group["impressions"].min(),
                "impressions_max": group["impressions"].max(),
                "avg_impressions": group["impressions"].mean(),
                "median_impressions": group["impressions"].median(),
                "avg_reactions": group["reactions"].mean(),
                "avg_ctr_export_pct": group["ctr_export_pct"].mean(),
                "avg_caption_word_count": group["caption_word_count"].mean(),
                "share_carousel": group["is_carousel"].mean(),
                "share_video": group["is_video"].mean(),
                "share_question_hook": group["hook_is_question"].mean(),
                "top_awareness_stage": group["awareness_stage"].mode().iloc[0],
                "top_topic_group": group["topic_group"].mode().iloc[0],
                "sample_hooks": " | ".join(group.sort_values("impressions", ascending=False)["hook"].head(3).tolist()),
            }
        )
    cluster_summary = pd.DataFrame(cluster_rows)
    cluster_order = {"Low impressions": 0, "Mid impressions": 1, "High impressions": 2}
    cluster_summary = cluster_summary.sort_values("impression_cluster", key=lambda s: s.map(cluster_order))
    cluster_summary.to_csv(OUT / "linkedin_impression_cluster_summary_2026-05-01.csv", index=False)

    high = model_df[model_df["impression_cluster"] == "High impressions"].copy()
    rest = model_df[model_df["impression_cluster"] != "High impressions"].copy()
    driver_rows = []
    for col in ["post_format_clean", "hook_category", "awareness_stage", "topic_group"]:
        for value in sorted(model_df[col].dropna().unique()):
            top_share = float((high[col] == value).mean()) if len(high) else 0.0
            rest_share = float((rest[col] == value).mean()) if len(rest) else 0.0
            driver_rows.append(
                {
                    "feature": col,
                    "value": value,
                    "high_cluster_share": top_share,
                    "rest_share": rest_share,
                    "share_lift_points": top_share - rest_share,
                    "top_cluster_posts": int((high[col] == value).sum()),
                    "rest_posts": int((rest[col] == value).sum()),
                }
            )
    for col in ["days_since_start", "caption_word_count", "hook_length_chars", "ctr_export_pct", "clicks_export"]:
        driver_rows.append(
            {
                "feature": col,
                "value": "mean",
                "high_cluster_share": float(high[col].mean()),
                "rest_share": float(rest[col].mean()),
                "share_lift_points": float(high[col].mean() - rest[col].mean()),
                "top_cluster_posts": len(high),
                "rest_posts": len(rest),
            }
        )
    pd.DataFrame(driver_rows).sort_values("share_lift_points", ascending=False).to_csv(
        OUT / "linkedin_top_cluster_driver_lifts_2026-05-01.csv", index=False
    )

    model_df["week_start"] = model_df["date"].dt.to_period("W-MON").dt.start_time
    weekly = (
        model_df.groupby("week_start")
        .agg(
            posts=("hook", "count"),
            total_impressions=("impressions", "sum"),
            avg_impressions=("impressions", "mean"),
            total_reactions=("reactions", "sum"),
            avg_reactions=("reactions", "mean"),
        )
        .reset_index()
    )
    weekly["week_start"] = weekly["week_start"].dt.strftime("%Y-%m-%d")
    weekly.to_csv(OUT / "linkedin_weekly_growth_2026-05-01.csv", index=False)

    trend_rows = [
        simple_trend(model_df, "impressions"),
        simple_trend(model_df, "reactions"),
    ]
    pd.DataFrame(trend_rows).to_csv(OUT / "linkedin_growth_trend_models_2026-05-01.csv", index=False)

    metrics = []
    coefs = []
    for target, model_name, include_impressions in [
        ("impressions", "impressions_content_time", False),
        ("reactions", "reactions_content_time", False),
        ("reactions", "reactions_with_impressions_exposure", True),
    ]:
        model_metrics, model_coefs = fit_ols(model_df, target, model_name, include_impressions=include_impressions)
        metrics.append(model_metrics)
        coefs.extend(model_coefs)
    coef_df = pd.DataFrame(coefs).sort_values(["model", "abs_standardized_beta"], ascending=[True, False])
    metric_df = pd.DataFrame(metrics)
    coef_df.to_csv(OUT / "linkedin_regression_coefficients_2026-05-01.csv", index=False)
    metric_df.to_csv(OUT / "linkedin_regression_model_metrics_2026-05-01.csv", index=False)

    top_posts = model_df.sort_values("impressions", ascending=False).head(10)[
        [
            "date",
            "hook",
            "impressions",
            "reactions",
            "post_format_clean",
            "hook_category",
            "awareness_stage",
            "topic_group",
            "caption_word_count",
            "ctr_export_pct",
        ]
    ].copy()
    top_posts["date"] = top_posts["date"].dt.strftime("%Y-%m-%d")
    top_posts.to_csv(OUT / "linkedin_top_posts_by_impressions_2026-05-01.csv", index=False)

    summary = {
        "posts_in_model": int(len(model_df)),
        "posts_excluded_as_outliers": int(len(excluded)),
        "posts_without_current_impressions": int(analysis_df["impressions"].isna().sum()),
        "impression_cluster_centers": {
            "Low impressions": float(centers[0]),
            "Mid impressions": float(centers[1]),
            "High impressions": float(centers[2]),
        },
        "top_cluster_size": int(len(high)),
        "top_cluster_avg_impressions": float(high["impressions"].mean()),
        "top_cluster_avg_reactions": float(high["reactions"].mean()),
        "trend_models": trend_rows,
        "regression_metrics": metric_df.to_dict(orient="records"),
        "top_impression_regression_factors": coef_df[coef_df["model"] == "impressions_content_time"]
        .head(8)
        .to_dict(orient="records"),
        "top_reaction_regression_factors": coef_df[coef_df["model"] == "reactions_content_time"]
        .head(8)
        .to_dict(orient="records"),
    }
    (OUT / "linkedin_modeling_summary_2026-05-01.json").write_text(json.dumps(summary, indent=2, default=str), encoding="utf-8")


if __name__ == "__main__":
    main()
