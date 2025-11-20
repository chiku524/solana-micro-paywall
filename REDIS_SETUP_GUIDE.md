# Redis Setup Guide

## Current Status

Your `.env` file has `REDIS_URL=redis://localhost:6379` configured, but Redis is not running. The application will work **without Redis**, but caching and background jobs will be disabled.

---

## Option 1: Run Without Redis (Recommended for Development)

If you don't need caching right now, you can simply comment out or remove the Redis URL:

**Edit `.env` file:**
```env
# Redis (optional for local dev - can use Upstash or local Redis)
# REDIS_URL=redis://localhost:6379
```

The application will:
- ✅ Work normally
- ✅ Use in-memory rate limiting
- ✅ Skip caching (all queries hit database)
- ✅ Skip background job queue

---

## Option 2: Install and Run Redis Locally

### Windows (using WSL or Docker)

**Option A: Using Docker (Easiest)**
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

**Option B: Using WSL**
```bash
# In WSL terminal
sudo apt-get update
sudo apt-get install redis-server
redis-server
```

**Option C: Using Windows Subsystem for Linux**
1. Install WSL2
2. Install Ubuntu from Microsoft Store
3. In Ubuntu terminal:
   ```bash
   sudo apt update
   sudo apt install redis-server
   redis-server
   ```

### macOS
```bash
brew install redis
brew services start redis
```

### Linux
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
```

---

## Option 3: Use Cloud Redis (Upstash - Free Tier)

1. Go to https://upstash.com/
2. Sign up for free account
3. Create a Redis database
4. Copy the Redis URL
5. Update `.env`:
   ```env
   REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT:6379
   ```

---

## Verify Redis is Working

After starting Redis, check if it's running:

```bash
# Test connection
redis-cli ping
# Should return: PONG
```

Or test from Node.js:
```bash
node -e "const Redis = require('ioredis'); const r = new Redis('redis://localhost:6379'); r.ping().then(() => console.log('Redis OK')).catch(e => console.log('Redis Error:', e.message));"
```

---

## What Happens With/Without Redis

### ✅ With Redis:
- **Caching**: 60-80% reduction in database queries
- **Background Jobs**: Payment verification, cleanup tasks
- **Rate Limiting**: Redis-backed (shared across instances)
- **Performance**: 50-200ms faster API responses

### ⚠️ Without Redis:
- **Caching**: Disabled (all queries hit database)
- **Background Jobs**: Disabled (scheduled tasks won't run)
- **Rate Limiting**: In-memory only (per instance)
- **Performance**: Still good (database indexes help)

---

## Current Configuration

Your `.env` currently has:
```env
REDIS_URL=redis://localhost:6379
```

**To disable Redis temporarily**, comment it out:
```env
# REDIS_URL=redis://localhost:6379
```

**To use Redis**, make sure Redis is running on `localhost:6379`.

---

## Error Handling

The application now handles Redis connection failures gracefully:
- ✅ No crashes if Redis is unavailable
- ✅ Logs warnings instead of errors
- ✅ Continues to work without caching
- ✅ Background jobs skip if Redis unavailable

---

## Recommendation

For **development**, you can:
1. **Skip Redis** - Comment out `REDIS_URL` in `.env`
2. **Use Docker** - Easiest way to run Redis: `docker run -d -p 6379:6379 redis`

For **production**, you should:
1. Use a managed Redis service (Upstash, Redis Cloud, AWS ElastiCache)
2. Set `REDIS_URL` to your production Redis instance

---

**The application is now configured to work with or without Redis!** 🎉

