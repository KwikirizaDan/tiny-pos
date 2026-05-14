-- Ensure product-images bucket exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'product-images', 'product-images', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'product-images'
);

-- Allow authenticated users to upload images
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg'
         OR storage.extension(name) = 'png' OR storage.extension(name) = 'webp'
         OR storage.extension(name) = 'gif')
  );

-- Allow public access to read product images
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');
