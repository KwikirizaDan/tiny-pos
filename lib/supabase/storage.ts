import { createClient } from './client'

export async function uploadProductImage(file: File) {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
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
