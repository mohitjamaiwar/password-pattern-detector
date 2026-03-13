# Password Pattern Detector API (MySQL)

This backend receives password fingerprints from the extension and stores risk analysis in MySQL.

## 1. Prerequisites

- Node.js 20+
- MySQL 8+

## 2. Install dependencies

```bash
cd backend
npm install
```

## 3. Create database in MySQL

```sql
CREATE DATABASE password_detector;
```

## 4. Configure environment

```bash
copy .env.example .env
```

Edit `.env` and set your MySQL credentials:

```env
PORT=8080
DATABASE_URL="mysql://root:password@localhost:3306/password_detector"
CORS_ORIGIN="*"
```

## 5. Initialize Prisma

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

## 6. Run API

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:8080/health
```

## 7. Main endpoint

`POST /api/v1/risk/check`

Request body:

```json
{
  "userId": "local-user-id",
  "site": "example.com",
  "passwordHash": "hash-value",
  "structure": "[word][numbers][symbols]",
  "tokens": {
    "baseWord": "hello",
    "numbers": "123",
    "symbols": "!"
  },
  "passwordLength": 9
}
```
