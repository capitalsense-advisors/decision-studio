"""Guided, self-contained financial planning tools for Decision Studio."""

from __future__ import annotations

import pandas as pd
import plotly.express as px
import streamlit as st

from core.contracts import CalculationRequest, CalculationResult
from core.engines import calculate_capital_gains, calculate_dcf, calculate_goal_plan, calculate_trade_plan
from pages.money_guide import money_guide_page


def _money(value: float | None) -> str:
    return "—" if value is None else f"₹{value:,.0f}"


def _percent(value: float | None) -> str:
    return "—" if value is None else f"{value * 100:.1f}%"


def _results(result: CalculationResult, metrics: list[tuple[str, float | None, str]]) -> None:
    columns = st.columns(len(metrics))
    for column, (label, value, kind) in zip(columns, metrics):
        column.metric(label, _money(value) if kind == "money" else _percent(value) if kind == "percent" else "—" if value is None else f"{value:,.2f}")
    for warning in result.warnings:
        st.warning(warning)
    with st.expander("Assumptions and data limits"):
        for item in result.assumptions + result.data_quality:
            st.write(f"- {item}")


def _goals() -> None:
    st.subheader("Goals and retirement")
    st.caption("Use this to test whether a monthly investment is broadly aligned with a future spending goal.")
    a, b, c = st.columns(3)
    with a:
        sip = st.number_input("Monthly investment", 0.0, value=15000.0, step=1000.0)
        years = st.slider("Years to goal", 1, 40, 20)
    with b:
        annual_return = st.slider("Expected annual return", 3.0, 18.0, 11.0, 0.5) / 100
        step_up = st.slider("Annual SIP step-up", 0.0, 25.0, 10.0, 1.0)
    with c:
        inflation = st.slider("Expected inflation", 2.0, 12.0, 6.0, 0.5) / 100
        expenses = st.number_input("Current monthly expenses", 0.0, value=60000.0, step=5000.0)
    result = calculate_goal_plan(CalculationRequest("goal_planner", {"monthly_sip": sip, "annual_step_up": step_up, "years": years, "annual_return": annual_return, "inflation": inflation, "monthly_expenses": expenses, "nps_share": 0.0}))
    _results(result, [("Projected corpus", result.outputs["projected_corpus"], "money"), ("Indicative FIRE corpus", result.outputs["indicative_fire_corpus"], "money"), ("Goal gap", result.outputs["goal_gap"], "money")])
    st.line_chart(pd.DataFrame(result.tables_and_chart_series["yearly_projection"]).set_index("year")[["corpus"]])


def _valuation() -> None:
    st.subheader("Value a stock")
    st.caption("Test whether your valuation story survives conservative assumptions. This is not a target price.")
    a, b, c = st.columns(3)
    with a:
        fcff = st.number_input("Current annual FCFF", 0.0, value=1000.0, step=100.0)
        growth = st.slider("Five-year FCFF growth", -10.0, 35.0, 12.0, 0.5) / 100
        terminal_growth = st.slider("Terminal growth", 1.0, 8.0, 5.0, 0.25) / 100
    with b:
        beta = st.slider("Equity beta", 0.2, 3.0, 1.0, 0.05)
        risk_free = st.slider("Risk-free rate", 4.0, 10.0, 7.0, 0.25) / 100
        premium = st.slider("Equity risk premium", 3.0, 10.0, 6.0, 0.25) / 100
    with c:
        debt = st.number_input("Net debt (cash negative)", value=0.0, step=100.0)
        shares = st.number_input("Shares outstanding", 1.0, value=100.0, step=1.0)
        equity_weight = st.slider("Equity weight in capital", 10, 95, 75) / 100
    result = calculate_dcf(CalculationRequest("dcf_valuation", {"fcff": fcff, "growth": growth, "terminal_growth": terminal_growth, "beta": beta, "risk_free": risk_free, "equity_premium": premium, "cost_debt": 0.09, "tax_rate": 0.25, "equity_weight": equity_weight, "net_debt": debt, "shares_outstanding": shares, "horizon_years": 5}))
    _results(result, [("Value per share", result.outputs["value_per_share"], "money"), ("WACC", result.outputs["wacc"], "percent"), ("Equity value", result.outputs["equity_value"], "money")])


def _tax() -> None:
    st.subheader("Sell and tax-aware return")
    st.caption("An indicative capital-gains calculation. Verify applicable tax rules before acting.")
    a, b, c = st.columns(3)
    with a:
        purchase = st.number_input("Purchase value", 0.0, value=500000.0, step=10000.0)
        sale = st.number_input("Expected sale value", 0.0, value=700000.0, step=10000.0)
    with b:
        costs = st.number_input("Transaction costs", 0.0, value=1000.0, step=500.0)
        months = st.number_input("Holding period (months)", 0, value=18, step=1)
    with c:
        asset = st.selectbox("Asset type", ["listed_equity", "other_asset"], format_func=lambda item: "Listed equity / equity mutual fund" if item == "listed_equity" else "Other asset")
        long_rate = st.slider("Long-term tax-rate assumption", 0.0, 40.0, 12.5, 0.5) / 100
    result = calculate_capital_gains(CalculationRequest("capital_gains", {"purchase_value": purchase, "sale_value": sale, "transaction_costs": costs, "holding_months": months, "asset_type": asset, "short_rate": 0.20, "long_rate": long_rate, "long_exemption": 125000}, tax_year="FY 2026-27 estimate"))
    _results(result, [("Estimated tax", result.outputs["estimated_tax"], "money"), ("Net sale proceeds", result.outputs["net_sale_proceeds"], "money"), ("After-tax return", result.outputs["after_tax_return"], "percent")])


def _trade() -> None:
    st.subheader("Trade plan")
    st.caption("Set a maximum loss before placing a trade elsewhere. No broker, margin, or live option-chain data is used.")
    a, b, c = st.columns(3)
    with a:
        capital = st.number_input("Capital available", 0.0, value=200000.0, step=5000.0)
        risk = st.slider("Maximum capital at risk (%)", 0.1, 5.0, 1.0, 0.1)
    with b:
        entry = st.number_input("Planned entry", 0.0, value=1000.0, step=1.0)
        stop = st.number_input("Stop-loss", 0.0, value=950.0, step=1.0)
        target = st.number_input("Target", 0.0, value=1100.0, step=1.0)
    with c:
        leverage = st.slider("Illustrative leverage", 1.0, 10.0, 1.0, 0.5)
        charges = st.slider("Round-trip charge rate (%)", 0.0, 0.5, 0.10, 0.01) / 100
    result = calculate_trade_plan(CalculationRequest("trade_plan", {"capital": capital, "risk_percent": risk, "entry": entry, "stop": stop, "target": target, "leverage": leverage, "charges_rate": charges}))
    _results(result, [("Risk budget", result.outputs["risk_budget"], "money"), ("Position quantity", result.outputs["position_quantity"], "number"), ("Risk / reward", result.outputs["risk_reward_ratio"], "number"), ("Margin illustration", result.outputs["margin_estimate"], "money")])


def decision_tools_page() -> None:
    st.markdown('<div class="cs-hero"><span class="cs-kicker">DECISION TOOLS</span><h2>Choose one question at a time</h2></div>', unsafe_allow_html=True)
    choice = st.radio("What do you want to work on?", ["Money Guide", "Goals and retirement", "Value a stock", "Sell and tax-aware return", "Trade plan"], horizontal=True)
    {"Money Guide": money_guide_page, "Goals and retirement": _goals, "Value a stock": _valuation, "Sell and tax-aware return": _tax, "Trade plan": _trade}[choice]()
