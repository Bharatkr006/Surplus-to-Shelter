"""
Focused unit tests for the matching engine.
Tests actual logic — no mocking of the result.
"""
import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch

# Import matching functions directly
from app.services.matching import (
    evaluate_candidates,
    calculate_distance_score,
    calculate_capacity_score,
    calculate_food_compatibility_score,
    calculate_need_score,
    calculate_urgency_score,
    calculate_driver_score,
    WEIGHTS,
)


# ---------------------------------------------------------------------------
# Helpers: fake domain objects (no DB required)
# ---------------------------------------------------------------------------

class FakeDonation:
    def __init__(
        self,
        food_category="Cooked Meals",
        quantity=40,
        unit="Portions",
        pickup_lat=26.8228,
        pickup_lng=75.8660,
        safe_until_offset_minutes=180,
    ):
        self.id = "test-donation-id"
        self.food_category = food_category
        self.quantity = quantity
        self.unit = unit
        self.pickup_lat = pickup_lat
        self.pickup_lng = pickup_lng
        self.safe_until = datetime.now(timezone.utc) + timedelta(minutes=safe_until_offset_minutes)


class FakeOrg:
    def __init__(
        self,
        name="Test Org",
        is_open=True,
        capacity_available=100,
        accepted_food_categories=None,
        current_needs=None,
        lat=26.8833,
        lng=75.7999,
    ):
        self.id = f"org-{name}"
        self.name = name
        self.address = f"{name} Address"
        self.latitude = lat
        self.longitude = lng
        self.is_open = is_open
        self.capacity_available = capacity_available
        self.capacity_total = 200
        self.accepted_food_categories = accepted_food_categories or ["Cooked Meals"]
        self.current_needs = current_needs or []


# Patch routing to use fallback always (no network in tests)
MOCK_ROUTE = {"distance_km": 4.5, "estimated_minutes": 20, "provider": "FALLBACK_ESTIMATE"}


# ---------------------------------------------------------------------------
# Score component tests
# ---------------------------------------------------------------------------

class TestDistanceScore:
    def test_zero_distance_max_score(self):
        assert calculate_distance_score(0.0) == 100.0

    def test_at_max_boundary_is_zero(self):
        assert calculate_distance_score(30.0) == 0.0

    def test_midpoint(self):
        score = calculate_distance_score(15.0)
        assert 49.0 <= score <= 51.0

    def test_beyond_max_is_zero(self):
        assert calculate_distance_score(50.0) == 0.0


class TestCapacityScore:
    def test_donation_exactly_fits(self):
        score = calculate_capacity_score(40, 40)
        assert score == 60.0  # ratio = 1.0, base 60

    def test_plenty_of_room(self):
        score = calculate_capacity_score(10, 200)
        assert score > 95.0  # large headroom

    def test_insufficient_capacity_returns_zero(self):
        assert calculate_capacity_score(40, 10) == 0.0

    def test_zero_capacity_returns_zero(self):
        assert calculate_capacity_score(40, 0) == 0.0


class TestFoodCompatibility:
    def test_exact_category_match(self):
        assert calculate_food_compatibility_score("Cooked Meals", ["Cooked Meals", "Bakery"]) == 100.0

    def test_case_insensitive_match(self):
        assert calculate_food_compatibility_score("cooked meals", ["Cooked Meals"]) == 100.0

    def test_no_match_returns_zero(self):
        assert calculate_food_compatibility_score("Cooked Meals", ["Packaged Food", "Dairy"]) == 0.0

    def test_empty_accepted_returns_fifty(self):
        assert calculate_food_compatibility_score("Cooked Meals", []) == 50.0


class TestNeedScore:
    def test_food_in_urgent_needs_returns_100(self):
        assert calculate_need_score("Cooked Meals", ["Cooked Meals"]) == 100.0

    def test_food_not_in_needs_returns_40(self):
        assert calculate_need_score("Cooked Meals", ["Dairy"]) == 40.0

    def test_empty_needs_returns_50(self):
        assert calculate_need_score("Cooked Meals", []) == 50.0


