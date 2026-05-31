CREATE TABLE "user_refresh_sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "refresh_token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_refresh_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_refresh_sessions_refresh_token_hash_key" ON "user_refresh_sessions"("refresh_token_hash");
CREATE INDEX "user_refresh_sessions_user_id_idx" ON "user_refresh_sessions"("user_id");
CREATE INDEX "user_refresh_sessions_expires_at_idx" ON "user_refresh_sessions"("expires_at");
CREATE INDEX "user_refresh_sessions_revoked_at_idx" ON "user_refresh_sessions"("revoked_at");

ALTER TABLE "user_refresh_sessions"
  ADD CONSTRAINT "user_refresh_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
