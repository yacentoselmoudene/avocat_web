# avocat_web

Run this project with Docker Compose (Django + MySQL) for local development.

Quick start
- Install Docker Desktop (Windows/macOS) or Docker Engine + Compose.
- In the project root, create your environment file:
  - Copy .env.example to .env and keep defaults or adjust values.
- Build and start the stack:
  - docker compose up --build
- Open the API in your browser at:
  - http://localhost:8000/

What this does
- Spins up three services:
  - db: MySQL 8 with a persistent volume
  - web: Django dev server (runserver) on port 8000
  - phpmyadmin: Web UI for MySQL on port 8080
- On startup, the web service waits for the database, runs migrations, collects static files, then serves the app.

Useful commands
- Start (foreground):
  - docker compose up --build
- Start (detached):
  - docker compose up -d --build
- Stop:
  - docker compose down
- View logs:
  - docker compose logs -f web
- Create a Django superuser (after containers are up):
  - docker compose exec web python manage.py createsuperuser

Configuration
- Environment variables are read from .env and passed to both services via docker-compose.yml.
- Default DB credentials (from .env.example):
  - DB_NAME=cabinetavocat
  - DB_USER=avocat
  - DB_PASSWORD=avocatpass
  - DB_ROOT_PASSWORD=rootpass
- Django runs with DJANGO_ENV=development and DEBUG enabled.
- Allowed hosts are configured to allow * in development.

Project ports and volumes
- Web: http://localhost:8000
- phpMyAdmin: http://localhost:8080 (web UI for the database)
- MySQL: not exposed on the host by default (avoids port 3306 conflicts). If needed, add a ports mapping to the db service (e.g., "3307:3306") for tools like MySQL Workbench.
- MySQL data is persisted in a named Docker volume: db_data
- Your project directory is mounted into the web container, enabling live code reloads.

Notes
- The Django settings were adjusted to allow database configuration via environment variables even in development, so Compose can point Django to the db container.
- Static files are served by WhiteNoise; collectstatic runs automatically at container start.
- Media uploads are stored in the project media/ folder (bind-mounted via the project directory).

Troubleshooting
- If MySQL fails to start due to leftover data (e.g., schema conflicts from prior runs), remove the volume:
  - docker compose down -v
  - Then start again: docker compose up --build
- If port 3306 or 8000 is already in use, stop the other service or change the mapping in docker-compose.yml.
- On first run, migrations will create the schema. Create an admin user with the createsuperuser command shown above.

Frontend (React + Vite)
- A frontend service is included in docker-compose. It runs the Vite dev server on http://localhost:5173.
- It is wired to the Django API via the VITE_API_URL environment variable.
  - In Compose, it defaults to http://web:8000 (the service name of the Django container).
  - For local (non-Docker) runs, set VITE_API_URL=http://localhost:8000 in your .env.

Usage
- Start all services (db, web, frontend, phpmyadmin):
  - docker compose up --build
- Open the frontend:
  - http://localhost:5173
- Open phpMyAdmin:
  - http://localhost:8080
  - Login with DB_USER/DB_PASSWORD from your .env (defaults: avocat / avocatpass)
  - Or login as root with DB_ROOT_PASSWORD (default: rootpass)
- Frontend logs:
  - docker compose logs -f frontend

Notes
- Hot reloading is enabled; changes in frontend/ trigger instant updates.
- Node modules are stored inside the container in a dedicated volume (frontend_node_modules).
- If you install new npm packages, the container will re-run npm ci on next start; or run inside the container:
  - docker compose exec frontend sh -lc "npm install <pkg>"

# avocat_web

Run this project with Docker Compose (Django + MySQL) for local development.

Quick start
- Install Docker Desktop (Windows/macOS) or Docker Engine + Compose.
- In the project root, create your environment file:
  - Copy .env.example to .env and keep defaults or adjust values.
- Build and start the stack:
  - docker compose up --build
- Open the API in your browser at:
  - http://localhost:8000/

