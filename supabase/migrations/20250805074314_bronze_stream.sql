/*
  # Create API configurations table

  1. New Tables
    - `api_configurations`
      - `id` (uuid, primary key)
      - `name` (text, not null) - Configuration name
      - `provider` (text, not null) - 'gemini' or 'openai'
      - `api_key` (text, not null) - API key for the provider
      - `model` (text, not null) - Model name (e.g., 'gemini-2.0-flash', 'gpt-4o')
      - `is_active` (boolean, default true) - Whether this config is active
      - `priority` (integer, default 1) - Priority order (lower = higher priority)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `api_configurations` table
    - Add policies for public access (since we use local auth)
*/

CREATE TABLE IF NOT EXISTS api_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('gemini', 'openai')),
  api_key text NOT NULL,
  model text NOT NULL,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can read api configurations"
  ON api_configurations
  FOR SELECT
  TO public
  USING (true);

-- Allow public insert access
CREATE POLICY "Public can insert api configurations"
  ON api_configurations
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public update access
CREATE POLICY "Public can update api configurations"
  ON api_configurations
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public delete access
CREATE POLICY "Public can delete api configurations"
  ON api_configurations
  FOR DELETE
  TO public
  USING (true);

-- Create index for faster priority-based queries
CREATE INDEX IF NOT EXISTS idx_api_configurations_priority ON api_configurations(priority, is_active);

-- Create index for faster provider filtering
CREATE INDEX IF NOT EXISTS idx_api_configurations_provider ON api_configurations(provider);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_api_configurations_updated_at
    BEFORE UPDATE ON api_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();