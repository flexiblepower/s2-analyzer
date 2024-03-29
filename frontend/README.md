# S2-Analyzer Frontend

This project involves the development of a frontend to TNO’s S2-Analyzer.

## Table of Contents

- [Project Description](#project-description)
- [Running the Application](#running-the-application)
    - [Prerequisites](#prerequisites)
    - [Setting Up the Backend](#setting-up-the-backend)
    - [Setting Up the Frontend](#setting-up-the-frontend)

## Project Description

S2-Analyzer is a program that verifies and logs messages exchanged between two devices (namely a Resource Manager and a Client Energy Manager) as defined by the S2 Standard and its FRBC (Fill Rate Based Control) Control Type. In this project, we developed Single Page Application to visualize connection histories and adding additional features such as filtering capabilities.

## Running the Application

### Prerequisites

To run the backend, you need to have *Docker* (and *Python* environment if it is necessary).

To run the frontend, you need to have *Node.js* and *npm*.

### Setting up the Backend

To set up and run the S2 analyzer backend:

```bash
docker-compose up --build
```

This will build the backend to container images locally and run them. The backend is available on port `8001`.

For more information to set up the backend, you can check the backend's [README](/README.md
) file.

### Setting up the Frontend

To install the dependencies for the frontend, you need to run the following commands:

```bash
cd ./frontend/
npm install 
```

This will navigate you to the *frontend* folder and install all dependencies that you need to run the frontend.

After that, you need to run the following command when you are in the *frontend* folder:

```bash
npm run dev
```

This will build and run the frontend. You can access the frontend by clicking [http://localhost:5173/](#http://localhost:5173/).



