# Network Access Setup

## Accessing Frontend from Your Phone

Your frontend has been configured to be accessible from devices on your local network.

### Your Network Details
- **Local IP**: `192.168.0.253`
- **Frontend URL**: `http://192.168.0.253:5173/`
- **Backend URL**: `http://192.168.0.253:8000`

### Setup Steps

1. **Start the backend with network access:**
   ```bash
   cd backend
   source venv/bin/activate  # or activate your virtual environment
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   
   You should see output like:
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
   INFO:     Started reloader process
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   
   You should see:
   ```
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.0.253:5173/
   ```

3. **Connect from your phone:**
   - Make sure your phone is on the **same Wi-Fi network** as your computer
   - Open your phone's browser
   - Navigate to: `http://192.168.0.253:5173/`

### Configuration Files

- **`.env`** - Uses network IP (for phone access)
- **`.env.local`** - Uses localhost (for local development only)
- **`.env.network`** - Reference file with network IP

### Switching Between Modes

**For local development only:**
```bash
# Copy .env.local to .env
cp .env.local .env
npm run dev
```

**For mobile/network access:**
```bash
# Copy .env.network to .env  
cp .env.network .env
npm run dev
```

Or simply use the `dev:network` script:
```bash
npm run dev:network
```

### Troubleshooting

#### Can't connect from phone?

1. **Check firewall settings** - Make sure ports 5173 and 8000 are not blocked
2. **Verify same network** - Both devices must be on the same Wi-Fi
3. **Check IP address** - Your local IP might change. Run:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

#### Backend connection issues?

Make sure the backend is running with `--host 0.0.0.0`:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Security Note

The `0.0.0.0` host setting makes your dev server accessible to any device on your local network. This is fine for development but should **never** be used in production.

### Quick Reference

| Service  | Local URL              | Network URL                   |
|----------|------------------------|-------------------------------|
| Frontend | http://localhost:5173  | http://192.168.0.253:5173     |
| Backend  | http://localhost:8000  | http://192.168.0.253:8000     |
| API Docs | http://localhost:8000/docs | http://192.168.0.253:8000/docs |
