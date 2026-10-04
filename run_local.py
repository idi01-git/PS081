"""Start the local React frontend and Python FastAPI backend together."""

from __future__ import annotations

import subprocess
import sys
import time
import urllib.request
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
API_URL = "http://127.0.0.1:8000/api/status"
WEB_URL = "http://localhost:5173"


def start_process(command: list[str], cwd: Path) -> subprocess.Popen:
    return subprocess.Popen(command, cwd=cwd)


def backend_is_ready() -> bool:
    try:
        with urllib.request.urlopen(API_URL, timeout=2) as response:
            return response.status == 200
    except (OSError, urllib.error.URLError):
        return False


def main() -> int:
    if not (BACKEND / "api.py").exists():
        print(f"Backend not found: {BACKEND}", file=sys.stderr)
        return 1
    if not (FRONTEND / "package.json").exists():
        print(f"Frontend not found: {FRONTEND}", file=sys.stderr)
        return 1

    processes: list[subprocess.Popen] = []
    try:
        print("Starting FastAPI backend at http://127.0.0.1:8000 ...")
        processes.append(start_process([sys.executable, "api.py"], BACKEND))

        print("Starting React/Vite frontend at http://localhost:5173 ...")
        npm = "npm.cmd" if sys.platform == "win32" else "npm"
        processes.append(start_process([npm, "run", "dev"], FRONTEND))

        for _ in range(20):
            if backend_is_ready():
                print("Backend is ready.")
                break
            time.sleep(1)
        else:
            print("Warning: backend did not respond within 20 seconds.")

        print("Opening the application. Press Ctrl+C to stop both services.")
        webbrowser.open(WEB_URL)

        while all(process.poll() is None for process in processes):
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping local services...")
    finally:
        for process in processes:
            if process.poll() is None:
                process.terminate()
        for process in processes:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
