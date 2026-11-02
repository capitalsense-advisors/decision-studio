from pathlib import Path
from streamlit.testing.v1 import AppTest


def test_home_renders_without_optional_shared_engines():
    app = AppTest.from_file(str(Path(__file__).parents[1] / "app.py"), default_timeout=20).run()
    assert not app.exception
