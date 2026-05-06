UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'model/gltf-binary',
  'model/step',
  'application/step',
  'application/octet-stream'
]
WHERE id = 'engineering-drawings';
