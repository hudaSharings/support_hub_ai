from src.tools.local.toolkit import get_subscription_state, get_entitlement_status


def test_subscription_tool():
    result = get_subscription_state("org-pro")
    assert result.success
    assert result.findings["plan"] == "team"


def test_entitlement_tool():
    result = get_entitlement_status("org-pro", "advanced_security")
    assert result.findings["enabled"] is True
