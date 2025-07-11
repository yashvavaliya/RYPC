/*
  # Create review cards table

  1. New Tables
    - `review_cards`
      - `id` (uuid, primary key)
      - `business_name` (text, not null)
      - `category` (text, not null)
      - `type` (text, not null)
      - `description` (text, optional)
      - `location` (text, optional)
      - `slug` (text, unique, not null)
      - `logo_url` (text, optional)
      - `google_maps_url` (text, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `review_cards` table
    - Add policies for public read access (since review cards are meant to be publicly accessible)
    - Add policies for authenticated users to manage cards
*/

CREATE TABLE IF NOT EXISTS review_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  category text NOT NULL,
  type text NOT NULL,
  description text,
  location text,
  slug text UNIQUE NOT NULL,
  logo_url text,
  google_maps_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE review_cards ENABLE ROW LEVEL SECURITY;

-- Allow public read access to review cards (for the review interface)
CREATE POLICY "Anyone can read review cards"
  ON review_cards
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert new cards
CREATE POLICY "Authenticated users can insert review cards"
  ON review_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update cards
CREATE POLICY "Authenticated users can update review cards"
  ON review_cards
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete cards
CREATE POLICY "Authenticated users can delete review cards"
  ON review_cards
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_review_cards_slug ON review_cards(slug);

-- Create index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_review_cards_category ON review_cards(category);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_review_cards_updated_at
    BEFORE UPDATE ON review_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();