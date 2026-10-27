"""Portfolio Risk — full VaR & stress testing experience inside Decision Studio.

Promotes Varify's risk engine (now in cs_core.risk) into the Decision Studio UI.
Key upgrade over standalone Varify: Gemini explain button using DS's existing AI layer.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st
import yfinance as yf

_PLATFORM_ROOT = Path(__file__).resolve().parents[2]
if str(_PLATFORM_ROOT) not in sys.path:
    sys.path.insert(0, str(_PLATFORM_ROOT))

from cs_core.risk import (
    backtest_var,
    compute_returns,
    distribution_stats,
    historical_var,
    monte_carlo_var,
    parametric_var,
    portfolio_var,
)
from services.ai import PERSONAL_CALL_LIMIT, explain_result, gemini_available


# ── Data helpers ──────────────────────────────────────────────────────────────
@st.cache_data(ttl=3600, show_spinner=False)
def _load_universe(market: str) -> pd.DataFrame:
    data_dir = Path(__file__).parents[1] / "data"
    fname = "nifty500.csv" if market == "India (NSE)" else "sp500.csv"
    path = data_dir / fname
    if path.exists():
        universe = pd.read_csv(path)
        rename_map = {"symbol": "Symbol", "name": "Company Name", "sector": "Industry"}
        return universe.rename(columns={source: target for source, target in rename_map.items() if source in universe.columns})
    return pd.DataFrame(columns=["Symbol", "Company Name", "Industry"])


@st.cache_data(ttl=3600, show_spinner=False)
def _fetch_prices(symbols: tuple[str, ...], market: str, period: str = "2y") -> pd.DataFrame:
    suffix = ".NS" if market == "India (NSE)" else ""
    tickers = [f"{s}{suffix}" for s in symbols]
    raw = yf.download(tickers, period=period, auto_adjust=True, progress=False)
    if raw.empty:
        return pd.DataFrame()
    close = raw["Close"] if "Close" in raw.columns else raw
    if isinstance(close, pd.Series):
        close = close.to_frame(symbols[0])
    close.columns = [c.replace(suffix, "") for c in close.columns]
    return close.dropna(how="all")


CONF_OPTIONS = {"90%": 0.90, "95%": 0.95, "99%": 0.99, "99.9%": 0.999}
METHOD_OPTIONS = ["Parametric", "Historical", "Monte Carlo"]


def portfolio_risk_page() -> None:
    st.markdown(
        '<div class="cs-hero"><span class="cs-kicker">PORTFOLIO RISK</span>'
        '<h2>VaR & Stress Testing</h2></div>',
        unsafe_allow_html=True,
    )
    st.markdown(
        "Estimate tail risk for any Indian or US equity portfolio using three "
        "independent VaR methodologies. The Kupiec POF backtest tells you whether "
        "the chosen model is statistically valid on real history."
    )

    # ── Inputs ────────────────────────────────────────────────────────────────
    with st.form("var_inputs"):
        c1, c2 = st.columns(2)
        with c1:
            market = st.selectbox("Market", ["India (NSE)", "US (S&P 500)"])
        with c2:
            method = st.selectbox("VaR Method", METHOD_OPTIONS)

        universe_df = _load_universe(market)
        if not universe_df.empty:
            symbol_options = universe_df["Symbol"].tolist()
            selected = st.multiselect(
                "Symbols",
                symbol_options,
                default=symbol_options[:3] if len(symbol_options) >= 3 else symbol_options,
                help="Select 1 or more symbols.",
            )
        else:
            raw = st.text_input("Symbols (comma-separated)", "RELIANCE, TCS, INFY")
            selected = [s.strip().upper() for s in raw.split(",") if s.strip()]

        c3, c4 = st.columns(2)
        with c3:
            conf_label = st.selectbox("Confidence level", list(CONF_OPTIONS.keys()), index=1)
        with c4:
            horizon = st.slider("Holding period (days)", 1, 30, 1)

        portfolio_value = st.number_input(
            "Portfolio value (₹ or $)", min_value=10_000, value=10_00_000, step=10_000, format="%d"
        )

        # Weights (only for 2+ stocks)
        weights_input: dict[str, float] = {}
        if len(selected) > 1:
            st.markdown("**Position weights** (must sum to 100%)")
            eq_w = round(100.0 / len(selected), 1)
            total_w = 0.0
            wcols = st.columns(min(len(selected), 4))
            for i, sym in enumerate(selected):
                with wcols[i % 4]:
                    w = st.number_input(f"{sym} %", 0.0, 100.0, eq_w, 0.1, key=f"w_{sym}")
                    weights_input[sym] = w
                    total_w += w
            if abs(total_w - 100.0) > 0.5:
                st.warning(f"Weights sum to {total_w:.1f}% — must be 100%.")

        submitted = st.form_submit_button("Calculate VaR", type="primary", use_container_width=True)

    if not submitted or not selected:
        return

    conf = CONF_OPTIONS[conf_label]

    with st.spinner("Fetching price history…"):
        prices = _fetch_prices(tuple(selected), market)

    if prices.empty:
        st.error("Could not fetch price data. Check your symbols and try again.")
        return

    valid_cols = [c for c in selected if c in prices.columns and prices[c].count() >= 60]
    if not valid_cols:
        st.error("No symbols had enough data (minimum 60 days).")
        return

    prices = prices[valid_cols]
    returns = compute_returns(prices)

    # Normalise weights
    if len(valid_cols) > 1 and weights_input:
        raw_w = np.array([weights_input.get(s, 0.0) for s in valid_cols])
        weights = raw_w / raw_w.sum() if raw_w.sum() > 0 else np.ones(len(valid_cols)) / len(valid_cols)
    else:
        weights = np.ones(len(valid_cols)) / len(valid_cols)

    # ── Run VaR ───────────────────────────────────────────────────────────────
    port_ret = (returns * weights).sum(axis=1)

    try:
        if method == "Parametric":
            result = parametric_var(port_ret, conf, horizon)
        elif method == "Historical":
            result = historical_var(port_ret, conf, horizon)
        else:  # Monte Carlo
            if len(valid_cols) > 1:
                result = monte_carlo_var(returns, conf, horizon, weights=weights)
            else:
                result = monte_carlo_var(port_ret, conf, horizon)
    except Exception as exc:
        st.error(f"VaR calculation failed: {exc}")
        return

    var_pct = result["var_pct"]
    cvar_pct = result["cvar_pct"]
    var_inr = var_pct * portfolio_value
    cvar_inr = cvar_pct * portfolio_value

    # ── Portfolio-level metrics (parametric, for multi-stock) ─────────────────
    pvar_result = {}
    if len(valid_cols) > 1:
        try:
            pvar_result = portfolio_var(returns, weights, conf, horizon)
        except Exception:
            pass

    # ── Key metrics ───────────────────────────────────────────────────────────
    st.divider()
    st.markdown(f"### Results — {method} VaR @ {conf_label} · {horizon}-day horizon")
    m1, m2, m3, m4 = st.columns(4)
    m1.metric(f"VaR ({conf_label})", f"₹{var_inr:,.0f}", f"{var_pct*100:.2f}%")
    m2.metric("CVaR (Expected Shortfall)", f"₹{cvar_inr:,.0f}", f"{cvar_pct*100:.2f}%")
    m3.metric("Annual Volatility", f"{port_ret.std() * (252**0.5) * 100:.1f}%")
    if pvar_result.get("div_benefit_pct"):
        m4.metric("Diversification Benefit", f"₹{pvar_result['div_benefit_pct']*portfolio_value:,.0f}")

    # ── Distribution chart (parametric) ───────────────────────────────────────
    if method == "Parametric" and "mu_h" in result:
        import scipy.stats as scipy_stats
        mu_h, sigma_h, z = result["mu_h"], result["sigma_h"], result["z"]
        x = np.linspace(mu_h - 4 * sigma_h, mu_h + 4 * sigma_h, 400)
        y = scipy_stats.norm.pdf(x, mu_h, sigma_h)
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=x, y=y, mode="lines", name="Return distribution",
                                  line=dict(color="#4C7766", width=2)))
        x_tail = x[x <= -var_pct]
        y_tail = y[x <= -var_pct]
        if len(x_tail):
            fig.add_trace(go.Scatter(
                x=np.concatenate([x_tail, [x_tail[-1], x_tail[0]]]),
                y=np.concatenate([y_tail, [0, 0]]),
                fill="toself", fillcolor="rgba(220,50,50,0.25)",
                line=dict(width=0), name=f"Loss tail ({conf_label})",
            ))
        fig.add_vline(x=-var_pct, line_dash="dash", line_color="#e05252",
                      annotation_text=f"VaR {conf_label}", annotation_position="top right")
        fig.add_vline(x=-cvar_pct, line_dash="dot", line_color="#ff9933",
                      annotation_text="CVaR", annotation_position="top left")
        fig.update_layout(template="plotly_dark", paper_bgcolor="rgba(0,0,0,0)",
                          plot_bgcolor="rgba(0,0,0,0)", height=320,
                          title="Return Distribution with Loss Tail")
        st.plotly_chart(fig, use_container_width=True, config={"displaylogo": False})

    elif method == "Monte Carlo" and "sim" in result:
        sim = result["sim"]
        fig = go.Figure(go.Histogram(
            x=sim, nbinsx=80, name="Simulated returns",
            marker_color="#4C7766", opacity=0.7,
        ))
        fig.add_vline(x=-var_pct, line_dash="dash", line_color="#e05252",
                      annotation_text=f"VaR {conf_label}")
        fig.update_layout(template="plotly_dark", paper_bgcolor="rgba(0,0,0,0)",
                          plot_bgcolor="rgba(0,0,0,0)", height=320,
                          title=f"Monte Carlo Simulation — {len(sim):,} paths")
        st.plotly_chart(fig, use_container_width=True, config={"displaylogo": False})

    # ── Distribution diagnostics ──────────────────────────────────────────────
    with st.expander("Distribution Diagnostics"):
        diag = distribution_stats(port_ret)
        d1, d2, d3 = st.columns(3)
        d1.metric("Skewness", f"{diag['skewness']:.3f}")
        d2.metric("Excess Kurtosis", f"{diag['excess_kurtosis']:.3f}")
        d3.metric(
            "Jarque-Bera normality",
            "✅ Normal" if diag["is_normal"] else "⚠️ Non-normal",
            f"p={diag['jb_pvalue']:.3f}",
        )
        if not diag["is_normal"] and method == "Parametric":
            st.warning(
                "Returns appear non-normal. Parametric VaR may underestimate tail risk. "
                "Consider Historical or Monte Carlo methods."
            )

    # ── Backtest + Kupiec POF ─────────────────────────────────────────────────
    with st.expander("Backtest — Kupiec POF Test"):
        bt = backtest_var(port_ret, var_pct, conf)
        b1, b2, b3, b4 = st.columns(4)
        b1.metric("Total observations", bt["total"])
        b2.metric("VaR breaches", bt["breaches"])
        b3.metric("Observed breach rate", f"{bt['breach_rate']:.1%}")
        b4.metric("Expected breach rate", f"{bt['expected_rate']:.1%}")
        if not np.isnan(bt["pof_pvalue"]):
            if bt["pof_pvalue"] > 0.05:
                st.success(f"Kupiec POF: p = {bt['pof_pvalue']:.3f} — model not rejected at 5% significance ✅")
            else:
                st.error(f"Kupiec POF: p = {bt['pof_pvalue']:.3f} — model rejected at 5% significance ⚠️")

    # ── Gemini explain button ─────────────────────────────────────────────────
    st.divider()
    ai_calls = st.session_state.get("ai_calls", 0)
    if gemini_available() and ai_calls < PERSONAL_CALL_LIMIT:
        if st.button("✨ Explain this VaR result in plain English", use_container_width=True):
            context = {
                "calculator_id": "portfolio_var",
                "outputs": {
                    "method": method,
                    "confidence": conf_label,
                    "horizon_days": horizon,
                    "symbols": valid_cols,
                    "var_pct": round(var_pct * 100, 2),
                    "cvar_pct": round(cvar_pct * 100, 2),
                    "var_inr": round(var_inr, 0),
                    "portfolio_value": portfolio_value,
                    "kupiec_pvalue": round(bt["pof_pvalue"], 3) if not np.isnan(bt.get("pof_pvalue", float("nan"))) else "N/A",
                },
                "warnings": [] if method != "Parametric" or diag["is_normal"] else [
                    "Returns appear non-normal — parametric VaR may underestimate tail risk."
                ],
            }
            with st.spinner("Asking Gemini…"):
                explanation = explain_result(context)
            st.session_state["ai_calls"] = ai_calls + 1
            st.markdown(
                f'<div class="cs-note">{explanation}</div>', unsafe_allow_html=True
            )
    elif not gemini_available():
        st.caption("Configure GEMINI_API_KEY in Streamlit secrets to enable AI explanations.")
    else:
        st.caption(f"AI call limit reached ({PERSONAL_CALL_LIMIT} per session).")

    st.divider()
    st.caption(
        "VaR models have known limitations. They assume historical patterns repeat and "
        "underestimate tail risk during market crises. Always use multiple risk measures."
    )
