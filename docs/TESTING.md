# Quick test
1. Start the server with `npm run dev`.
2. Open http://localhost:4000/health.
3. Expected response resembles:
   `{"status":"ok","service":"proxispeak-week1","database":"connected"}`
   If MongoDB is not running, the server may still start and report `database":"disconnected"`.
4. To test multiple avatars, connect the frontend from Part 2 in two browser tabs.

Socket events:
- Server -> client: `session:init`, `avatar:joined`, `avatar:moved`, `avatar:left`
- Client -> server: `avatar:move`
