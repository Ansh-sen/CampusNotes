# CampusNotes

CampusNotes is a marketplace for students to buy and sell study materials.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + Socket.io
- **Database**: Supabase (PostgreSQL)
- **Infrastructure**: AWS S3 (Frontend), AWS EC2 (Backend)

## Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase account

### Installation
1. Clone the repository
2. Install dependencies for all components:
   ```bash
   npm install
   cd client && npm install
   cd server && npm install
   ```

### Development
Run all services concurrently:
```bash
npm run dev:all
```

## Deployment
- **Frontend**: AWS S3 + Static hosting
  - Build the production bundle: `cd client && npm run build`
  - Upload contents of `client/dist/` to your S3 bucket.
  - Set S3 error document to `index.html` (Required for React Router).
- **Backend**: AWS EC2 (Ubuntu 22.04, Node.js 18)
  - Clone repo on EC2.
  - Set up environment variables in `server/.env`.
  - Start the server: `cd server && npm start`.
- **Database**: Supabase (cloud)
- **Live URL**: [coming soon]
