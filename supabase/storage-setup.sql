-- Supabase Storage Setup
-- Run this in the Supabase SQL Editor (dashboard.supabase.com → SQL Editor)
-- This creates the storage bucket required for file upload fields in forms.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'form-responses',
  'form-responses',
  true,
  10485760, -- 10 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip'
  ]
)
ON CONFLICT (id) DO NOTHING;
