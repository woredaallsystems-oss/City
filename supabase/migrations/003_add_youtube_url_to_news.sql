-- Add YouTube URL column to news for embedding videos with articles
ALTER TABLE public.news
ADD COLUMN IF NOT EXISTS youtube_url TEXT;












