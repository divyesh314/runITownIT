# RunOwn Backend

## Overview
RunOwn is a Rails-based backend application designed to support a fitness platform that integrates territory challenges, user management, and blockchain rewards. This README provides an overview of the project structure, setup instructions, and API documentation.

## Project Structure
- **app/**: Contains the main application code.
  - **controllers/**: Manages the application logic and handles requests.
    - `application_controller.rb`: Base controller for shared functionality.
    - `users_controller.rb`: Manages user-related actions (create, update, delete).
    - `territories_controller.rb`: Handles territory actions (create, claim, index).
    - `runs_controller.rb`: Manages run actions (start, verify, index).
    - `challenges_controller.rb`: Handles challenge actions (create, accept, index).
  - **models/**: Represents the data and business logic.
    - `user.rb`: User model with properties like name, email, and password.
    - `territory.rb`: Territory model with properties like name and GPS coordinates.
    - `run.rb`: Run model with properties like user_id, territory_id, and duration.
    - `challenge.rb`: Challenge model with properties like challenger_id and status.
  - **channels/**: Manages WebSocket connections for real-time features.
    - **application_cable/**: Contains base classes for ActionCable channels.
      - `channel.rb`: Base class for channels.
      - `connection.rb`: Manages WebSocket connections.

- **config/**: Configuration files for the application.
  - `database.yml`: Database configuration for different environments.
  - `routes.rb`: Defines the API routes for the application.
  - `environment.rb`: Loads and initializes the Rails environment.

- **db/**: Database-related files.
  - **migrate/**: Contains migration files for database schema changes.
  - `seeds.rb`: Populates the database with initial data.

- **Dockerfile**: Instructions for building the Docker image for the Rails application.

- **docker-compose.yml**: Defines services for the application, including the Rails app and PostgreSQL database.

- **Gemfile**: Lists the Ruby gems required for the application.

- **Gemfile.lock**: Locks the versions of the gems specified in the Gemfile.

## Setup Instructions
1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd runown-backend
   ```

2. **Install Dependencies**
   ```bash
   bundle install
   ```

3. **Configure Database**
   Update `config/database.yml` with your database credentials.

4. **Run Migrations**
   ```bash
   rails db:create
   rails db:migrate
   ```

5. **Seed the Database**
   ```bash
   rails db:seed
   ```

6. **Start the Server**
   ```bash
   rails server
   ```

## API Documentation
- **Users**
  - `POST /api/users`: Create a new user.
  - `GET /api/users/:id`: Retrieve user details.
  - `PUT /api/users/:id`: Update user information.
  - `DELETE /api/users/:id`: Delete a user.

- **Territories**
  - `POST /api/territories`: Create a new territory.
  - `GET /api/territories`: List all territories.
  - `POST /api/territories/claim`: Claim a territory.

- **Runs**
  - `POST /api/runs`: Start a new run.
  - `GET /api/runs`: List all runs.
  - `POST /api/runs/verify`: Verify a completed run.

- **Challenges**
  - `POST /api/challenges`: Create a new challenge.
  - `POST /api/challenges/accept`: Accept a challenge.
  - `GET /api/challenges`: List all challenges.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.