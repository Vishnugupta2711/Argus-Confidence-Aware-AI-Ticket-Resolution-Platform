from typing import Any, Dict
from utils.cluster_map import get_resolution_cluster

# Hardcoded action map for known resolution clusters mapped to Sandbox commands.
ACTION_MAP = {
    "password_reset": "reset_password",
    "account_unlock": "unlock_account",
    "cache_clear": "clear_cache",
    "service_restart": "restart_service",
    "grant_access": "grant_permission",
    "install_software": "install_software",
    "sap_credential_reset": "reset_sap_credentials",
    "sso_token_refresh": "clear_cache",
    "network_driver_update": "restart_service",
    "network_flush": "restart_service",
    "vpn_reconnect": "restart_service",
    "printer_restart": "restart_service",
    "email_restore": "restart_service",
}

# Resolution text keyword → (sandbox action, service name hint)
KEYWORD_ACTION_MAP = [
    (["reset_password", "reset password", "password reset"], "reset_password", None),
    (["unlock_account", "unlock account", "account unlock"], "unlock_account", None),
    (["flush", "flushdns", "dns", "network adapter", "adapter driver", "network"], "restart_service", "Network"),
    (["vpn", "remote access"], "restart_service", "VPN"),
    (["printer", "print spooler"], "restart_service", "Printer"),
    (["email", "mailbox", "outlook"], "restart_service", "Email"),
    (["sap", "credential"], "reset_sap_credentials", None),
    (["restart", "reboot", "service restart", "restart service"], "restart_service", None),
    (["install", "reinstall", "software"], "install_software", None),
    (["permission", "grant access", "access right"], "grant_permission", None),
    (["clear cache", "clear_cache", "token refresh", "sso"], "clear_cache", None),
]

# Category → default service name for restart_service actions
CATEGORY_SERVICE_MAP = {
    "Network/Connectivity": "Network",
    "VPN Problems": "VPN",
    "Printer Issues": "Printer",
    "Email Access": "Email",
    "SAP Issues": "SAP",
    "Auth/SSO": "Active Directory",
    "Software Install": "Software Portal",
    "Permissions/Access": "Active Directory",
}


def _action_from_text(text: str, category: str = "") -> tuple:
    """Derive (sandbox action, target hint) from resolution text keywords."""
    lower = text.lower()
    for keywords, action, service_hint in KEYWORD_ACTION_MAP:
        if any(kw in lower for kw in keywords):
            return action, service_hint
    # Fallback: derive service from category
    service = CATEGORY_SERVICE_MAP.get(category, "Network")
    return "restart_service", service


def map_resolution_to_action(qdrant_top_result: Any, cluster_map: Dict[str, str], ticket_email: str, category: str = "") -> Dict[str, str]:
    """
    Translates a historical resolution string into a concrete API action payload
    that can be executed against the sandbox environment.
    """
    if not qdrant_top_result:
        service = CATEGORY_SERVICE_MAP.get(category, "Network")
        return {"action": "restart_service", "target": service, "resolution": "", "cluster_id": "unknown"}

    payload = getattr(qdrant_top_result, "payload", {})
    historical_resolution = payload.get("resolution", "")
    res_category = payload.get("category", category) or category
    
    # First try: look up via cluster_map
    cluster_id = get_resolution_cluster(historical_resolution, cluster_map)
    
    # Use stored cluster if cluster_map lookup returned generic fallback
    stored_cluster = payload.get("resolution_cluster", "")
    if cluster_id in ("unknown_cluster", "agent_verified", "") and stored_cluster and stored_cluster not in ("agent_verified", ""):
        cluster_id = stored_cluster

    sandbox_action = ACTION_MAP.get(cluster_id)
    target = ticket_email  # default for user-targeted actions
    
    if not sandbox_action:
        # Fuzzy fallback by cluster_id string
        if "reset" in cluster_id or "password" in cluster_id:
            sandbox_action = "reset_password"
        elif "unlock" in cluster_id:
            sandbox_action = "unlock_account"
        elif "clear" in cluster_id or "flush" in cluster_id or "cache" in cluster_id:
            sandbox_action = "clear_cache"
        elif "reinstall" in cluster_id or "install" in cluster_id or "software" in cluster_id:
            sandbox_action = "install_software"
        elif "permission" in cluster_id or "role" in cluster_id or "access" in cluster_id:
            sandbox_action = "grant_permission"
        elif "network" in cluster_id or "vpn" in cluster_id or "printer" in cluster_id or "email" in cluster_id or "service" in cluster_id:
            sandbox_action = "restart_service"
            target = CATEGORY_SERVICE_MAP.get(res_category, "Network")
        else:
            # Last resort: derive from resolution text
            sandbox_action, service_hint = _action_from_text(historical_resolution, res_category)
            if service_hint:
                target = service_hint

    # For service-targeted actions, override target with appropriate service name
    if sandbox_action == "restart_service" and target == ticket_email:
        target = CATEGORY_SERVICE_MAP.get(res_category, "Network")
    elif sandbox_action in ("reset_password", "unlock_account", "clear_cache", "grant_permission", "install_software", "reset_sap_credentials"):
        # These are user-targeted; normalize email to username format for sandbox
        if "@" in ticket_email:
            target = ticket_email.split("@")[0]  # e.g. "john.doe"
        else:
            target = ticket_email

    return {
        "action": sandbox_action,
        "target": target,
        "resolution": historical_resolution,
        "cluster_id": cluster_id
    }
