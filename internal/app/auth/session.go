package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/redis/go-redis/v9"
)

type SessionStore struct {
	rdb *redis.Client
	ttl time.Duration
}

func NewSessionStore(rdb *redis.Client, ttl time.Duration) *SessionStore {
	return &SessionStore{rdb: rdb, ttl: ttl}
}

func (s *SessionStore) NewSession(ctx context.Context, userID uint, isModerator bool) (string, error) {
	sid := generateSID()
	// Store as simple values; could use JSON if needed
	key := "session:" + sid
	fields := map[string]interface{}{
		"user_id":      userID,
		"is_moderator": boolToInt(isModerator),
	}
	if err := s.rdb.HSet(ctx, key, fields).Err(); err != nil {
		return "", err
	}
	if err := s.rdb.Expire(ctx, key, s.ttl).Err(); err != nil {
		return "", err
	}
	return sid, nil
}

func (s *SessionStore) GetSession(ctx context.Context, sid string) (userID uint, isModerator bool, ok bool, err error) {
	key := "session:" + sid
	vals, err := s.rdb.HGetAll(ctx, key).Result()
	if err != nil {
		return 0, false, false, err
	}
	if len(vals) == 0 {
		return 0, false, false, nil
	}
	// parse values
	uid := parseUint(vals["user_id"])
	isMod := vals["is_moderator"] == "1"
	// touch TTL
	_ = s.rdb.Expire(ctx, key, s.ttl).Err()
	return uid, isMod, true, nil
}

func (s *SessionStore) DeleteSession(ctx context.Context, sid string) error {
	return s.rdb.Del(ctx, "session:"+sid).Err()
}

func generateSID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

func parseUint(s string) uint {
	var n uint
	var x uint64
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c < '0' || c > '9' {
			return 0
		}
		x = x*10 + uint64(c-'0')
	}
	n = uint(x)
	return n
}
