# EliteFlow — Team Task Management & Collaboration Platform

**EliteFlow** is a full-stack SaaS application designed to help teams organize projects, manage tasks, collaborate efficiently, and handle subscription-based access. It provides role-based access control, task history, notifications, payment processing, and cloud-based profile image management.

The platform is built with a React and TypeScript frontend and a Node.js, Express, TypeScript, and PostgreSQL backend.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Database Setup](#-database-setup)
- [API Documentation](#-api-documentation)
- [Subscription Management](#-subscription-management)
- [Background Jobs](#-background-jobs)
- [Notifications](#-notifications)
- [Cloudinary Integration](#-cloudinary-integration)
- [Security](#-security)
- [Development Workflow](#-development-workflow)
- [Future Improvements](#-future-improvements)
- [Author](#-author)

---

## 🚀 Overview

EliteFlow is designed to simplify team collaboration by bringing project management, task tracking, notifications, and subscription management into one platform.

The application supports different user roles and company-based access, helping teams organize their work while maintaining appropriate access permissions.

The backend follows a modular architecture that separates routes, controllers, services, repositories, middleware, and background jobs.

### Project Goals

- Simplify project and task management.
- Support collaboration between team members.
- Implement secure authentication and role-based authorization.
- Maintain company-level data isolation.
- Support subscription-based access and payment processing.
- Automate subscription expiry and reminder notifications.
- Provide reliable notification and profile image services.

---

## ✨ Key Features

### 1. Authentication & Authorization

- JWT-based access-token authentication.
- Role-based authorization.
- Protected API endpoints.
- Company-aware access control.
- User profile management.

**Supported roles:**

| Role | Description |
|---|---|
| `SUPERADMIN` | Platform-level administrative access |
| `ADMIN` | Company administration and management |
| `USER` | Standard team-member access |

Actual permissions depend on the authorization rules configured for each endpoint.

### 2. Company Management

- Company-specific user and project management.
- Company activation and suspension status.
- Subscription association at the company level.
- Company-level resource isolation.

### 3. Project Management

- Create, retrieve, update, and delete projects.
- Manage project status.
- Retrieve project details.
- Manage project members.
- Apply role-based authorization to project operations.

### 4. Task Management

- Create and manage tasks.
- Retrieve tasks associated with projects.
- Update task information and status.
- Delete tasks with appropriate permissions.
- Maintain task history.
- Support collaboration through task comments.

### 5. Advanced Search, Filtering & Pagination

- Search and filter supported records.
- Retrieve large datasets in manageable pages.
- Improve data navigation and usability.
- Reduce the need to load entire datasets at once.

The available filters and pagination parameters depend on the individual API endpoints.

### 6. Subscription Management

EliteFlow supports subscription lifecycle management, including:

- Free subscription plans.
- Paid subscription plans.
- Subscription status tracking.
- Subscription history.
- Subscription cancellation.
- Expiry processing.
- Renewal eligibility checks.
- Stripe Checkout integration.
- Payment status tracking and recovery workflows.

### 7. Payment Processing with Stripe

Stripe integration supports subscription payment workflows.

Key responsibilities include:

- Creating Stripe Checkout sessions.
- Processing payment webhook events.
- Tracking payment status.
- Associating successful payments with subscriptions.
- Handling payment failures.
- Supporting renewal payment workflows.
- Providing a recovery workflow for payments requiring further processing.

Payment completion is handled by the backend rather than relying solely on the frontend's checkout success page.

### 8. Automated Subscription Jobs

Scheduled background jobs help maintain subscription lifecycle operations.

- Periodically process expired subscriptions.
- Send subscription expiry reminder emails.
- Track reminder delivery status.
- Retry eligible reminder attempts.
- Avoid duplicate reminders through subscription-and-reminder-type tracking.

### 9. Firebase Push Notifications

Firebase Cloud Messaging (FCM) integration supports push notifications.

Implemented notification-related functionality includes:

- Firebase token management.
- Push notification endpoints.
- Notification management.
- Integration with the application's notification infrastructure.

Push delivery depends on valid Firebase configuration and registered device tokens.

### 10. Cloudinary Profile Image Management

Cloudinary integration supports cloud-based profile image management.

- Upload profile images.
- Store image references.
- Delete profile images.
- Integrate image operations with user profile endpoints.

### 11. Notifications & Audit Logs

The backend includes dedicated modules for:

- Notifications.
- Push notifications.
- Firebase device tokens.
- Audit logs.

These modules provide the foundation for user communication and tracking relevant application activity.

---

## 🛠️ Technology Stack

### Backend

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| TypeScript | Static typing |
| PostgreSQL | Relational database |
| Prisma ORM | Database access and data modeling |
| JWT | Access-token authentication |
| Stripe | Payment and subscription processing |
| Firebase Cloud Messaging | Push notifications |
| Cloudinary | Cloud-based image management |
| Node Cron | Scheduled background jobs |
| Helmet | HTTP security headers |
| CORS | Cross-origin request configuration |
| Cookie Parser | Cookie parsing |

### Frontend

The frontend is developed separately from the backend.

The intended frontend stack includes:

- React
- TypeScript
- Vite
- Redux Toolkit
- React Router
- Axios
- SCSS
- Lucide React

### External Services

- Stripe for payment processing.
- Firebase for push notifications.
- Cloudinary for profile image storage.

---

## 🏗️ System Architecture

EliteFlow uses a layered backend architecture.

```text
                    Frontend Application
                            |
                            v
                      Express REST API
                            |
              +-------------+-------------+
              |             |             |
              v             v             v
           Routes       Middleware    Controllers
              |             |             |
              |       Authentication      v
              |       Authorization    Services
              |                           |
              |                           v
              |                       Repositories
              |                           |
              +---------------------------+
                                          |
                                          v
                                    Prisma ORM
                                          |
                                          v
                                     PostgreSQL

                 External Integrations
                 ---------------------
                 Stripe
                 Firebase Cloud Messaging
                 Cloudinary

                 Background Jobs
                 ---------------
                 Subscription Expiry
                 Subscription Reminders
```

### Architectural Responsibilities

**Routes:** Define API endpoints and middleware.

**Middleware:** Handle authentication, authorization, and request processing.

**Controllers:** Receive HTTP requests and return responses.

**Services:** Implement business logic and coordinate application operations.

**Repositories:** Encapsulate database queries.

**Prisma:** Provides database access through the configured Prisma Client.

**Background jobs:** Perform scheduled subscription maintenance and reminder processing.

---

## 📂 Project Structure

The backend follows a modular folder structure similar to the following:

```text
EliteFlow/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── socket.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── projectController.ts
│   │   │   ├── taskController.ts
│   │   │   ├── subscriptionController.ts
│   │   │   └── stripeWebhookController.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts
│   │   │   ├── roleMiddleware.ts
│   │   │   └── uploadMiddleware.ts
│   │   │
│   │   ├── repositories/
│   │   │   └── subscriptionRepository.ts
│   │   │
│   │   ├── services/
│   │   │   ├── subscriptionService.ts
│   │   │   ├── emailService.ts
│   │   │   └── notificationService.ts
│   │   │
│   │   ├── jobs/
│   │   │   ├── subscriptionExpiryJob.ts
│   │   │   └── subscriptionReminderJob.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   ├── companyRoutes.ts
│   │   │   ├── projectRoutes.ts
│   │   │   ├── taskRoutes.ts
│   │   │   ├── subscriptionRoutes.ts
│   │   │   └── renewalRoutes.ts
│   │   │
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

*This is an illustrative structure, not an exhaustive file listing. Use the actual repository structure if a file or directory differs.*

---

## ⚙️ Getting Started

### Prerequisites

Install the following tools before starting development:

- Node.js and npm.
- PostgreSQL.
- Git.
- A Stripe account for payment integration.
- A Firebase project for push notifications.
- A Cloudinary account for image management.

You should also have access to the environment variables and credentials required by the application.

### 1. Clone the Repository

```bash
git clone https://github.com/AviItaliya/elite-flow.git
```

Navigate into the project:

```bash
cd elite-flow
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory.

Use the configuration section below as a reference. Match the variable names to those used by the actual application.

### 4. Configure PostgreSQL

Create a PostgreSQL database for local development and configure the database connection in your environment.

### 5. Configure Prisma

Run the Prisma commands supported by your installed Prisma version and project configuration.

For a standard Prisma setup, the typical commands are:

```bash
npx prisma generate
```

For applying development schema changes through migrations:

```bash
npx prisma migrate dev
```

**Note:** This project uses a Prisma configuration that may differ from the standard setup. Check your existing `prisma.config.ts`, installed Prisma version, and package scripts before running migration commands.

### 6. Start the Backend

Check the `scripts` section in `backend/package.json` and use the configured development command.

For example, if your project defines a `dev` script:

```bash
npm run dev
```

The server uses port `1213` by default unless another port is configured.

Health check:

```http
GET /api/health
```

Expected response:

```json
{
  "success": true,
  "message": "EliteFlow API is running"
}
```

---

## 🔐 Environment Configuration

Create a `.env` file in the backend directory.

The following variables are illustrative. Keep only the variables required by your actual code and use the exact names expected by each service.

```env
# Server
PORT=your_port
NODE_ENV=development
FRONTEND_URL=your_frontend_url

# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/eliteflow"

# Authentication
JWT_ACCESS_SECRET=replace_with_a_secure_random_secret
JWT_REFRESH_SECRET=replace_with_a_secure_random_secret

# Super Admin Setup
SUPERADMIN_SETUP_SECRET=create_your_superadmin_setup_key

# Stripe
STRIPE_SECRET_KEY=sk_test_replace_with_your_key
STRIPE_WEBHOOK_SECRET=whsec_replace_with_your_webhook_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# SMTP Configuration
SMTP_HOST=your_host_name
SMTP_PORT=your_host_port
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=your_mail_sending_email

# Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
```

### Environment Security

- Never commit `.env` files or real credentials.
- Never expose secret keys in frontend code.
- Use separate Stripe test and live credentials.
- Keep Firebase service-account credentials secure.
- Use strong, randomly generated JWT secrets.
- Restrict production database access.
- Configure production CORS origins explicitly.

The example above is a template, not a guarantee that every variable name matches the current implementation.

---

## 🗄️ Database Setup

EliteFlow uses PostgreSQL with Prisma ORM.

The database schema defines the application's primary entities and their relationships.

Key domain areas include:

- Companies.
- Users.
- Projects.
- Tasks.
- Task history.
- Comments.
- Plans.
- Subscriptions.
- Payments.
- Renewal payments.
- Subscription reminders.
- Notifications.
- Audit logs.
- Firebase device tokens.

### Database Responsibilities

PostgreSQL stores application records and relationships, while Prisma provides typed database access.

The subscription data model supports lifecycle states such as:

| Status | Meaning |
|---|---|
| `TRIAL` | Trial subscription |
| `ACTIVE` | Active subscription |
| `CANCELLED` | Cancelled subscription |
| `EXPIRED` | Expired subscription |

Payment records track their own payment lifecycle independently of subscription status.

---

## 🌐 API Documentation

The backend exposes REST API endpoints under `/api`.

The following table summarizes the route groups registered in the application.

| Route | Purpose |
|---|---|
| `/api/health` | API health check |
| `/api/auth` | Authentication |
| `/api/users` | User management |
| `/api/companies` | Company management |
| `/api/projects` | Project management |
| `/api/tasks` | Task management |
| `/api/comments` | Task comments |
| `/api/dashboard` | Dashboard data |
| `/api/plans` | Subscription plan management |
| `/api/subscriptions` | Subscription operations |
| `/api/renewals` | Renewal operations |
| `/api/superadmin` | Platform administration |
| `/api/notifications` | Notifications |
| `/api/fcm-tokens` | Firebase token management |
| `/api/push-notifications` | Push notification operations |
| `/api/audit-logs` | Audit log operations |
| `/api/payments/webhook` | Stripe webhook endpoint |

Individual endpoints may require authentication, role authorization, company ownership validation, or other conditions.

### Example Health Check

```bash
curl http://localhost:1213/api/health
```

### Authentication

Protected endpoints use the access-token authentication mechanism configured by the backend.

For endpoints that expect a bearer token, include:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

For the exact request bodies, response formats, and parameters, consult the corresponding route and controller implementations.

---

## 💳 Subscription Management

Subscription management is a core part of EliteFlow.

### Free Subscriptions

The application supports permanent Free subscriptions, represented by an active subscription whose `endDate` is `null`.

The subscription lookup logic recognizes these subscriptions as valid, provided their start date has arrived and their status is active or trial.

### Paid Subscriptions

Paid plans use Stripe Checkout rather than being created directly through the Free-plan subscription flow.

Successful payment processing is coordinated with subscription creation and payment status updates.

### Subscription Cancellation

Cancellation updates the subscription status to `CANCELLED`.

Cancelled subscriptions are excluded from the normal active-subscription lookup.

Company access after cancellation should follow the application's explicitly defined billing and authorization policies.

### Subscription Expiry

The expiry service:

1. Finds active or trial subscriptions whose non-null end dates have passed.
2. Changes their status to `EXPIRED`.
3. Checks active, nonsuspended companies for a valid subscription.
4. Deactivates eligible companies that no longer have a valid subscription.

A permanent Free subscription is treated as valid because it does not have an expiry date.

### Renewal Eligibility

The renewal eligibility service evaluates whether a subscription can be renewed based on its status, start date, end date, and configured renewal window.

For the current implementation, renewal eligibility opens seven days before the subscription's expiry date.

---

## ⏰ Background Jobs

EliteFlow registers subscription background jobs when the HTTP server starts.

### Subscription Expiry Job

**File:** `src/jobs/subscriptionExpiryJob.ts`

Schedule:

```text
Every 15 minutes
```

Purpose:

- Process expired subscriptions.
- Update subscription status.
- Check company subscription validity.
- Deactivate eligible companies without valid subscriptions.

### Subscription Reminder Job

**File:** `src/jobs/subscriptionReminderJob.ts`

Schedule:

```text
Every day at 09:00 Asia/Kolkata
```

Reminder intervals:

- Seven days before expiry.
- Three days before expiry.
- One day before expiry.

The reminder workflow tracks reminder status, attempts, and delivery errors to support retry handling and reduce duplicate processing.

Both jobs require the backend process to be running.

For production deployments with multiple backend instances, scheduled jobs should be configured to avoid duplicate execution across instances.

---

## 🔔 Notifications

EliteFlow contains a notification infrastructure that includes notification services, push notification routes, and Firebase device-token management.

The application can use this infrastructure to notify users about relevant events.

Push notifications require valid Firebase configuration and registered device tokens.

Email reminders use the application's configured email service. Delivery depends on valid email-provider credentials and successful processing by the background job.

---

## 🖼️ Cloudinary Integration

Cloudinary is used for profile image management.

The integration supports uploading and deleting profile images through user-related API operations.

Cloudinary credentials must be configured securely on the backend.

Image upload requests must follow the content type, multipart field name, and validation rules implemented by the upload middleware.

---

## 🛡️ Security

EliteFlow includes several security-related mechanisms.

### Authentication

JWT verification protects routes that require an authenticated user.

### Role-Based Authorization

Role middleware restricts access based on permitted roles.

### HTTP Security

Helmet configures HTTP security headers, and CORS is configured to control permitted frontend origins.

### Request Limits

The Express application configures JSON and URL-encoded request size limits.

### Payment Security

Stripe webhook processing uses a raw request body for signature verification.

Webhook events should be validated before they are trusted, and payment status should be determined by verified backend processing rather than client-provided claims.

### Company Isolation

Company-owned resources should be validated against the authenticated user's company context to prevent unauthorized cross-company access.

### Production Recommendations

- Use HTTPS.
- Validate incoming request data.
- Apply appropriate rate limits.
- Store secrets outside source control.
- Verify Stripe webhook signatures.
- Enforce company-level authorization in every relevant resource operation.
- Protect administrative and payment recovery endpoints.
- Avoid logging credentials, tokens, or sensitive payment information.

---

## 🧪 Testing & Validation

Before deploying changes, validate the affected features.

Recommended checks include:

- TypeScript compilation.
- Authentication and authorization.
- Project and task operations.
- Company-level data isolation.
- Subscription creation and cancellation.
- Permanent Free subscription handling.
- Expired subscription processing.
- Stripe webhook signature verification.
- Payment failure and recovery scenarios.
- Subscription reminder delivery.
- Cloudinary upload and deletion.
- Firebase push notification delivery.

Run the validation commands configured by your actual `package.json` scripts.

For TypeScript projects with a compatible compiler configuration, a common check is:

```bash
npx tsc --noEmit
```

---

## 🔄 Development Workflow

A typical development workflow is:

1. Create a feature branch.
2. Implement the feature using the existing architecture.
3. Validate request data and authorization.
4. Update database schema or migrations when necessary.
5. Run the relevant tests and type checks.
6. Review the changes.
7. Commit using a descriptive commit message.
8. Push the branch and open a pull request.

Example:

```bash
git checkout -b feature/subscription-management
git add .
git commit -m "feat(subscription): improve lifecycle management"
git push -u origin feature/subscription-management
```

Check `git status` before committing to avoid including unrelated files or secrets.

---

## 🗺️ Future Improvements

Potential areas for further development include:

- Comprehensive automated tests for subscription lifecycle edge cases.
- Stronger integration tests for Stripe payment and renewal workflows.
- Centralized subscription entitlement enforcement for protected features.
- Improved observability for scheduled jobs and webhook processing.
- Production-safe distributed job coordination.
- API documentation using Swagger/OpenAPI.
- CI/CD automation and deployment monitoring.
- Additional reporting and analytics for team activity.

These are potential improvements, not claims that the features are already implemented.

---

## 👨‍💻 Author

**Avi Italiya**

GitHub: [@AviItaliya](https://github.com/AviItaliya)

Repository: [AviItaliya/elite-flow](https://github.com/AviItaliya/elite-flow)

---

## 📄 License

Add the license applicable to this project before distributing or reusing the code. If the repository does not currently contain a license, no particular open-source license should be assumed.

---

**EliteFlow — Organize work. Empower teams. Deliver better results.**
