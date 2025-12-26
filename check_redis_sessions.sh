#!/bin/bash

echo "=== Redis Sessions Check ==="
echo ""

# Подсчет сессий
COUNT=$(docker exec redis redis-cli --scan --pattern "session:*" 2>/dev/null | wc -l | tr -d ' ')
echo "Всего активных сессий: $COUNT"
echo ""

# Список всех сессий с данными
docker exec redis redis-cli --scan --pattern "session:*" 2>/dev/null | while read key; do
  SID=${key#session:}
  USER_ID=$(docker exec redis redis-cli HGET "$key" "user_id" 2>/dev/null)
  IS_MOD=$(docker exec redis redis-cli HGET "$key" "is_moderator" 2>/dev/null)
  TTL=$(docker exec redis redis-cli TTL "$key" 2>/dev/null)
  
  MOD_TEXT="Обычный пользователь"
  if [ "$IS_MOD" = "1" ]; then
    MOD_TEXT="Модератор"
  fi
  
  TTL_HOURS=$((TTL / 3600))
  TTL_MINS=$(((TTL % 3600) / 60))
  
  echo "Session ID: $SID"
  echo "  User ID: $USER_ID"
  echo "  Роль: $MOD_TEXT"
  if [ "$TTL" -gt 0 ]; then
    echo "  TTL: ${TTL_HOURS}ч ${TTL_MINS}м (осталось времени)"
  else
    echo "  TTL: истек"
  fi
  echo ""
done

