import { useCallback, useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { App, Col, Flex, Row, Typography } from 'antd'
import { listCategories } from '../../api/catalog'
import type { Category } from '../../api/catalog'
import type { ApiError } from '../../api/client'
import CategoryPanel from '../../components/category/CategoryPanel'
import ServicePanel from '../../components/category/ServicePanel'

export const Route = createFileRoute('/_admin/services')({
  component: ServicesPage,
})

function ServicesPage() {
  const { message } = App.useApp()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<number>()

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      setCategories(await listCategories())
    } catch (e) {
      message.error((e as ApiError).message)
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={3}>Dịch vụ & bảng giá</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={8}>
          <CategoryPanel
            categories={categories}
            loading={loading}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChanged={loadCategories}
          />
        </Col>
        <Col xs={24} xl={16}>
          <ServicePanel categories={categories} categoryId={selectedId} onChanged={loadCategories} />
        </Col>
      </Row>
    </Flex>
  )
}