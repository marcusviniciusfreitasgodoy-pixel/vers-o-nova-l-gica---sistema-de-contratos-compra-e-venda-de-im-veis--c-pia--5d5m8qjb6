import pb from '@/lib/pocketbase/client'

export async function getLogoBase64(userDetails: any): Promise<string | null> {
  if (!userDetails?.imobiliaria_logo || !userDetails?.collectionId || !userDetails?.id) {
    return null
  }
  try {
    const logoUrl = pb.files.getURL(userDetails, userDetails.imobiliaria_logo)
    const res = await fetch(logoUrl)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.error('Failed to load logo', e)
    return null
  }
}
