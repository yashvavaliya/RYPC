/*
  # Add services field to review_cards table

  1. Changes
    - Add `services` column to `review_cards` table as text array
    - This will store the business services/highlights that customers can select when writing reviews

  2. Notes
    - Services field is optional and can be null
    - Will store an array of strings representing different services/aspects customers can highlight
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'review_cards' AND column_name = 'services'
  ) THEN
    ALTER TABLE review_cards ADD COLUMN services text[];
  END IF;
END $$;

-- Create index for faster service-based queries
CREATE INDEX IF NOT EXISTS idx_review_cards_services ON review_cards USING GIN(services);