class TestUrgencyScore:
    def test_ample_margin_returns_100(self):
        score = calculate_urgency_score(200, 20, 15)
        assert score == 100.0  # margin = 165 mins > 90

    def test_zero_margin_returns_zero(self):
        score = calculate_urgency_score(35, 20, 15)
        assert score == 0.0

    def test_negative_margin_returns_zero(self):
        score = calculate_urgency_score(20, 20, 15)
        assert score == 0.0


class TestDriverScore:
    def test_driver_available(self):
        assert calculate_driver_score(True) == 100.0

    def test_no_driver(self):
        assert calculate_driver_score(False) == 30.0


# ---------------------------------------------------------------------------
# Eligibility rule tests (via evaluate_candidates)
# ---------------------------------------------------------------------------

class TestEligibilityRules:

    @patch('app.services.matching.get_route_info', return_value=MOCK_ROUTE)
    def test_closed_org_is_rejected(self, mock_route):
        donation = FakeDonation()
        org = FakeOrg(name="Closed Org", is_open=False)
        result = evaluate_candidates(donation, [org])
        assert result["eligible_count"] == 0
        assert result["rejected_count"] == 1
        reason = result["rejected_candidates"][0]["reasons"][0]
        assert "closed" in reason.lower()

    @patch('app.services.matching.get_route_info', return_value=MOCK_ROUTE)
    def test_insufficient_capacity_is_rejected(self, mock_route):
        donation = FakeDonation(quantity=40)
        org = FakeOrg(name="Small Org", capacity_available=15)
        result = evaluate_candidates(donation, [org])
        assert result["eligible_count"] == 0
        assert result["rejected_count"] == 1
        reason = result["rejected_candidates"][0]["reasons"][0]
        assert "capacity" in reason.lower() or "insufficient" in reason.lower()

    @patch('app.services.matching.get_route_info', return_value=MOCK_ROUTE)
    def test_food_incompatibility_is_rejected(self, mock_route):
        donation = FakeDonation(food_category="Cooked Meals")
        org = FakeOrg(name="Packaged Only", accepted_food_categories=["Packaged Food", "Dairy"])
        result = evaluate_candidates(donation, [org])
        assert result["eligible_count"] == 0
        assert result["rejected_count"] == 1
        reason = result["rejected_candidates"][0]["reasons"][0]
        assert "food category" in reason.lower() or "accepted" in reason.lower()

    @patch('app.services.matching.get_route_info', return_value={"distance_km": 5.0, "estimated_minutes": 60, "provider": "FALLBACK_ESTIMATE"})
    def test_delivery_after_safe_until_is_rejected(self, mock_route):
        # 50 minutes remaining, route takes 60 min + 15 buffer = 75 min → INFEASIBLE
        donation = FakeDonation(safe_until_offset_minutes=50)
        org = FakeOrg(name="Far Org", capacity_available=100)
        result = evaluate_candidates(donation, [org])
        assert result["eligible_count"] == 0
        assert result["rejected_count"] == 1
        reason = result["rejected_candidates"][0]["reasons"][0]
        assert "expiry" in reason.lower() or "safe" in reason.lower()

    @patch('app.services.matching.get_route_info', return_value=MOCK_ROUTE)
    def test_expired_donation_returns_error(self, mock_route):
        donation = FakeDonation(safe_until_offset_minutes=-10)  # already expired
        org = FakeOrg()
        result = evaluate_candidates(donation, [org])
        assert result["selected_match"] is None
        assert "expired" in result["error"].lower()

    @patch('app.services.matching.get_route_info', return_value=MOCK_ROUTE)
    def test_valid_candidate_is_eligible(self, mock_route):
        donation = FakeDonation(quantity=40, safe_until_offset_minutes=180)
        org = FakeOrg(capacity_available=100, accepted_food_categories=["Cooked Meals"])
        result = evaluate_candidates(donation, [org])
        assert result["eligible_count"] == 1
        assert result["selected_match"] is not None
        assert result["selected_match"]["organization_name"] == org.name


# ---------------------------------------------------------------------------
# Multi-candidate scoring tests
# ---------------------------------------------------------------------------

