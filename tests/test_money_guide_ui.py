from pathlib import Path

from streamlit.testing.v1 import AppTest


TOOLS = [
    "Money Multiplier",
    "Ideal Investment Allocation",
    "Where to Invest?",
    "Get to ₹1 Crore",
    "Manage Monthly Spends",
    "Plan Your Dream Home",
    "FIRE – Retire Early",
    "SIP Calculator",
]


def test_every_money_guide_view_renders_with_one_rupee_slider():
    page = Path(__file__).parents[1] / "pages" / "money_guide.py"
    app = AppTest.from_file(str(page), default_timeout=10).run()

    assert not app.exception
    for tool in TOOLS:
        app.selectbox[0].select(tool).run()
        assert not app.exception, tool
        assert len(app.slider) == 1, tool
        assert len(app.button) == 1, tool
        assert app.button[0].disabled is True, tool
