import pytest

from core.money_guide import (
    crore_timeline,
    dream_home_plan,
    fire_plan,
    ideal_allocation,
    lump_sum_projection,
    money_multiplier,
    monthly_spend_plan,
    sip_projection,
)


def test_money_multiplier_matches_rule_timelines():
    result = money_multiplier(10_000)
    assert result.rule_72_years == 6
    assert result.rule_114_years == 9.5
    assert result.rule_144_years == 12


def test_allocation_uses_age_23_rule():
    result = ideal_allocation(10_000)
    assert result["equity_amount"] == pytest.approx(7_700)
    assert result["debt_amount"] == pytest.approx(2_300)


def test_sip_and_lump_sum_match_reference_examples():
    sip = sip_projection(10_000)
    once = lump_sum_projection(10_000)
    assert sip["invested"] == 600_000
    assert sip["future_value"] == pytest.approx(825_000, rel=0.015)
    assert once["future_value"] == pytest.approx(17_623.42, abs=0.02)


def test_crore_timeline_is_about_twenty_years_at_ten_thousand_monthly():
    result = crore_timeline(10_000)
    assert 19 <= result["investing_years"] <= 21
    assert result["saving_only_years"] == pytest.approx(83.3333, rel=0.001)


def test_budget_and_home_rules_are_deterministic():
    budget = monthly_spend_plan(100_000)
    home = dream_home_plan(2_000_000)
    assert budget == {"income": 100_000, "needs": 50_000, "wants": 30_000, "invest": 20_000}
    assert home["home_budget"] == 6_000_000
    assert home["monthly_emi_limit"] == pytest.approx(50_000)
    assert home["down_payment"] == 2_400_000


def test_fire_reference_result_includes_inflation_to_retirement():
    result = fire_plan(10_000)
    assert result["future_monthly_expenses"] == pytest.approx(62_130, rel=0.01)
    assert result["fire_number"] == pytest.approx(18_639_000, rel=0.01)


@pytest.mark.parametrize("calculator", [money_multiplier, ideal_allocation, sip_projection, lump_sum_projection, monthly_spend_plan, dream_home_plan, fire_plan])
def test_money_inputs_are_clamped_at_zero(calculator):
    result = calculator(-1)
    if hasattr(result, "amount"):
        assert result.amount == 0
    else:
        assert all(value >= 0 for key, value in result.items() if key not in {"inflation"})
