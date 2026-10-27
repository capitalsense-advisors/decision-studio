from services.documents import CSV_MAX_BYTES, parse_holdings_csv


def test_parse_holdings_csv_rejects_oversized_input():
    result = parse_holdings_csv(b"x" * (CSV_MAX_BYTES + 1))

    assert result.records == []
    assert result.requires_confirmation is True
    assert result.warnings == ["CSV exceeds the 5 MB session limit."]


def test_parse_holdings_csv_reports_malformed_input():
    result = parse_holdings_csv(b'"symbol,quantity\nRELIANCE,10')

    assert result.records == []
    assert result.warnings
    assert "could not be read" in result.warnings[0]


def test_parse_holdings_csv_requires_symbol_column():
    result = parse_holdings_csv(b"quantity,average_buy_price\n10,2850\n")

    assert result.records == []
    assert result.confidence == 0.0
    assert result.warnings == ["CSV needs a symbol/ticker/security column."]


def test_parse_holdings_csv_accepts_approved_template_and_aliases():
    result = parse_holdings_csv(
        b"symbol,quantity,average_buy_price,current_price\nreliance,10,2850,3000\n"
    )

    assert result.warnings == []
    assert result.confidence == 0.92
    assert result.records == [
        {
            "symbol": "RELIANCE",
            "quantity": 10.0,
            "average_cost": 2850.0,
            "current_price": 3000.0,
            "value": 30000.0,
        }
    ]


def test_parse_holdings_csv_limits_public_session_rows():
    rows = "\n".join(f"SYM{i},1,100,101" for i in range(205))
    result = parse_holdings_csv(
        ("symbol,quantity,average_buy_price,current_price\n" + rows).encode("utf-8")
    )

    assert len(result.records) == 200
    assert "Only the first 200 rows were loaded for this public-app session." in result.warnings
