import { useCallback, useEffect, useState } from 'react'
import { App } from 'antd'
import { listUsers } from '../api/users'
import type { Paginated, UserListParams, UserRow } from '../api/users'
import type { ApiError } from '../api/client'

export function useUserList(initial: UserListParams) {
  const { message } = App.useApp()
  const [params, setParams] = useState<UserListParams>(initial)
  const [data, setData] = useState<Paginated<UserRow>>()
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setData(await listUsers(params))
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setLoading(false)
    }
  }, [params, message])

  useEffect(() => {
    reload()
  }, [reload])

  const updateParams = (next: Partial<UserListParams>) =>
    setParams((prev) => ({ ...prev, page: 1, ...next }))

  return { params, data, loading, reload, updateParams }
}