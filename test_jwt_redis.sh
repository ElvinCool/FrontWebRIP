#!/bin/bash

echo "=== Testing JWT Token Storage in Redis ==="
echo ""

# Проверка подключения к Redis
echo "1. Checking Redis connection..."
docker exec redis redis-cli PING
if [ $? -ne 0 ]; then
    echo "ERROR: Cannot connect to Redis"
    exit 1
fi
echo "✓ Redis is accessible"
echo ""

# Проверка существующих ключей
echo "2. Current keys in Redis:"
docker exec redis redis-cli KEYS "*" | wc -l
echo ""

# Проверка JWT токенов
echo "3. JWT tokens in Redis:"
JWT_COUNT=$(docker exec redis redis-cli --scan --pattern "jwt:*" 2>/dev/null | grep -v "jwt:blacklist" | wc -l | tr -d ' ')
echo "Active JWT tokens: $JWT_COUNT"
echo ""

# Проверка отозванных токенов
echo "4. Revoked JWT tokens:"
REVOKED_COUNT=$(docker exec redis redis-cli --scan --pattern "jwt:blacklist:*" 2>/dev/null | wc -l | tr -d ' ')
echo "Revoked JWT tokens: $REVOKED_COUNT"
echo ""

# Проверка сессий
echo "5. Sessions in Redis:"
SESSION_COUNT=$(docker exec redis redis-cli --scan --pattern "session:*" 2>/dev/null | wc -l | tr -d ' ')
echo "Active sessions: $SESSION_COUNT"
echo ""

echo "=== Summary ==="
echo "To see JWT tokens, you need to:"
echo "1. Login again (old sessions won't create JWT tokens)"
echo "2. Check server logs for any Redis errors"
echo "3. Run: go run cmd/redis-inspect/main.go"

