import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { App, Col, Flex, Row, Skeleton, Typography } from 'antd'
import dayjs from 'dayjs'
import { getReport } from '../../api/reports'
import type { Report, ReportParams } from '../../api/reports'
import type { ApiError } from '../../api/client'
import ReportFilters from '../../components/reports/ReportFilters'
import ReportSummary from '../../components/reports/ReportSummary'
import RevenueChart from '../../components/reports/RevenueChart'
import OrdersChart from '../../components/reports/OrdersChart'
import CategoryChart from '../../components/reports/CategoryChart'
import { CancelReasonsTable, MatchingTable, TopWorkersTable } from '../../components/reports/ReportTables'

export const Route = createFileRoute('/_admin/reports')({
  component: ReportsPage,
})

const MAX_DAYS = { day: 92, week: 366, month: 1100 }

function ReportsPage() {
  const { message } = App.useApp()
  const [params, setParams] = useState<ReportParams>({
    from: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD'),
    groupBy: 'day',
  })
  const [report, setReport] = useState<Report>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getReport(params)
      .then(setReport)
      .catch((e: ApiError) => message.error(e.message))
      .finally(() => setLoading(false))
  }, [params, message])

  const updateParams = (next: Partial<ReportParams>) => {
    setParams((prev) => {
      const merged = { ...prev, ...next }
      const days = dayjs(merged.to).diff(dayjs(merged.from), 'day') + 1
      if (days > MAX_DAYS[merged.groupBy]) {
        merged.groupBy = days > MAX_DAYS.week ? 'month' : 'week'
      }
      return merged
    })
  }

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={12}>
        <Typography.Title level={3}>Thống kê báo cáo</Typography.Title>
        <ReportFilters params={params} onChange={updateParams} />
      </Flex>

      {!report ? (
        <Skeleton active paragraph={{ rows: 12 }} />
      ) : (
        <Flex vertical gap={16} style={{ opacity: loading ? 0.6 : 1 }}>
          <ReportSummary summary={report.summary} />
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={12}>
              <RevenueChart report={report} />
            </Col>
            <Col xs={24} xl={12}>
              <OrdersChart report={report} />
            </Col>
            <Col xs={24} xl={12}>
              <CategoryChart categories={report.categories} />
            </Col>
            <Col xs={24} xl={12}>
              <Flex vertical gap={16}>
                <MatchingTable matching={report.matching} />
                <CancelReasonsTable reasons={report.cancelReasons} />
              </Flex>
            </Col>
            <Col span={24}>
              <TopWorkersTable workers={report.topWorkers} />
            </Col>
          </Row>
        </Flex>
      )}
    </Flex>
  )
}