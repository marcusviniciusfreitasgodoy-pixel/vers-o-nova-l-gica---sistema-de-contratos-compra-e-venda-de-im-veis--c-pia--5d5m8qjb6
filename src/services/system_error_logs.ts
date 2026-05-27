import pb from '@/lib/pocketbase/client'

export interface SystemErrorLog {
  id?: string
  user?: string
  error_message: string
  stack_trace?: string
  component?: string
  route?: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  context_data?: Record<string, any>
  created?: string
  updated?: string
  expand?: {
    user?: {
      id: string
      name: string
      email: string
    }
  }
}

export const logSystemError = async (data: Omit<SystemErrorLog, 'id' | 'created' | 'updated'>) => {
  try {
    const payload = {
      ...data,
      user: data.user || (pb.authStore.isValid ? pb.authStore.model?.id : undefined),
      route: data.route || window.location.pathname,
    }
    await pb.collection('system_error_logs').create(payload)
  } catch (err) {
    console.error('Failed to log system error:', err)
  }
}

export const getSystemErrorLogs = async (page = 1, perPage = 50, filter = '') => {
  return pb.collection('system_error_logs').getList<SystemErrorLog>(page, perPage, {
    sort: '-created',
    filter,
    expand: 'user',
  })
}
