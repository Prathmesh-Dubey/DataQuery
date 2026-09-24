# Run once after cloning: sets up the backend venv and installs dependencies.
# Usage (from the backend folder):  .\setup.ps1

if (-not (Test-Path ".\venv")) {
    python -m venv venv
}

.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r requirements.txt

if (-not (Test-Path ".\.env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created backend\.env from .env.example - fill in your real values before running the server."
}

Write-Host "Done. Next: .\venv\Scripts\Activate.ps1  then  uvicorn main:app --reload"
