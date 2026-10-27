"""Decision Studio MF data adapter.

Re-homes mf-benchmarking/mf_bench/data.py into Decision Studio's service layer.
@st.cache_data decorators preserved — Streamlit caching works fine inside services.
Config constants inlined — no dependency on mf_bench/config.py.
"""

import time

import pandas as pd
import requests
import streamlit as st
import yfinance as yf

# ── Category classification rules ────────────────────────────────────────────
# (keyword, display_label, benchmark_yf_ticker)
CATEGORY_RULES = [
    ("Small Cap", "Small Cap", "HDFCSML250.NS"),
    ("Mid Cap", "Mid Cap", "^NSEMDCP50"),
    ("Large & Mid Cap", "Large & Mid Cap", "^CRSLDX"),
    ("Large Cap", "Large Cap", "^NSEI"),
    ("Flexi Cap", "Flexi Cap", "^CRSLDX"),
    ("Multi Cap", "Multi Cap", "^CRSLDX"),
    ("ELSS", "ELSS", "^CRSLDX"),
    ("Focused", "Focused", "^CRSLDX"),
    ("Value", "Value", "^CRSLDX"),
    ("Contra", "Contra", "^CRSLDX"),
    ("Dividend Yield", "Dividend Yield", "^CRSLDX"),
    ("Sectoral", "Sectoral/Thematic", "^NSEI"),
    ("Thematic", "Sectoral/Thematic", "^NSEI"),
    ("Index Fund", "Index Fund", "^NSEI"),
    ("Debt", "Debt", None),
    ("Hybrid", "Hybrid", "^NSEI"),
]

SCHEME_LIST_CACHE_TTL = 86_400   # 24 h
NAV_HISTORY_CACHE_TTL = 86_400
BENCHMARK_CACHE_TTL   = 86_400


def _get_with_retry(url: str, retries: int = 3):
    delay = 1
    for attempt in range(retries):
        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.RequestException as exc:
            if attempt == retries - 1:
                raise exc
            time.sleep(delay)
            delay *= 2
    return None


@st.cache_data(ttl=SCHEME_LIST_CACHE_TTL, show_spinner=False)
def search_schemes(query: str) -> list[dict]:
    """Search AMFI scheme list. Returns [] for queries shorter than 3 chars."""
    if len(query) < 3:
        return []
    url = f"https://api.mfapi.in/mf/search?q={query}"
    try:
        data = _get_with_retry(url)
        return data if data else []
    except Exception:
        return []


@st.cache_data(ttl=NAV_HISTORY_CACHE_TTL, show_spinner=False)
def fetch_scheme_history(scheme_code: str) -> tuple[dict | None, pd.Series | None]:
    """Fetch full NAV history for a scheme code from mfapi.in.

    Returns: (meta_dict, nav_series indexed by date) or (None, None) on failure.
    """
    url = f"https://api.mfapi.in/mf/{scheme_code}"
    try:
        data = _get_with_retry(url)
        if not data or "data" not in data:
            return None, None
        meta = data.get("meta", {})
        df = pd.DataFrame(data["data"])
        if df.empty:
            return meta, pd.Series(dtype=float)
        df["date"] = pd.to_datetime(df["date"], format="%d-%m-%Y", errors="coerce")
        df["nav"] = pd.to_numeric(df["nav"], errors="coerce")
        df = df.dropna(subset=["date", "nav"]).sort_values("date")
        df.set_index("date", inplace=True)
        return meta, df["nav"]
    except Exception as exc:
        st.warning(f"Failed to fetch NAV history for scheme {scheme_code}: {exc}")
        return None, None


@st.cache_data(ttl=BENCHMARK_CACHE_TTL, show_spinner=False)
def fetch_benchmark_series(ticker: str | None) -> pd.Series | None:
    """Download full benchmark price history from Yahoo Finance."""
    if not ticker:
        return None
    delay = 1
    for attempt in range(3):
        try:
            data = yf.download(ticker, period="max", progress=False, auto_adjust=True)
            if not data.empty and "Close" in data.columns:
                close = data["Close"]
                if isinstance(close, pd.DataFrame):
                    close = close.squeeze("columns")
                return close if isinstance(close, pd.Series) else None
            return None
        except Exception:
            if attempt == 2:
                return None
            time.sleep(delay)
            delay *= 2
    return None


def classify_category(category_string: str) -> tuple[str, str | None]:
    """Map a fund's category string to a display label and benchmark ticker."""
    if not category_string:
        return "Other", None
    for keyword, label, ticker in CATEGORY_RULES:
        if keyword in category_string:
            return label, ticker
    return "Other", None
