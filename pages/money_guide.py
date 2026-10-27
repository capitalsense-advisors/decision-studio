"""Responsive, one-input Money Guide for everyday investment decisions."""

from __future__ import annotations

import os

import plotly.graph_objects as go
import streamlit as st

from core.money_guide import (
    ANNUAL_RETURN,
    CURRENT_AGE,
    HORIZON_YEARS,
    INFLATION,
    RETIREMENT_AGE,
    compact_years,
    crore_timeline,
    dream_home_plan,
    fire_plan,
    ideal_allocation,
    lump_sum_projection,
    money_multiplier,
    monthly_spend_plan,
    sip_projection,
)


TOOLS = {
    "Money Multiplier": ("✌️", "See how compounding changes your money over time."),
    "Ideal Investment Allocation": ("◔", "Split one amount between equity and debt."),
    "Where to Invest?": ("₹", "Understand three broad roles investments can play."),
    "Get to ₹1 Crore": ("1Cr", "Estimate how long monthly investing could take."),
    "Manage Monthly Spends": ("🗓️", "Turn income into a simple 50/30/20 plan."),
    "Plan Your Dream Home": ("🏠", "Translate income into an affordability guardrail."),
    "FIRE – Retire Early": ("🌴", "Estimate a retirement corpus from today's expenses."),
    "SIP Calculator": ("↗", "Compare monthly SIP and one-time growth."),
}


