-- Dedicated table for a user's bean rating on a cafe (0-4 beans).
-- Replaces the prior (broken) setup where rating was written to
-- search_history.user_rating — that failed silently whenever the cafe
-- wasn't in search_history, and loadFavorites never read it back.

CREATE TABLE IF NOT EXISTS cafe_ratings (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  rating  INT  NOT NULL CHECK (rating >= 0 AND rating <= 4),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, cafe_id)
);

CREATE INDEX IF NOT EXISTS cafe_ratings_user_idx ON cafe_ratings(user_id);

-- Row-Level Security: users can only see/write their own ratings.
ALTER TABLE cafe_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cafe_ratings_select_own" ON cafe_ratings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cafe_ratings_insert_own" ON cafe_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cafe_ratings_update_own" ON cafe_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cafe_ratings_delete_own" ON cafe_ratings
  FOR DELETE USING (auth.uid() = user_id);
