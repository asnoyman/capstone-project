# Script to start backend

source venv/bin/activate
python3 -m pip install -r requirements.txt
docker-compose up -d
python3 -m app.main