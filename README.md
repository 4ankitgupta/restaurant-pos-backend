# Restaurant POS - Backend API

This repository contains the complete backend for a comprehensive, production-ready Restaurant Point of Sale (POS) system. It's built with Node.js, Express.js, and TypeScript, offering a robust, scalable, and secure foundation for managing restaurant operations. The API is designed to be restaurant-centric, with all data scoped to a specific restaurant.

## ✨ Key Features

- Authentication: Secure JWT-based authentication (access and refresh tokens) with bcrypt for password hashing.
- Role-Based Access Control (RBAC): Pre-configured roles (Admin, Manager, Cashier, Waiter, Kitchen Staff) to control access to different endpoints.
- Multi-Restaurant Ready: All resources are tied to a restaurant_id, making the architecture suitable for a multi-tenant setup.
- Comprehensive Modules: End-to-end management for Users, Menus, Orders, Payments, Inventory, and Expenses.
- Modern Tech Stack: Built with TypeScript, PostgreSQL, and Prisma ORM for type safety and efficient database management.
- Production-Ready Practices: Includes centralized error handling, input validation with Zod, consistent API responses, and pagination.

## 🛠️ Tech Stack

- Backend: Node.js, Express.js
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Authentication: JSON Web Tokens (JWT)
- Validation: Zod
- Primary Keys: UUIDs

## Getting Started

Follow these instructions to get the project set up and running on your local machine.

### Prerequisites

- Node.js (v18.x or higher recommended)
- npm or yarn
- PostgreSQL database instance
- Git

### Installation & Setup

1. Clone the repository:

   ```
   git clone <repository-url>
   cd restaurant-pos-backend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up your environment variables in the `.env` file.

- Rename the .env.example file to .env.
- Update the .env file with your PostgreSQL database URL and JWT secrets.

  ```
  # PostgreSQL Database Connection URL
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

   # Application Port
   PORT=8000

   # JWT Secrets
   ACCESS_TOKEN_SECRET="your-strong-access-token-secret-key"
   ACCESS_TOKEN_EXPIRY="1d"
   REFRESH_TOKEN_SECRET="your-strong-refresh-token-secret-key"
   REFRESH_TOKEN_EXPIRY="7d"
  ```

4. Run Database Migrations
- Prisma will use the schema.prisma file to create the necessary tables in your database.

    ```
    npx prisma migrate dev --name "init"
    ```
5. Generate Prisma Client
- This command generates the TypeScript types based on your database schema.

    ```
    npx prisma generate
    ```

6. Seed the Database (Optional):
- Seeding is the process of populating your database with initial data. This is useful for development to have default users, roles, or menu items ready to go.

- First, ensure your package.json file is configured to run the seed script. Add the following prisma key if it's not already there:

    ```
    "prisma": {
        "seed": "ts-node prisma/seed.ts"
    }
    ```
You have two ways to run the seed script:

- Option A: Manually

    You can run the seed script at any time using this command:

    ```
    npx prisma db seed
    ```
- Option B: Automatically After Migrating (Recommended)

    The prisma migrate dev command automatically triggers the seed script after a migration is successfully applied. To reset your database and re-run all migrations and the seed script from scratch, use:

    ```
    npx prisma migrate reset
    ```
This command is extremely useful during development for a clean slate.

### Running the Application

To start the development server with live reloading (powered by ts-node-dev), run:

    ```
    npm run dev
    ```

The server will start on the port specified in your .env file (e.g., http://localhost:8000).

## 📁 Project Structure

The project follows a modular, feature-based architecture to keep the codebase organized and scalable.

```
src/
├── app.ts                # Express app configuration and middleware
├── index.ts              # Application entry point
├── config/               # Environment variables configuration
├── db/                   # Prisma client instance
├── middlewares/          # Custom middlewares (auth, error handling, validation)
├── modules/              # Feature modules (auth, users, menu, orders, etc.)
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   └── auth.validation.ts
│   └── ...               # Other modules follow the same structure
└── utils/                # Utility functions (ApiError, ApiResponse, etc.)

```

## API Endpoints

All endpoints are prefixed with /api/v1. Authentication is required for most endpoints.
| Feature | Endpoint | Method | Access Roles | Description |
|------------------|--------------------------------|--------|------------------------------------|------------------------------------------------------|
| Authentication | /auth/login | POST | Public | Log in a user and receive JWT tokens. |
| | /auth/register | POST | Admin, Manager | Register a new staff member for the restaurant. |
| | /auth/refresh-token | POST | Authenticated | Get a new access token using a refresh token. |
| Users | /users | GET | Admin, Manager | Get a paginated list of all users. |
| | /users/:id | GET | Admin, Manager | Get details for a single user. |
| | /users/:id | PATCH | Admin, Manager | Update a user's details. |
| | /users/:id | DELETE | Admin | Delete a user. |
| Menu Categories | /menu/categories | POST | Admin, Manager | Create a new menu category. |
| | /menu/categories | GET | Authenticated | Get all menu categories. |
| | /menu/categories/:id | PATCH | Admin, Manager | Update a category. |
| Menu Items | /menu/items | POST | Admin, Manager | Create a new menu item. |
| | /menu/items | GET | Authenticated | Get all menu items with filtering/pagination. |
| | /menu/items/:id/availability | PATCH | Admin, Manager, Cashier | Toggle the availability of a menu item. |
| Orders | /orders | POST | Waiter, Cashier | Create a new order. |
| | /orders | GET | Authenticated | Get order history with pagination. |
| | /orders/:id/status | PATCH | Waiter, Cashier, Kitchen Staff | Update the status of an order. |
| Payments | /payments | POST | Cashier | Record a payment against an order. |

(This is a sample list. Refer to the codebase or full API documentation for a complete list of endpoints and request/response schemas.)

## Contributing

Contributions are welcome and greatly appreciated! Please feel free to open an issue to discuss a bug or new feature, or submit a pull request with your improvements.

- Fork the repository.
- Create a new branch (git checkout -b feature/your-feature-name).
- Make your changes.
- Commit your changes (git commit -m 'Add some amazing feature').
- Push to the branch (git push origin feature/your-feature-name).
- Open a Pull Request.
