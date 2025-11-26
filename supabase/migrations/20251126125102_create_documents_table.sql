/*
  # Create documents table for PDF storage metadata

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `name` (text) - document title/name
      - `description` (text) - document description
      - `filename` (text) - original filename
      - `file_url` (text) - Supabase Storage URL
      - `size` (bigint) - file size in bytes
      - `type` (text) - document type/category (structural-floor or underlayment)
      - `product_type` (text) - product type (structural-floor or underlayment)
      - `required` (boolean) - whether document is required
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Notes
    - No RLS as specified
    - product_type field enables filtering by product selection
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  filename text NOT NULL,
  file_url text NOT NULL,
  size bigint DEFAULT 0,
  type text NOT NULL,
  product_type text NOT NULL,
  required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);