class TestMultiCandidateScoring:

    @patch('app.services.matching.get_route_info', return_value=MOCK_ROUTE)
    def test_best_score_is_selected(self, mock_route):
        """High-need org should beat a similar-distance org with lower need."""
        donation = FakeDonation(food_category="Cooked Meals", quantity=10)
        org_high_need = FakeOrg(name="High Need", current_needs=["Cooked Meals"], capacity_available=100)
        org_low_need = FakeOrg(name="Low Need", current_needs=["Dairy"], capacity_available=100)
        result = evaluate_candidates(donation, [org_low_need, org_high_need])
        assert result["selected_match"]["organization_name"] == "High Need"

    @patch('app.services.matching.get_route_info', return_value=MOCK_ROUTE)
    def test_no_viable_match_returns_none(self, mock_route):
        donation = FakeDonation(quantity=500)  # Huge quantity nobody can fit
        org = FakeOrg(name="Small Org", capacity_available=10)
        result = evaluate_candidates(donation, [org])
        assert result["selected_match"] is None

    @patch('app.services.matching.get_route_info', return_value=MOCK_ROUTE)
    def test_rejected_candidates_preserved(self, mock_route):
        donation = FakeDonation(quantity=40)
        good_org = FakeOrg(name="Good Org", capacity_available=100)
        bad_org = FakeOrg(name="Bad Org", is_open=False, capacity_available=200)
        result = evaluate_candidates(donation, [good_org, bad_org])
        assert result["eligible_count"] == 1
        assert result["rejected_count"] == 1
        assert result["rejected_candidates"][0]["organization_name"] == "Bad Org"

    @patch('app.services.matching.get_route_info', return_value=MOCK_ROUTE)
    def test_score_breakdown_returned(self, mock_route):
        donation = FakeDonation(quantity=20)
        org = FakeOrg(capacity_available=100)
        result = evaluate_candidates(donation, [org])
        assert result["selected_match"] is not None
        breakdown = result["selected_match"]["score_breakdown"]
        for key in ("distance", "capacity", "food_compatibility", "need", "urgency", "driver"):
            assert key in breakdown

    @patch('app.services.matching.get_route_info', return_value=MOCK_ROUTE)
    def test_scoring_is_deterministic(self, mock_route):
        """Same inputs must produce same score."""
        donation = FakeDonation(quantity=20)
        org = FakeOrg(capacity_available=100)
        r1 = evaluate_candidates(donation, [org])
        r2 = evaluate_candidates(donation, [org])
        assert r1["selected_match"]["score"] == r2["selected_match"]["score"]

    @patch('app.services.matching.get_route_info', return_value=MOCK_ROUTE)
    def test_weight_sum_is_valid(self, mock_route):
        """Sanity: weights must sum to 1.0."""
        total = sum(WEIGHTS.values())
        assert abs(total - 1.0) < 1e-6

    @patch('app.services.matching.get_route_info', return_value=MOCK_ROUTE)
    def test_farther_org_wins_on_better_fit(self, mock_route):
        """
        An organization that is farther but has HIGH NEED and good capacity
        should beat a closer org with no declared need (if distance weight allows).
        We simulate this by injecting different route responses per org.
        """
        donation = FakeDonation(food_category="Cooked Meals", quantity=20)

        close_org = FakeOrg(name="Close No-Need Org", lat=26.8230, lng=75.8665, capacity_available=80, current_needs=[])
        far_org = FakeOrg(name="Far High-Need Org", lat=26.8833, lng=75.7999, capacity_available=80, current_needs=["Cooked Meals"])

        # Simulate close_org getting distance 0.5km/5min, far_org 5.0km/20min
        def mock_route_fn(origin_lat, origin_lng, dest_lat, dest_lng):
            if dest_lat == close_org.latitude:
                return {"distance_km": 0.5, "estimated_minutes": 5, "provider": "FALLBACK_ESTIMATE"}
            else:
                return {"distance_km": 5.0, "estimated_minutes": 20, "provider": "FALLBACK_ESTIMATE"}

        with patch('app.services.matching.get_route_info', side_effect=mock_route_fn):
            result = evaluate_candidates(donation, [close_org, far_org])

        # Both should be eligible; the result may differ, but the algorithm must make a REAL decision
        # (not simply always pick closest)
        assert result["eligible_count"] == 2
        winner = result["selected_match"]["organization_name"]
        # The need score (15% weight) adds significant weight for the far org.
        # Expected: Far High-Need Org wins due to need_score=100 vs 50
        assert winner == "Far High-Need Org"
