# Slide 1: Title

## SiteWatch: Website Monitoring Solution

**A full-stack application for real-time website uptime and performance tracking.**

---

# Slide 2: Project Overview

### What is SiteWatch?

SiteWatch is a web application designed to monitor the health and performance of websites. Users can add their websites to a dashboard and receive real-time updates on their status, including uptime, response time, and potential outages.

### High-Level Architecture

*   **Frontend:** A modern, responsive React single-page application (SPA) for user interaction.
*   **Backend:** A robust Node.js (Express) server that provides a REST API for the frontend.
*   **Database:** A PostgreSQL database to store all application data.
*   **Monitoring Service:** A background service that periodically checks the status of registered websites.

---

# Slide 3: Technology Stack

| Layer         | Technology                                           |
| :------------ | :--------------------------------------------------- |
| **Frontend**  | React, TypeScript, Vite, Tailwind CSS, shadcn/ui     |
| **Backend**   | Node.js, Express, TypeScript                         |
| **Database**  | PostgreSQL, Drizzle ORM                              |
| **Key Libraries** | TanStack Query (State), Recharts (Charts), Wouter (Routing) |
| **Deployment**| Likely container-based (inferred from `package.json` scripts) |

---

# Slide 4: Core Features

*   **User Dashboard:** A central hub displaying an overview of all monitored websites, including uptime charts and key metrics.
*   **Website Management:** Easily add, edit, and remove websites for monitoring.
*   **Real-time Status:** View the current status (Up/Down), response time, and status code for each site.
*   **Historical Analytics:** Analyze historical performance data to identify trends and recurring issues.
*   **Automated Notifications:** (Inferred) Set up and receive notifications via email or SMS when a website's status changes.
*   **Custom Settings:** Configure application settings, such as check intervals and notification preferences.

---

# Slide 5: Codebase Structure

The project is organized into three main directories, promoting a clean separation of concerns:

### `/client`

*   Contains the entire React frontend application.
*   `src/pages`: Defines the main pages/views of the application.
*   `src/components`: Reusable UI components, including charts and dashboard elements.

### `/server`

*   Holds the Express.js backend API and server logic.
*   `routes.ts`: Defines the API endpoints.
*   `services/monitor.ts`: Contains the core logic for checking website status.

### `/shared`

*   Code shared between the client and server.
*   `schema.ts`: Defines the database schema using Drizzle ORM, ensuring data consistency across the stack.
