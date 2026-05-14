import { createClient } from './client'

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE = 5 * 1024 * 1024

export async function uploadProductImage(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF")
  }
  if (file.size > MAX_SIZE) {
    throw new Error("File too large. Maximum size is 5MB")
  }

  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `products/${fileName}`

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file)

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  return publicUrl
}
