"""MF Analysis — mutual fund benchmarking inside Decision Studio.

Promotes mf-benchmarking into the Decision Studio UI.
Key upgrade over standalone: Gemini AI insight using DS's existing explain_result().
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

_PLATFORM_ROOT = Path(__file__).resolve().parents[2]
if str(_PLATFORM_ROOT) not in sys.path:
    sys.path.insert(0, str(_PLATFORM_ROOT))

from cs_core.mf_metrics import (
    calculate_risk_metrics,
    calculate_rolling_returns,
    calculate_trailing_returns,
    run_rolling_style_drift,
)
from services.ai import PERSONAL_CALL_LIMIT, explain_result, gemini_available
from services.mf_data import (
    CATEGORY_RULES,
    classify_category,
    fetch_benchmark_series,
    fetch_scheme_history,
    search_schemes,
)

STYLE_FACTORS = {
    "Large Cap": "^NSEI",
    "Mid Cap": "^NSEMDCP50",
    "Small Cap": "HDFCSML250.NS",
}
DEFAULT_RFR = 0.065


def _fmt_pct(v) -> str:
    if isinstance(v, pd.Series):
        v = v.iloc[-1] if not v.empty else None
    if v is None or (isinstance(v, float) and np.isnan(v)):
        return "—"
    return f"{v*100:.2f}%"


def _fmt_float(v, decimals=2) -> str:
    if v is None or (isinstance(v, float) and np.isnan(v)):
        return "—"
    return f"{v:.{decimals}f}"


def mf_analysis_page() -> None:
    st.markdown(
        '<div class="cs-hero"><span class="cs-kicker">MF ANALYSIS</span>'
        '<h2>Mutual Fund Benchmark & Style</h2></div>',
        unsafe_allow_html=True,
    )
    st.markdown(
        "Search any Indian mutual fund, compare it against its benchmark, "
        "and inspect style drift over time. The Gemini insight button answers "
        "the key question: *is this fund delivering genuine alpha, or just riding the market?*"
    )

    # ── Scheme search ─────────────────────────────────────────────────────────
    query = st.text_input("Search fund name", placeholder="e.g. SBI Bluechip, HDFC Mid-Cap")
    if not query or len(query) < 3:
        st.info("Type at least 3 characters to search.", icon="🔍")
        return

    with st.spinner("Searching AMFI scheme list…"):
        results = search_schemes(query)

    if not results:
        st.warning("No schemes found. Try a different search term.")
        return

    options = {f"{r['schemeName']} ({r['schemeCode']})": r["schemeCode"] for r in results}
    chosen_label = st.selectbox("Select fund", list(options.keys()))
    scheme_code = options[chosen_label]

    # ── Parameters ────────────────────────────────────────────────────────────
    c1, c2 = st.columns(2)
    with c1:
        rfr = st.slider("Risk-free rate (%)", 0.0, 15.0, DEFAULT_RFR * 100, 0.25) / 100
    with c2:
        lookback_years = st.slider("Lookback (years)", 1, 10, 5)

    # ── Fetch NAV ─────────────────────────────────────────────────────────────
    with st.spinner("Fetching NAV history…"):
        meta, nav = fetch_scheme_history(scheme_code)

    if nav is None or nav.empty:
        st.error("Could not fetch NAV history for this fund.")
        return

    start_cutoff = pd.Timestamp.today() - pd.DateOffset(years=lookback_years)
    nav = nav[nav.index >= start_cutoff]
    if nav.empty:
        st.error(f"No NAV data available for the past {lookback_years} years.")
        return

    fund_name = meta.get("scheme_name", chosen_label) if meta else chosen_label
    category_str = meta.get("scheme_category", "") if meta else ""
    scheme_type = meta.get("scheme_type", "") if meta else ""

    auto_category, auto_bench_ticker = classify_category(category_str)

    st.markdown(f"**{fund_name}**")
    st.caption(f"Category: {category_str or '—'} · Type: {scheme_type or '—'}")

    # User can override benchmark
    bench_options = ["Auto: " + (auto_bench_ticker or "None")] + [
        f"{label} ({ticker})" for label, ticker in STYLE_FACTORS.items()
    ] + ["None (no benchmark)"]
    bench_choice = st.selectbox("Benchmark", bench_options)
    if bench_choice.startswith("Auto"):
        bench_ticker = auto_bench_ticker
    elif bench_choice == "None (no benchmark)":
        bench_ticker = None
    else:
        bench_ticker = bench_choice.split("(")[-1].rstrip(")")

    with st.spinner("Fetching benchmark…"):
        bench = fetch_benchmark_series(bench_ticker) if bench_ticker else None

    if bench is not None:
        bench = bench[bench.index >= start_cutoff]

    # ── Trailing returns ───────────────────────────────────────────────────────
    st.divider()
    st.markdown("### Trailing Returns")
    trail = calculate_trailing_returns(nav)
    bench_trail = calculate_trailing_returns(bench) if bench is not None and not bench.empty else {}

    trail_data = []
    for period, _, _ in [("1M", 30, False), ("3M", 91, False), ("6M", 182, False),
                          ("1Y", 365, True), ("3Y", 3*365, True), ("5Y", 5*365, True)]:
        row = {"Period": period, "Fund": _fmt_pct(trail.get(period)), "Benchmark": _fmt_pct(bench_trail.get(period))}
        trail_data.append(row)
    st.dataframe(pd.DataFrame(trail_data), use_container_width=True, hide_index=True)

    # ── Risk metrics ───────────────────────────────────────────────────────────
    st.markdown("### Risk Metrics")
    risk = calculate_risk_metrics(nav, bench, rfr)
    r1, r2, r3, r4 = st.columns(4)
    r1.metric("Sharpe Ratio", _fmt_float(risk.get("sharpe_ratio")))
    r2.metric("Max Drawdown", _fmt_pct(risk.get("max_drawdown")))
    r3.metric("Annual Volatility", _fmt_pct(risk.get("annualized_volatility")))
    r4.metric("Annualised Return", _fmt_pct(risk.get("annualized_return")))

    if bench is not None:
        r5, r6, r7, r8 = st.columns(4)
        r5.metric("Alpha", _fmt_pct(risk.get("alpha")))
        r6.metric("Beta", _fmt_float(risk.get("beta")))
        r7.metric("Tracking Error", _fmt_pct(risk.get("tracking_error")))
        r8.metric("Information Ratio", _fmt_float(risk.get("information_ratio")))

    # ── Rolling 1Y returns chart ───────────────────────────────────────────────
    st.markdown("### Rolling 1-Year Returns")
    rolling_fund = calculate_rolling_returns(nav, 365).dropna()
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=rolling_fund.index, y=rolling_fund.values,
        name="Fund", line=dict(color="#4C7766", width=2),
    ))
    if bench is not None and not bench.empty:
        rolling_bench = calculate_rolling_returns(bench, 365).dropna()
        fig.add_trace(go.Scatter(
            x=rolling_bench.index, y=rolling_bench.values,
            name="Benchmark", line=dict(color="#6c8ebf", width=1.5, dash="dash"),
        ))
    fig.add_hline(y=0, line_color="gray", line_dash="dot")
    fig.update_layout(
        template="plotly_dark", paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)", height=340,
        yaxis_tickformat=".0%",
        legend=dict(orientation="h", y=-0.15),
    )
    st.plotly_chart(fig, use_container_width=True, config={"displaylogo": False})

    # ── Style drift ────────────────────────────────────────────────────────────
    st.markdown("### Style Drift (Rolling 1-Year RBSA)")
    try:
        factor_tickers = list(STYLE_FACTORS.values())
        factor_series = {}
        for ft in factor_tickers:
            fs = fetch_benchmark_series(ft)
            if fs is not None and not fs.empty:
                factor_series[ft] = fs[fs.index >= start_cutoff]

        if len(factor_series) == 3:
            factors_df = pd.DataFrame(factor_series)
            factors_df.columns = list(STYLE_FACTORS.keys())
            drift = run_rolling_style_drift(nav, factors_df)
            if drift:
                drift_df = pd.DataFrame(drift).set_index("Date")
                fig2 = go.Figure()
                colors = {"Large Cap": "#4C7766", "Mid Cap": "#6c8ebf", "Small Cap": "#e08050"}
                for col in ["Large Cap", "Mid Cap", "Small Cap"]:
                    fig2.add_trace(go.Scatter(
                        x=drift_df.index, y=drift_df[col],
                        name=col, stackgroup="one",
                        line=dict(color=colors[col]),
                    ))
                fig2.update_layout(
                    template="plotly_dark", paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)", height=300,
                    yaxis_tickformat=".0%",
                    legend=dict(orientation="h", y=-0.15),
                )
                st.plotly_chart(fig2, use_container_width=True, config={"displaylogo": False})
            else:
                st.info("Insufficient history for style drift analysis.")
        else:
            st.info("Could not fetch all style factors for drift analysis.")
    except Exception as exc:
        st.warning(f"Style drift analysis failed: {exc}")

    # ── Gemini insight ─────────────────────────────────────────────────────────
    st.divider()
    ai_calls = st.session_state.get("ai_calls", 0)
    if gemini_available() and ai_calls < PERSONAL_CALL_LIMIT:
        if st.button("✨ Is this fund delivering alpha or just market beta?", use_container_width=True):
            context = {
                "calculator_id": "mf_analysis",
                "outputs": {
                    "fund_name": fund_name,
                    "category": category_str,
                    "sharpe_ratio": _fmt_float(risk.get("sharpe_ratio")),
                    "alpha": _fmt_pct(risk.get("alpha")),
                    "beta": _fmt_float(risk.get("beta")),
                    "max_drawdown": _fmt_pct(risk.get("max_drawdown")),
                    "information_ratio": _fmt_float(risk.get("information_ratio")),
                    "trailing_1y": _fmt_pct(trail.get("1Y")),
                    "trailing_3y": _fmt_pct(trail.get("3Y")),
                    "benchmark_used": bench_ticker or "None",
                },
                "warnings": [],
            }
            with st.spinner("Asking Gemini…"):
                insight = explain_result(context)
            st.session_state["ai_calls"] = ai_calls + 1
            st.markdown(f'<div class="cs-note">{insight}</div>', unsafe_allow_html=True)
    elif not gemini_available():
        st.caption("Configure GEMINI_API_KEY in Streamlit secrets to enable AI insights.")
    else:
        st.caption(f"AI call limit reached ({PERSONAL_CALL_LIMIT} per session).")

    st.divider()
    st.caption(
        "NAV data sourced from AMFI via mfapi.in. Benchmark prices from Yahoo Finance. "
        "For educational purposes only. Not investment advice."
    )
