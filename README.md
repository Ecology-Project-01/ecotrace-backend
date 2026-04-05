# EcoTrace Backend

This is the backend service for the EcoTrace application, built with Node.js, Express, and TypeScript. It provides APIs for user authentication and observation management.

## Table of Contents

-   [Features](#features)
-   [Prerequisites](#prerequisites)
-   [Installation](#installation)
-   [Configuration](#configuration)
-   [Running the Server](#running-the-server)
-   [API Endpoints](#api-endpoints)
-   [Project Structure](#project-structure)

## Features

-   **User Authentication**: Secure signup and login using JWT and Bcrypt.
-   **Observation Management**: Create and retrieve environmental observations.
-   **Security**: Implemented using Helmet, CORS, and Rate Limiting.
-   **Database**: MongoDB integration via Mongoose.
-   **TypeScript**: Type-safe development environment.

## Prerequisites

Before running this project, ensure you have the following installed:

-   [Node.js](https://nodejs.org/) (v14 or higher recommended)
-   [npm](https://www.npmjs.com/) (usually comes with Node.js)
-   [MongoDB](https://www.mongodb.com/) (local instance or MongoDB Atlas cluster)

## Installation

1.  Navigate to the backend directory:

    ```bash
    cd backend
    ```

2.  Install the dependencies:

    ```bash
    npm install
    ```

## Configuration

Create a `.env` file in the root of the `backend` directory and add the following environment variables:

```env
PORT=5000                   # Port number for the server
MONGO_URI=your_mongodb_uri  # MongoDB connection string
JWT_SECRET=your_jwt_secret  # Secret key for JWT signing
```

> **Note**: Ensure `MONGO_URI` points to a valid MongoDB instance. The `JWT_SECRET` should be a strong, unique string.

## Running the Server

### Development Mode

To run the server with `nodemon` for hot-reloading:

```bash
npm run dev
```

### Production Mode

To run the server using `ts-node`:

```bash
npm start
```

The server will start on the port specified in your `.env` file (default is usually 5000). You will see the local and network addresses in the console output.

## API Endpoints

Full reference (all routes, **request bodies**, **query params**, and **headers**): **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**.

Summary:

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/` | Health check |
| `POST` | `/system-init/superadmin` | First-time superadmin setup |
| `GET` | `/system-init/getAllUsers` | Bearer — admin / superadmin |
| `POST` | `/auth/signup` | Register |
| `POST` | `/auth/login` | JWT |
| `POST` | `/auth/reset-password` | Self-service password reset |
| `PUT` | `/auth/changeUsername` | Bearer |
| `POST` | `/auth/deleteUser`, `/addToOrg`, `/removeFromOrg`, `/promoteToAdmin` | Bearer — admin / superadmin |
| `POST` | `/auth/demoteToUser` | Bearer — superadmin only |
| `POST` | `/observations` | Bearer — create observation |
| `GET` | `/observations` | Bearer — list (pagination + filters) |
| `POST` | `/trips` | Bearer — save GPS trip for the org |
| `GET` | `/trips` | Bearer — list org trips |
| `GET` | `/trips/:id` | Bearer — trip detail |
| `DELETE` | `/trips/:id` | Bearer — delete trip |

## Project Structure

```
backend/
├── config/             # Configuration files (Database connection, etc.)
├── models/             # Mongoose models (User, Observation)
├── node_modules/       # Project dependencies
├── .env                # Environment variables (not committed to git)
├── .gitignore          # Git ignore file
├── package.json        # Project metadata and scripts
├── server.ts           # Entry point of the application
└── tsconfig.json       # TypeScript configuration
```

## License

This project is licensed under the ISC License.
