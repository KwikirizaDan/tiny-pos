from fastapi import APIRouter, Depends, HTTPException, status
from celery.result import AsyncResult
from app.celery_app import celery
from app.dependencies import verify_api_key
from app.tasks.report import generate_and_send
from app.tasks.low_stock import check_low_stock
from pydantic import BaseModel

router = APIRouter(dependencies=[Depends(verify_api_key)])


class TriggerResponse(BaseModel):
    task_id: str
    message: str = "Report generation queued"


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: dict | None = None


@router.post("/trigger-report", response_model=TriggerResponse)
def trigger_report():
    task = generate_and_send.delay()
    return TriggerResponse(task_id=task.id)


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
def task_status(task_id: str):
    result = AsyncResult(task_id, app=celery)
    if result.failed():
        return TaskStatusResponse(
            task_id=task_id,
            status="FAILURE",
            result={"error": str(result.result)},
        )
    return TaskStatusResponse(
        task_id=task_id,
        status=result.state,
        result=result.result if result.ready() else None,
    )


@router.post("/trigger-low-stock-check", response_model=TriggerResponse)
def trigger_low_stock_check():
    task = check_low_stock.delay()
    return TriggerResponse(task_id=task.id, message="Low-stock check queued")


@router.get("/health")
def health():
    return {"status": "ok"}
