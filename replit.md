# Overview

WebMonitor Pro is a comprehensive website uptime monitoring application built with a React frontend and Express.js backend. The system continuously monitors websites, tracks their uptime status, sends email notifications when sites go down, and provides detailed analytics dashboards. It uses PostgreSQL for data persistence via Drizzle ORM and includes a modern, responsive UI built with shadcn/ui components and Tailwind CSS.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, built using Vite for fast development and optimized builds
- **Routing**: Client-side routing implemented with Wouter for lightweight navigation
- **State Management**: TanStack Query (React Query) for server state management and data fetching
- **UI Components**: shadcn/ui component library providing a comprehensive set of accessible, customizable components
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Runtime**: Node.js with Express.js providing RESTful API endpoints
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful architecture with dedicated routes for websites, monitoring results, and notifications
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Logging**: Custom logging middleware for API request/response tracking

## Database Layer
- **ORM**: Drizzle ORM for type-safe database interactions
- **Database**: PostgreSQL with Neon Database serverless hosting
- **Schema Management**: Code-first schema definition with automatic migration support
- **Connection**: Connection pooling via @neondatabase/serverless driver

## Monitoring System
- **Background Jobs**: Node-cron for scheduled monitoring tasks
- **HTTP Checking**: Axios-based website health checks with configurable timeouts
- **Status Tracking**: Real-time status monitoring with historical data retention
- **Notification Engine**: Automated email notifications for uptime/downtime events

## Authentication & Security
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **CORS**: Configured for cross-origin requests in development
- **Input Validation**: Zod schemas for request validation and type safety

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **PostgreSQL**: Primary database for storing websites, monitoring results, and notifications

## Email Services
- **SendGrid**: Transactional email service for uptime/downtime notifications
- **Email Templates**: HTML and text email templates for professional notifications

## Development Tools
- **Vite**: Build tool and development server with hot module replacement
- **ESBuild**: Fast JavaScript bundler for production builds
- **TypeScript**: Type checking and compilation
- **Tailwind CSS**: Utility-first CSS framework with PostCSS processing

## UI Libraries
- **Radix UI**: Headless component primitives for accessibility
- **Lucide React**: Icon library for consistent iconography
- **Date-fns**: Date manipulation and formatting utilities
- **Class Variance Authority**: Utility for creating variant-based component APIs

## Monitoring Dependencies
- **Axios**: HTTP client for website health checks
- **Node-cron**: Cron job scheduler for automated monitoring
- **Crypto**: UUID generation for database records