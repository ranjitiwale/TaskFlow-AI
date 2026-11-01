
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

# Load environment variables from backend/.env
load_dotenv()

app = FastAPI(
    title="TaskFlow AI API",
    description="Backend API for the TaskFlow AI productivity planner",
    version="1.0.0",
)

# Allow the Vite development server to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Task(BaseModel):
    id: int | str | None = None
    title: str = Field(..., min_length=1, max_length=300)
    description: str = ""
    priority: str = "Medium"
    dueDate: str = ""
    completed: bool = False


class ScheduleRequest(BaseModel):
    goal: str = Field(..., min_length=1, max_length=3000)
    tasks: list[Task] = Field(default_factory=list)


class ScheduleResponse(BaseModel):
    schedule: str
    source: str


@app.get("/")
def home() -> dict[str, str]:
    return {
        "message": "TaskFlow AI API is running",
        "status": "ok",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.post("/schedule", response_model=ScheduleResponse)
def generate_schedule(request: ScheduleRequest) -> dict[str, str]:
    """
    Generate a daily plan using OpenAI.
    The API key stays on the backend and is never sent to the frontend.
    """

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("OPENAI_MODEL", "gpt-5-mini").strip()

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "OPENAI_API_KEY is not configured. "
                "Add your key to backend/.env and restart the backend."
            ),
        )

    pending_tasks: list[dict[str, Any]] = [
        task.model_dump()
        for task in request.tasks
        if not task.completed
    ]

    task_text = "\n".join(
        (
            f"- {task['title']} | "
            f"Priority: {task['priority']} | "
            f"Due date: {task.get('dueDate') or 'Not specified'} | "
            f"Details: {task.get('description') or 'None'}"
        )
        for task in pending_tasks
    )

    if not task_text:
        task_text = "No pending tasks have been added yet."

    prompt = f"""
You are TaskFlow AI, a practical productivity assistant.

Create a realistic daily schedule based on the user's goal and pending tasks.

User's goal:
{request.goal}

Pending tasks:
{task_text}

Instructions:
1. Respond in the same language as the user's goal when possible.
2. Prioritize high-priority and urgent tasks.
3. Arrange activities in a sensible order.
4. Include suggested time blocks when appropriate.
5. Include short breaks and avoid an unrealistic workload.
6. Clearly explain what to do first.
7. Do not claim that tasks are completed.
8. Use readable headings and numbered steps.
"""

    try:
        client = OpenAI(api_key=api_key)

        response = client.responses.create(
            model=model,
            input=prompt,
        )

        schedule = (response.output_text or "").strip()

        if not schedule:
            raise HTTPException(
                status_code=502,
                detail="The AI returned an empty schedule. Please try again.",
            )

        return {
            "schedule": schedule,
            "source": "openai",
        }

    except HTTPException:
        raise

    except Exception as exc:
        # Avoid exposing credentials or internal error details to the client.
        print(f"Schedule generation failed: {type(exc).__name__}")

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to generate the AI schedule. "
                "Check your API key, model name, internet connection, "
                "and OpenAI API access."
            ),
        ) from None
