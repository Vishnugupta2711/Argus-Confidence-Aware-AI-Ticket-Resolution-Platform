from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from environment import env
from actions import ACTION_HANDLERS
from logs import logger

app = FastAPI(
    title="Argus Sandbox API",
    description="Isolated mock environment for AI agent action testing.",
)


@app.get("/health")
async def health_check():
    return {"status": "operational"}


class ActionRequest(BaseModel):
    action: str
    target: str
    params: Optional[Dict[str, Any]] = None


@app.post("/sandbox/execute")
async def execute_action(request: ActionRequest):
    """
    Executes a specific action against the mock environment.
    """
    if request.action not in ACTION_HANDLERS:
        logger.add_log(
            request.action, request.target, False, "Unknown action requested."
        )
        raise HTTPException(
            status_code=400, detail=f"Action '{request.action}' not supported."
        )

    handler = ACTION_HANDLERS[request.action]

    try:
        if request.action == "grant_permission":
            # Extra param handling for grant
            permission = request.params.get("permission") if request.params else None
            if not permission:
                result = {"success": False, "message": "Missing 'permission' param."}
            else:
                result = handler(env, request.target, permission)
        else:
            result = handler(env, request.target)

        logger.add_log(
            request.action, request.target, result["success"], result["message"]
        )
        return result

    except Exception as e:
        logger.add_log(request.action, request.target, False, str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sandbox/status")
async def get_status():
    """Returns the current mock environment state."""
    return env.get_state()


@app.post("/sandbox/reset")
async def reset_sandbox():
    """Resets the environment to its initial state and clears logs."""
    env.reset()
    logger.clear()
    return {"message": "Sandbox environment has been reset."}


@app.get("/sandbox/logs")
async def get_logs():
    """Returns the execution history log."""
    return logger.get_logs()
