
# Firebase Studio - AttendEase

This is a Next.js starter application called AttendEase, built in Firebase Studio. It provides a simple solution for attendance tracking.

## Getting Started

To get started with the application, follow these steps:

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm (usually comes with Node.js)

### Installation

1.  Clone the repository (if you haven't already).
2.  Navigate to the project directory:
    ```bash
    cd your-project-directory
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Application

The application consists of two main parts:
1.  **Next.js Frontend and API Routes (Backend)**: This serves the web interface and standard API endpoints (like `/api/users`, `/api/attendance`).
2.  **Genkit Backend (for AI features)**: This runs the Genkit flows. While not heavily used in the current AttendEase features, it's part of the template.

You'll typically want to run both simultaneously in separate terminal windows.

**1. Run the Next.js Application (Frontend & Core API):**

   Open a terminal and run:
   ```bash
   npm run dev
   ```
   This will start the Next.js development server, usually on `http://localhost:9002`. You can access the application by opening this URL in your browser.

**2. Run the Genkit Backend (AI Flows):**

   Open a *new* terminal and run:
   ```bash
   npm run genkit:dev
   ```
   Or, if you want Genkit to automatically restart when AI flow files change:
   ```bash
   npm run genkit:watch
   ```
   This will start the Genkit development server, typically on a different port (e.g., `http://localhost:4000` for the Genkit developer UI, with flows being available to the Next.js app internally).

### Key Features & Pages

-   **Home Page (`/`)**: Clock in/out, verify location (simulated).
-   **QR Code Generator (`/qr-generator`)**: Generates a QR code for attendance.
-   **Take Attendance (`/take-attendance`)**: Page accessed after scanning the QR code to confirm attendance with User ID.
-   **Attendance History (`/history`)**: View attendance records for a specific User ID.
-   **Admin Login (`/admin-login`)**: Login page for administrators (credentials: `admin`/`admin`).
-   **Reporting Dashboard (`/dashboard`)**: View user list, add new users, and view a placeholder for reports (requires admin login).

### Database

The application uses SQLite for data storage. A file named `attendee.db` will be created in the project root directory when the API routes are first accessed. This database stores:
-   `users`: Information about registered users.
-   `attendance`: Daily attendance records.

### Tech Stack

-   Next.js (App Router)
-   React
-   TypeScript
-   Tailwind CSS
-   ShadCN UI Components
-   Genkit (for AI features)
-   SQLite (for database)

Feel free to explore the `src/app` directory for page components and `src/pages/api` for the backend API routes.
The AI flows are located in `src/ai/flows`.
```