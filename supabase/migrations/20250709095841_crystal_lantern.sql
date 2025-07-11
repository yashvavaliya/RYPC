/*
  # Fix RLS policies for public access

  1. Changes
    - Update INSERT policy to allow public access instead of authenticated only
    - Update UPDATE policy to allow public access instead of authenticated only  
    - Update DELETE policy to allow public access instead of authenticated only

  2. Security Note
    - This change allows any user with the Supabase URL and Anon Key to modify data
    - This is necessary because the application uses local authentication instead of Supabase auth
    - For production use, consider implementing proper Supabase authentication for better security
*/

-- Drop existing policies that require authentication
DROP POLICY IF EXISTS "Authenticated users can insert review cards" ON review_cards;
DROP POLICY IF EXISTS "Authenticated users can update review cards" ON review_cards;
DROP POLICY IF EXISTS "Authenticated users can delete review cards" ON review_cards;

-- Create new policies that allow public access
CREATE POLICY "Public can insert review cards"
  ON review_cards
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update review cards"
  ON review_cards
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete review cards"
  ON review_cards
  FOR DELETE
  TO public
  USING (true);