What this does
- Spins up three services:
  - db: MySQL 8 with a persistent volume
  - web: Django dev server (runserver) on port 8000
  - phpmyadmin: Web UI for MySQL on port 8080
- On startup, the web service waits for the database, runs migrations, collects static files, then serves the app.

Useful commands
- Start (foreground):
  - docker compose up --build
- Start (detached):
  - docker compose up -d --build
- Stop:
  - docker compose down
- View logs:
  - docker compose logs -f web
- Create a Django superuser (after containers are up):
  - docker compose exec web python manage.py createsuperuser

Configuration
- Environment variables are read from .env and passed to both services via docker-compose.yml.
- Default DB credentials (from .env.example):
  - DB_NAME=cabinetavocat
  - DB_USER=avocat
  - DB_PASSWORD=avocatpass
  - DB_ROOT_PASSWORD=rootpass
- Django runs with DJANGO_ENV=development and DEBUG enabled.
- Allowed hosts are configured to allow * in development.

Project ports and volumes
- Web: http://localhost:8000
- phpMyAdmin: http://localhost:8080 (web UI for the database)
- MySQL: not exposed on the host by default (avoids port 3306 conflicts). If needed, add a ports mapping to the db service (e.g., "3307:3306") for tools like MySQL Workbench.
- MySQL data is persisted in a named Docker volume: db_data
- Your project directory is mounted into the web container, enabling live code reloads.

Notes
- The Django settings were adjusted to allow database configuration via environment variables even in development, so Compose can point Django to the db container.
- Static files are served by WhiteNoise; collectstatic runs automatically at container start.
- Media uploads are stored in the project media/ folder (bind-mounted via the project directory).

Troubleshooting
- If MySQL fails to start due to leftover data (e.g., schema conflicts from prior runs), remove the volume:
  - docker compose down -v
  - Then start again: docker compose up --build
- If port 3306 or 8000 is already in use, stop the other service or change the mapping in docker-compose.yml.
- On first run, migrations will create the schema. Create an admin user with the createsuperuser command shown above.

Frontend (React + Vite)
- A frontend service is included in docker-compose. It runs the Vite dev server on http://localhost:5173.
- It is wired to the Django API via the VITE_API_URL environment variable.
  - In Compose, it defaults to http://web:8000 (the service name of the Django container).
  - For local (non-Docker) runs, set VITE_API_URL=http://localhost:8000 in your .env.

Usage
- Start all services (db, web, frontend, phpmyadmin):
  - docker compose up --build
- Open the frontend:
  - http://localhost:5173
- Open phpMyAdmin:
  - http://localhost:8080
  - Login with DB_USER/DB_PASSWORD from your .env (defaults: avocat / avocatpass)
  - Or login as root with DB_ROOT_PASSWORD (default: rootpass)
- Frontend logs:
  - docker compose logs -f frontend

Notes
- Hot reloading is enabled; changes in frontend/ trigger instant updates.
- Node modules are stored inside the container in a dedicated volume (frontend_node_modules).
- If you install new npm packages, the container will re-run npm ci on next start; or run inside the container:
  - docker compose exec frontend sh -lc "npm install <pkg>"

Changing ports
- You can change the ports exposed on your host without editing compose YAML by setting variables in .env:
  - WEB_HOST_PORT: host port for the Django dev server (default 8000)
  - FRONTEND_HOST_PORT: host port for Vite dev server (default 5173)
  - PHPMYADMIN_HOST_PORT: host port for phpMyAdmin (default 8080)
- Example (PowerShell):
  - echo "WEB_HOST_PORT=8001" >> .env
  - echo "FRONTEND_HOST_PORT=5174" >> .env
  - echo "PHPMYADMIN_HOST_PORT=8081" >> .env
  - docker compose up -d --build
- Notes:
  - Inside the Docker network, services still talk to each other on their container ports (web:8000, db:3306). You do not need to change VITE_API_URL when only changing host ports.
  - If you need MySQL on your host, add a mapping under the db service (e.g., ports: ["3307:3306"]) or create a docker-compose.override.yml with that mapping to avoid committing it.
  - If a port is already in use, pick another and update .env accordingly.
