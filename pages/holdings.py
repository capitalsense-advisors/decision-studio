"""Validated, session-only Indian equity holdings workflow."""

from __future__ import annotations

from datetime import date

import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st

from core.contracts import CalculationRequest
from core.engines import calculate_portfolio_risk, calculate_returns
from services.documents import parse_holdings_csv
from services.market_data import fetch_price_history

REQUIRED_COLUMNS = ["symbol", "quantity", "average_cost", "current_price", "value"]
SAMPLE_HOLDINGS = [
    {"symbol": "RELIANCE", "quantity": 20.0, "average_cost": 2400.0, "current_price": 2900.0, "value": 58000.0},
    {"symbol": "HDFCBANK", "quantity": 40.0, "average_cost": 1500.0, "current_price": 1700.0, "value": 68000.0},
    {"symbol": "INFY", "quantity": 30.0, "average_cost": 1350.0, "current_price": 1600.0, "value": 48000.0},
]


def _initialise_state() -> None:
    st.session_state.setdefault("holdings", [])
    st.session_state.setdefault("portfolio_confirmed", False)


def _empty_frame() -> pd.DataFrame:
    return pd.DataFrame(st.session_state.holdings or [{column: "" if column == "symbol" else 0.0 for column in REQUIRED_COLUMNS}])


