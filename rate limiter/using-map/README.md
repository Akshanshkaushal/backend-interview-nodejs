# Rate Limiter using Map (In-Memory)

This is a simple rate limiter implementation using JavaScript's in-memory Map/Object to track request counts per IP address.

## How it works

- **Max Allowed Requests**: 5 requests per IP
- **Time Window**: 10,000 milliseconds (10 seconds)
- **Storage**: In-memory JavaScript object

## Features

✅ Simple and lightweight
✅ No external database required
✅ Automatic reset every 10 seconds
✅ IP-based request tracking
✅ Returns 429 (Too Many Requests) when limit exceeded

## Limitations

❌ Data is lost when server restarts
❌ Not suitable for distributed systems (multiple servers)
❌ Memory usage grows with unique IPs
❌ No persistence

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

Test with requests:
```bash
curl http://localhost:8000/
```

Send multiple requests rapid-fire to test the rate limiting:
```bash
for i in {1..10}; do curl http://localhost:8000/; done
```

## Configuration

Modify these values in `index.js`:

```javascript
const MAX_ALLOWED_REQ = 5;  // Maximum requests per IP
const MAX_TIME = 10_000;     // Time window in milliseconds
```
