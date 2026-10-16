import { useCallback, useEffect, useState } from 'react'
import { App } from 'antd'
import type { Paginated } from '../api/users'
import type { ApiError } from '../api/client'

type BaseParams = { page: number; pageSize: number }

export function usePagedList<T, P extends BaseParams>(fetcher: (params: P) => Promise<Paginated<T>>, initial: P) {
  const { message } = App.useApp()
  const [params, setParams] = useState<P>(initial)
  const [data, setData] = useState<Paginated<T>>()
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setData(await fetcher(params))
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setLoading(false)
    }
  }, [fetcher, params, message])

  useEffect(() => {
    reload()
  }, [reload])

  const updateParams = (next: Partial<P>) => setParams((prev) => ({ ...prev, page: 1, ...next }))

  return { params, data, loading, reload, updateParams }
}