def _validate(frame: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    candidate = frame.copy()
    for column in REQUIRED_COLUMNS:
        if column not in candidate:
            candidate[column] = "" if column == "symbol" else 0.0
    candidate = candidate[REQUIRED_COLUMNS]
    candidate["symbol"] = candidate["symbol"].astype(str).str.strip().str.upper().str.replace(r"\.(NS|BO)$", "", regex=True)
    candidate = candidate[~candidate["symbol"].isin(["", "NAN", "NONE"])]
    for column in REQUIRED_COLUMNS[1:]:
        candidate[column] = pd.to_numeric(candidate[column], errors="coerce").fillna(0.0)
    candidate.loc[candidate["value"] <= 0, "value"] = candidate["quantity"] * candidate["current_price"]
    warnings = []
    if candidate.empty:
        warnings.append("Add at least one NSE symbol before confirming holdings.")
    if (candidate["value"] <= 0).any():
        warnings.append("Some rows have no market value. Add quantity and current price, or enter value directly.")
    if candidate["symbol"].duplicated().any():
        warnings.append("Duplicate symbols were combined into a single holding.")
        candidate = candidate.groupby("symbol", as_index=False).agg({"quantity": "sum", "average_cost": "mean", "current_price": "last", "value": "sum"})
    return candidate, warnings


@st.cache_data(ttl=900, show_spinner=False)
def _prices(symbols: tuple[str, ...]) -> tuple[pd.DataFrame, str, str | None]:
    return fetch_price_history(list(symbols))


def _render_analysis(holdings: pd.DataFrame) -> None:
    total = float(holdings["value"].sum())
    if total <= 0:
        st.warning("Add current values to unlock allocation and risk analysis.")
        return
    allocation = holdings.assign(weight=holdings["value"] / total).sort_values("weight", ascending=False)
    st.markdown("### 3. Review your confirmed portfolio")
    left, right = st.columns(2)
    left.plotly_chart(px.pie(allocation, names="symbol", values="value", title="Confirmed allocation"), use_container_width=True)
    right.dataframe(allocation[["symbol", "value", "weight"]], hide_index=True, use_container_width=True, column_config={"value": st.column_config.NumberColumn("Value", format="₹%d"), "weight": st.column_config.NumberColumn("Weight", format="%.1%%")})
    with st.expander("4. Calculate an indicative portfolio-risk summary", expanded=True):
        use_market = st.checkbox("Use one year of public Yahoo Finance price history", value=True)
        confidence = st.selectbox("VaR confidence", [0.90, 0.95, 0.99], index=1, format_func=lambda value: f"{value:.0%}")
        starting_value = st.number_input("Approximate total amount invested", min_value=0.0, value=total * 0.85, step=1000.0)
        first_investment = st.date_input("Approximate first investment date", value=date(date.today().year - 3, 1, 1))
    prices, source, as_of = pd.DataFrame(), "Manual inputs", None
    if use_market:
        with st.spinner("Fetching price history for confirmed NSE symbols..."):
            prices, source, as_of = _prices(tuple(allocation["symbol"]))
    if prices.empty:
        st.warning(f"{source}. Risk calculations need price history; your confirmed holdings remain available for review.")
        return
    returns = prices.pct_change().dropna(how="all").mean(axis=1).dropna().to_numpy()
    risk = calculate_portfolio_risk(CalculationRequest("portfolio_risk", {"returns": returns.tolist(), "confidence": confidence, "holdings": holdings.to_dict("records")}))
    performance = calculate_returns(CalculationRequest("returns", {"cashflows": [{"date": first_investment, "amount": -starting_value}], "ending_value": total, "period_returns": returns.tolist()}, as_of_date=date.today()))
    st.caption(f"Source: {source}. Retrieved: {as_of or 'unavailable'}. Public data can be delayed or incomplete.")
    a, b, c, d = st.columns(4)
    a.metric("Annual volatility", f"{risk.outputs.get('annualized_volatility', 0) * 100:.1f}%")
    b.metric("Maximum drawdown", f"{risk.outputs.get('max_drawdown', 0) * 100:.1f}%")
    c.metric("Historical daily VaR", f"{risk.outputs.get('historical_var_daily', 0) * 100:.2f}%")
    d.metric("Top holding", f"{risk.outputs.get('top_holding_weight', 0) * 100:.1f}%")
    a, b, c = st.columns(3)
    a.metric("Invested", f"₹{performance.outputs.get('invested_amount', 0):,.0f}")
    b.metric("Current value", f"₹{performance.outputs.get('ending_value', 0):,.0f}")
    c.metric("XIRR", "—" if performance.outputs.get("xirr") is None else f"{performance.outputs['xirr'] * 100:.1f}%")


def holdings_page() -> None:
    _initialise_state()
    st.markdown('<div class="cs-hero"><span class="cs-kicker">HOLDINGS</span><h2>Add, check, then analyse your portfolio</h2></div>', unsafe_allow_html=True)
    st.info("Your data stays in this browser session. Nothing is stored, and analysis begins only after you confirm the edited table.")
    st.markdown("### 1. Add holdings")
    sample, upload = st.columns(2)
    with sample:
        if st.button("Load sample Indian equity portfolio", use_container_width=True):
            st.session_state.holdings, st.session_state.portfolio_confirmed = SAMPLE_HOLDINGS, False
    with upload:
        template = pd.DataFrame(SAMPLE_HOLDINGS[:1])
        st.download_button("Download CSV template", template.to_csv(index=False).encode("utf-8"), "capitalsense_holdings_template.csv", "text/csv", use_container_width=True)
        file = st.file_uploader("Import holdings CSV", type=["csv"], key="holdings_import")
        if file and st.button("Load CSV for review", use_container_width=True):
            parsed = parse_holdings_csv(file.getvalue())
            for warning in parsed.warnings:
                st.warning(warning)
            if parsed.records:
                st.session_state.holdings, st.session_state.portfolio_confirmed = parsed.records, False
    edited = st.data_editor(_empty_frame(), num_rows="dynamic", use_container_width=True, key="confirmed_holdings_editor")
    if st.button("2. Confirm holdings for analysis", type="primary", use_container_width=True):
        valid, warnings = _validate(edited)
        for warning in warnings:
            st.warning(warning)
        if not valid.empty and float(valid["value"].sum()) > 0:
            st.session_state.holdings = valid.to_dict("records")
            st.session_state.portfolio_confirmed = True
            st.success("Holdings confirmed for this session. You can now review the analysis below.")
    if not st.session_state.portfolio_confirmed:
        st.info("Confirm the table above to continue. This prevents an upload or draft from being analysed by mistake.")
        return
    _render_analysis(pd.DataFrame(st.session_state.holdings))
