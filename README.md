# Car Space Rental System Project

Proposal doc: <https://docs.google.com/document/d/1hYXF-k2Xbd1SDPc_ocU8iI0ejM6nJsaBiiPByNurHiM/edit>

## Running the project on VM

Tested using VMWare Workstation 16 Player. Follow guide here to setup [here](https://moodle.telt.unsw.edu.au/mod/resource/view.php?id=5606517).

### Requirements

First, download/clone the project repo, [here](https://github.com/unsw-cse-comp3900-9900-23T1/capstone-project-3900w16cskar)

The backend requires the following.

1. Install curl:

    ```bash
    sudo apt update
    sudo apt install curl
    ```

2. Install docker:

    ```bash
    curl -sSL https://get.docker.com/ | sudo sh
    ```

3. Install Pip:

    ```bash
    sudo apt install python3-pip
    ```

4. Install venv

    ```bash
    sudo apt install python3.8-venv
    ```

5. Setup the Python virtual environment:
    Ensure that the current working directory is `capstone-project-3900w16cskar/backend`, then run the following:

    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip3 install -r requirements.txt
    ```

The frontend requires the following:

1. Install nvm:

    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
    ```

    __After closing and reopening the terminal__, you should be able to run `nvm --version`.
    If this does not work, follow the installation and troubleshooting guide, [here](https://github.com/nvm-sh/nvm#installing-and-updating).

2. Install Node.js and npm:

    ```bash
    nvm install --lts
    ```

3. Install frontend dependencies:

    Ensure that the current working directory is `capstone-project-3900w16cskar/frontend`.

    Run the following:

    ```bash
    npm config set legacy-peer-deps true
    npm install
    ```

### Running the project

1. Start the backend:

    - Ensure that the current working directory is `capstone-project-3900w16cskar/backend`

    - Activate the virtual environment (if not currently active):

        ```bash
        source venv/bin/activate
        ```

    - Start the docker container:

        ```bash
        sudo docker compose up -d
        ```

    - Start backend:

        ```bash
        python3 -m app.main
        ```

2. Start the frontend:

    - Ensure that the current working directory is `capstone-project-3900w16cskar/frontend`
    - Start frontend:

        ```bash
        npm start
        ```

    - Can now view website at <localhost:3000>
