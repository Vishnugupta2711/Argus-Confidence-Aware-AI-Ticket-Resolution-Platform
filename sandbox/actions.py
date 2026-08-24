from typing import Dict, Any
from environment import SandboxEnvironment


def normalize_target(target: str) -> str:
    return target.split("@")[0] if "@" in target else target


def unlock_account(env: SandboxEnvironment, target: str) -> Dict[str, Any]:
    target = normalize_target(target)
    if target not in env.users:
        return {"success": False, "message": f"User {target} not found."}

    # Even if they aren't locked, it's successful (idempotent)
    env.users[target]["status"] = "active"
    return {"success": True, "message": f"Account {target} unlocked successfully."}


def reset_password(env: SandboxEnvironment, target: str) -> Dict[str, Any]:
    target = normalize_target(target)
    if target not in env.users:
        return {"success": False, "message": f"User {target} not found."}

    env.users[target]["password_expired"] = False
    return {"success": True, "message": f"Password for {target} reset successfully."}


def restart_service(env: SandboxEnvironment, target: str) -> Dict[str, Any]:
    if target not in env.services:
        return {"success": False, "message": f"Service {target} not found."}

    env.services[target] = "running"
    return {"success": True, "message": f"Service {target} restarted successfully."}


def grant_permission(
    env: SandboxEnvironment, target: str, permission: str
) -> Dict[str, Any]:
    target = normalize_target(target)
    if target not in env.users:
        return {"success": False, "message": f"User {target} not found."}

    if target not in env.permissions:
        env.permissions[target] = []

    if permission not in env.permissions[target]:
        env.permissions[target].append(permission)

    return {"success": True, "message": f"Granted {permission} to {target}."}


def install_software(env: SandboxEnvironment, target: str) -> Dict[str, Any]:
    # Mocking a software installation via script or MDM push
    return {
        "success": True,
        "message": f"Successfully queued installation for {target}.",
    }


def clear_cache(env: SandboxEnvironment, target: str) -> Dict[str, Any]:
    return {"success": True, "message": f"Cache cleared for {target}."}


def reset_sap_credentials(env: SandboxEnvironment, target: str) -> Dict[str, Any]:
    return {"success": True, "message": f"SAP credentials reset for {target}."}


# Mapping of action strings to handler functions
ACTION_HANDLERS = {
    "unlock_account": unlock_account,
    "reset_password": reset_password,
    "restart_service": restart_service,
    "grant_permission": grant_permission,
    "install_software": install_software,
    "clear_cache": clear_cache,
    "reset_sap_credentials": reset_sap_credentials,
    "unknown": lambda env, target: {"success": False, "message": "Unknown action"},
}