def _css() -> None:
    st.markdown(
        """
        <style>
        :root { --mg-orange:#ff7a3d; --mg-surface:#17191f; --mg-muted:#9aa3b2; }
        .mg-hero {padding:clamp(1.25rem,4vw,2.6rem); border:1px solid rgba(255,122,61,.24);
          border-radius:24px; background:radial-gradient(circle at 88% 8%,rgba(255,122,61,.24),transparent 30%),
          linear-gradient(145deg,#231a18 0%,#15171d 62%); margin-bottom:1.2rem; overflow:hidden;}
        .mg-kicker {color:var(--mg-orange); font-size:.78rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase;}
        .mg-hero h1 {font-size:clamp(2rem,6vw,4rem); line-height:1.02; margin:.55rem 0 .8rem; max-width:720px;}
        .mg-hero p {color:#c4c9d1; max-width:650px; font-size:clamp(.96rem,2vw,1.12rem); margin:0;}
        .mg-title {display:flex; gap:.8rem; align-items:center; margin:.2rem 0 1rem;}
        .mg-icon {display:grid; place-items:center; min-width:44px; height:44px; padding:0 .35rem; border-radius:14px;
          color:var(--mg-orange); background:rgba(255,122,61,.12); font-weight:800;}
        .mg-title h2 {margin:0; font-size:clamp(1.45rem,4vw,2.15rem);}
        .mg-assumption {border:1px solid rgba(255,255,255,.09); background:rgba(255,255,255,.035);
          border-radius:14px; padding:.9rem 1rem; min-height:86px;}
        .mg-assumption small {color:var(--mg-muted); display:block; margin-bottom:.3rem;}
        .mg-assumption strong {font-size:1.05rem;}
        .mg-result {border:1px solid rgba(255,122,61,.23); background:linear-gradient(145deg,rgba(255,122,61,.10),rgba(255,255,255,.025));
          border-radius:18px; padding:1.15rem; min-height:126px; height:100%;}
        .mg-result small {color:var(--mg-muted); display:block; margin-bottom:.45rem;}
        .mg-result strong {font-size:clamp(1.35rem,3.4vw,2rem); color:#fff;}
        .mg-result p {font-size:.88rem; color:#aeb6c2; margin:.45rem 0 0;}
        .mg-card {border:1px solid rgba(255,255,255,.09); background:var(--mg-surface); border-radius:18px; padding:1.1rem; min-height:150px;}
        .mg-card b {display:block; font-size:1.05rem; margin:.35rem 0;}
        .mg-card p {color:var(--mg-muted); font-size:.9rem; margin:.35rem 0;}
        .mg-disclaimer {font-size:.82rem; color:var(--mg-muted); padding:.9rem 0;}
        div[data-testid="stSlider"] > label {font-weight:700; font-size:1rem;}
        div[data-testid="stSlider"] [data-baseweb="slider"] {margin-top:.35rem;}
        div[data-testid="stButton"] button[kind="primary"] {background:var(--mg-orange); border-color:var(--mg-orange);}
        @media (max-width: 640px) {
          .block-container {padding-left:1rem; padding-right:1rem; padding-top:1rem;}
          .mg-hero {border-radius:18px;}
          .mg-result,.mg-card {min-height:auto;}
          div[data-testid="stHorizontalBlock"] {gap:.65rem;}
          div[data-testid="column"] {min-width:100% !important;}
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def _money(value: float) -> str:
    value = float(value)
    if value >= 10_000_000:
        return f"₹{value / 10_000_000:.2f} Cr"
    if value >= 100_000:
        return f"₹{value / 100_000:.2f} Lakh"
    return f"₹{value:,.0f}"


def _heading(name: str) -> None:
    icon, _ = TOOLS[name]
    st.markdown(f'<div class="mg-title"><span class="mg-icon">{icon}</span><h2>{name}</h2></div>', unsafe_allow_html=True)


def _assumptions(items: list[tuple[str, str]]) -> None:
    columns = st.columns(len(items))
    for column, (label, value) in zip(columns, items):
        column.markdown(f'<div class="mg-assumption"><small>{label}</small><strong>{value}</strong></div>', unsafe_allow_html=True)
    st.write("")


def _results(items: list[tuple[str, str, str]]) -> None:
    columns = st.columns(len(items))
    for column, (label, value, note) in zip(columns, items):
        column.markdown(f'<div class="mg-result"><small>{label}</small><strong>{value}</strong><p>{note}</p></div>', unsafe_allow_html=True)


def _slider(label: str, minimum: int, maximum: int, value: int, step: int, key: str) -> int:
    return st.slider(label, minimum, maximum, value, step, key=key, format="₹%d")


def _cta(destination: str, label: str = "Explore investment options") -> None:
    url = os.getenv(f"CAPITALSENSE_{destination.upper()}_URL", "").strip()
    st.write("")
    if url:
        st.link_button(label, url, type="primary", width="stretch")
    else:
        st.button(label, disabled=True, width="stretch", help="This link will be enabled after the approved Smallcase destination is configured.")


def _multiplier() -> None:
    name = "Money Multiplier"
    _heading(name)
    _assumptions([("Expected return", "12% p.a."), ("Illustrations", "Double · Triple · Quadruple")])
    amount = _slider("Your investment", 1_000, 1_000_000, 10_000, 1_000, "mg_multiplier")
    result = money_multiplier(amount)
    _results([
        ("Rule of 72", _money(amount * 2), f"about {result.rule_72_years:g} years"),
        ("Rule of 114", _money(amount * 3), f"about {result.rule_114_years:g} years"),
        ("Rule of 144", _money(amount * 4), f"about {result.rule_144_years:g} years"),
    ])
    _cta("indices", "Start exploring")


def _allocation() -> None:
    name = "Ideal Investment Allocation"
    _heading(name)
    _assumptions([("Age", f"{CURRENT_AGE} years"), ("Rule", "100 − age in equity")])
    amount = _slider("Your investment", 1_000, 1_000_000, 10_000, 1_000, "mg_allocation")
    result = ideal_allocation(amount)
    fig = go.Figure(go.Pie(values=[result["equity_amount"], result["debt_amount"]], labels=["Equity", "Debt"], hole=.62, marker_colors=["#ff7a3d", "#557fd1"], textinfo="label+percent"))
    fig.update_layout(height=300, margin=dict(l=10, r=10, t=20, b=10), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font_color="#d8dde6", showlegend=False)
    st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})
    _results([("Equity · 77%", _money(result["equity_amount"]), "Growth-oriented allocation"), ("Debt · 23%", _money(result["debt_amount"]), "Stability-oriented allocation")])
    _cta("allocation", "See investment options")


def _where_to_invest() -> None:
    name = "Where to Invest?"
    _heading(name)
    _assumptions([("Approach", "Three simple investment roles"), ("Important", "Not a personalised recommendation")])
    amount = _slider("Your investment", 1_000, 1_000_000, 10_000, 1_000, "mg_where")
    st.caption(f"Explore what a {_money(amount)} investment could be used for. Choose based on your timeline and risk—not just expected returns.")
    cards = [
        ("📈", "Grow with markets", "Broad market indices", "For long-term growth; values can fall sharply in the short term."),
        ("🪙", "Diversify with metals", "Gold and silver", "A diversifier, not a guaranteed safe or income-producing asset."),
        ("💧", "Keep money accessible", "Liquid assets", "For near-term needs where access matters more than high growth."),
    ]
    columns = st.columns(3)
    for column, (icon, role, title, note) in zip(columns, cards):
        column.markdown(f'<div class="mg-card"><span style="font-size:1.6rem">{icon}</span><p>{role}</p><b>{title}</b><p>{note}</p></div>', unsafe_allow_html=True)
    _cta("where_to_invest", "Explore all options")


def _crore() -> None:
    name = "Get to ₹1 Crore"
    _heading(name)
    _assumptions([("Target", "₹1 Crore"), ("Expected return", "12% p.a."), ("Contribution", "Start of every month")])
    amount = _slider("Your monthly investment", 1_000, 200_000, 10_000, 1_000, "mg_crore")
    result = crore_timeline(amount)
    _results([
        ("With investing", compact_years(result["investing_years"]), "Illustrative compounding timeline"),
        ("Saving only", compact_years(result["saving_only_years"]), "Without investment growth"),
    ])
    _cta("indices", "Start investing")


def _spends() -> None:
    name = "Manage Monthly Spends"
    _heading(name)
    _assumptions([("Budget rule", "50% needs · 30% wants · 20% invest"), ("Period", "Monthly")])
    amount = _slider("Your monthly income", 10_000, 1_000_000, 100_000, 5_000, "mg_spends")
    result = monthly_spend_plan(amount)
    _results([
        ("Needs · 50%", _money(result["needs"]), "Rent, food, utilities and essentials"),
        ("Wants · 30%", _money(result["wants"]), "Dining, shopping and lifestyle"),
        ("Invest · 20%", _money(result["invest"]), "Long-term goals and emergency reserves"),
    ])
    _cta("where_to_invest", "Explore where to invest")


def _home() -> None:
    name = "Plan Your Dream Home"
    _heading(name)
    _assumptions([("Framework", "3 / 20 / 30 / 40"), ("Repayment", "20 years"), ("Down payment", "40%")])
    amount = _slider("Your annual income", 300_000, 20_000_000, 2_000_000, 100_000, "mg_home")
    result = dream_home_plan(amount)
    _results([
        ("Maximum home budget", _money(result["home_budget"]), "Up to 3× annual income"),
        ("Maximum EMI", f'{_money(result["monthly_emi_limit"])} / month', "Up to 30% of monthly income"),
        ("Down payment", _money(result["down_payment"]), "40% of the home budget"),
    ])
    _cta("home", "Explore home planning options")


def _fire() -> None:
    name = "FIRE – Retire Early"
    _heading(name)
    _assumptions([("Current age", str(CURRENT_AGE)), ("Retirement age", str(RETIREMENT_AGE)), ("Inflation", f"{INFLATION:.0%}"), ("FIRE multiple", "25× annual expenses")])
    amount = _slider("Your monthly expenses today", 5_000, 1_000_000, 10_000, 5_000, "mg_fire")
    result = fire_plan(amount)
    _results([
        ("Estimated FIRE number", _money(result["fire_number"]), f"At age {RETIREMENT_AGE}"),
        ("Future monthly expenses", _money(result["future_monthly_expenses"]), f"After {RETIREMENT_AGE - CURRENT_AGE} years of inflation"),
    ])
    _cta("retirement", "Explore retirement options")


def _sip() -> None:
    name = "SIP Calculator"
    _heading(name)
    _assumptions([("Expected return", f"{ANNUAL_RETURN:.0%} p.a."), ("Time period", f"{HORIZON_YEARS} years"), ("SIP timing", "Start of month")])
    amount = _slider("Your investment amount", 1_000, 1_000_000, 10_000, 1_000, "mg_sip")
    sip = sip_projection(amount)
    once = lump_sum_projection(amount)
    _results([
        ("Monthly SIP value", _money(sip["future_value"]), f'{_money(sip["invested"])} invested over 5 years'),
        ("One-time value", _money(once["future_value"]), f'{_money(amount)} invested once for 5 years'),
    ])
    _cta("indices", "Invest now")


RENDERERS = {
    "Money Multiplier": _multiplier,
    "Ideal Investment Allocation": _allocation,
    "Where to Invest?": _where_to_invest,
    "Get to ₹1 Crore": _crore,
    "Manage Monthly Spends": _spends,
    "Plan Your Dream Home": _home,
    "FIRE – Retire Early": _fire,
    "SIP Calculator": _sip,
}


def money_guide_page() -> None:
    _css()
    st.markdown('<div class="mg-hero"><span class="mg-kicker">Money Guide</span><h1>Power up your money decisions.</h1><p>Choose one question, move one rupee slider, and see a clear illustration built on assumptions you can inspect.</p></div>', unsafe_allow_html=True)
    selected = st.selectbox("What do you want to work out?", list(TOOLS), format_func=lambda item: f"{TOOLS[item][0]}  {item}", key="money_guide_tool")
    st.caption(TOOLS[selected][1])
    st.divider()
    RENDERERS[selected]()
    st.markdown('<p class="mg-disclaimer">Educational illustration only. Fixed returns are assumptions, not forecasts or guarantees. Check suitability, costs, taxes and product documents before investing.</p>', unsafe_allow_html=True)


if __name__ == "__main__":
    money_guide_page()
