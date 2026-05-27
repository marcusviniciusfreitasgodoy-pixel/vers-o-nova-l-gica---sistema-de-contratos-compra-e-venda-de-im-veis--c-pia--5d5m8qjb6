import pb from '@/lib/pocketbase/client'

export const updateUserProfile = async (id: string, data: any) => {
  // Using explicit endpoint format as required by compliance and routing rules
  const record = await pb.send(`/api/collections/users/records/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })

  if (pb.authStore.record?.id === id) {
    await pb.collection('users').authRefresh()
  }
  return record
}
