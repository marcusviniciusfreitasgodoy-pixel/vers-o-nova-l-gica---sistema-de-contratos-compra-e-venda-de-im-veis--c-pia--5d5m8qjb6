import pb from '@/lib/pocketbase/client'

export const logFrictionEvent = (data: {
  user: string
  case: string
  event_type: 'invalid_attempt' | 'correction_link_click' | 'block_view' | 'success_resolution'
  context_data?: any
}) => {
  return pb
    .collection('friction_logs')
    .create(data)
    .catch((err) => {
      console.error('Failed to log friction event', err)
    })
}
