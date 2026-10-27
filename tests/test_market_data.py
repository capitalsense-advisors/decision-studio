import sys
from types import SimpleNamespace

import pandas as pd

from services.market_data import fetch_price_history


def test_fetch_price_history_handles_empty_symbol_list():
    prices, source, as_of = fetch_price_history([])

    assert prices.empty
    assert source == "No symbols requested"
    assert as_of is None


def test_fetch_price_history_normalizes_symbols_and_returns_close_frame(monkeypatch):
    captured = {}
    columns = pd.MultiIndex.from_product(
        [["Close"], ["RELIANCE.NS", "TCS.NS"]]
    )
    raw = pd.DataFrame(
        [[100.0, 200.0], [101.0, 202.0]],
        index=pd.date_range("2026-10-01", periods=2),
        columns=columns,
    )

    def fake_download(symbols, **kwargs):
        captured["symbols"] = symbols
        captured["kwargs"] = kwargs
        return raw

    monkeypatch.setitem(sys.modules, "yfinance", SimpleNamespace(download=fake_download))

    prices, source, as_of = fetch_price_history(["reliance", "TCS.NS"])

    assert captured["symbols"] == ["reliance.NS", "TCS.NS"]
    assert captured["kwargs"]["auto_adjust"] is True
    assert list(prices.columns) == ["RELIANCE.NS", "TCS.NS"]
    assert source == "Yahoo Finance (public, may be delayed)"
    assert as_of is not None


def test_fetch_price_history_returns_controlled_state_for_empty_provider_response(monkeypatch):
    monkeypatch.setitem(
        sys.modules,
        "yfinance",
        SimpleNamespace(download=lambda *args, **kwargs: pd.DataFrame()),
    )

    prices, source, as_of = fetch_price_history(["RELIANCE"])

    assert prices.empty
    assert source == "Yahoo Finance returned no usable Close data"
    assert as_of is None


def test_fetch_price_history_returns_controlled_state_for_provider_exception(monkeypatch):
    def fail(*args, **kwargs):
        raise RuntimeError("provider offline")

    monkeypatch.setitem(sys.modules, "yfinance", SimpleNamespace(download=fail))

    prices, source, as_of = fetch_price_history(["RELIANCE"])

    assert prices.empty
    assert source == "Market data unavailable: provider offline"
    assert as_of is None
