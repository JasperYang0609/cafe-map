-- ============================================
-- 咖啡廳地圖 DB Schema
-- ============================================

-- 1. H3 快取表：存放 Google Places API 的結果
CREATE TABLE IF NOT EXISTS h3_cache (
  h3_index TEXT PRIMARY KEY,
  cafes JSONB NOT NULL DEFAULT '[]',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '45 days')
);

-- 2. 咖啡廳主表：enriched cafe data
CREATE TABLE IF NOT EXISTS cafes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  rating DOUBLE PRECISION,
  total_ratings INTEGER DEFAULT 0,
  photo_reference TEXT,
  price_level INTEGER,
  h3_index TEXT,
  enriched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 使用者表（擴展 Supabase Auth）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  is_subscribed BOOLEAN DEFAULT FALSE,
  subscription_expires_at TIMESTAMPTZ,
  privacy_accepted BOOLEAN DEFAULT FALSE,
  privacy_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 收藏表（訂閱用戶專用）
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cafe_id)
);

-- 5. 搜尋紀錄（免費 + 訂閱都有）
CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 照片快取
CREATE TABLE IF NOT EXISTS photo_cache (
  photo_reference TEXT PRIMARY KEY,
  photo_url TEXT NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cafes_h3 ON cafes(h3_index);
CREATE INDEX IF NOT EXISTS idx_cafes_place_id ON cafes(place_id);
CREATE INDEX IF NOT EXISTS idx_cafes_location ON cafes(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_viewed ON search_history(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_h3_cache_expires ON h3_cache(expires_at);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE h3_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_cache ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Favorites: users can only see/manage their own
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Search history: users can only see/manage their own
CREATE POLICY "Users can view own history" ON search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON search_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON search_history FOR DELETE USING (auth.uid() = user_id);

-- Cafes: everyone can read, only service role can write
CREATE POLICY "Anyone can view cafes" ON cafes FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Service role can manage cafes" ON cafes FOR ALL TO service_role USING (true);

-- H3 cache: everyone can read, only service role can write
CREATE POLICY "Anyone can view h3 cache" ON h3_cache FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Service role can manage h3 cache" ON h3_cache FOR ALL TO service_role USING (true);

-- Photo cache: everyone can read, only service role can write
CREATE POLICY "Anyone can view photo cache" ON photo_cache FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Service role can manage photo cache" ON photo_cache FOR ALL TO service_role USING (true);

-- ============================================
-- Trigger: auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
