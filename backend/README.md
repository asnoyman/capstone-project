# Running the backend

Requirements:

- Python
- Pip

## First time setup

### 1. Setup virtual environment

We use this to ensure consistent python modules.

1. In a terminal, run: `python3 -m venv venv`
2. In a terminal, run: `source venv/bin/activate`
3. In a terminal, run: `python3 -m pip install -r requirements.txt`

In order to deactivate the virtual environment:

1. If you installed any new packages, run: `python3 -m pip freeze > requirements.txt`
2. run: `deactivate`

### 2. Install Docker

Docker is a system for creating lightweight virtual machines. You can use online templates to quickly setup a virtual machine with only the systems you need. We're going to use docker to run our Postgres server, so we can easily get running on our local machines or inside the virtual machine we need for final demo.

Install docker [here](https://www.docker.com/)

## Running backend

__Update__: There is now a script `start_backend.sh` that runs all of the following. Note that you
still need to make sure you have docker open in background. To use, run `bash start_backend.sh` in
the backend directory.

To run the backend, do the following:

1. Activate python virtual environment: `source venv/bin/activate`
    - Make sure up to date with required python modules: `python3 -m pip install -r requirements.txt`

2. Turn on Postgres docker container: `docker-compose up -d`.
    - Note: Make sure docker is running in the background (i.e open the docker app you installed)

3. Start backend: `python3 -m app.main <-d|--debug>`
    - Can add the optional `--debug` flag to run backend in debug mode, where the server automatically restarts after any code changes

You can now:

- Access backend at <localhost:8000>
  - Swagger docs can be found at <localhost:8000/docs>
- Access database manager at <localhost:8081>
  - Login with:
    - System = PostgreSQL
    - Server = database
    - Username = user
    - Password = pass
    - database = car_rental_db

## Shuting down backend

1. Shutdown backend server: `Ctrl + C`

2. Turn off docker container: `docker-compose stop`

3. Turn off python virtual environment: `deactivate`

## Reseting database

After changes to database schema, you will usually need to wipe the database and rebuild it.

To do this:

1. Destroy docker container: `docker-compose down`

2. Reinitialise docker container: `docker-compose up -d`

There is probably a better way of doing this then wiping everything but this will work for now.
