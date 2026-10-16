import { DatePicker, Segmented, Space } from 'antd'
import dayjs from 'dayjs'
import type { GroupBy, ReportParams } from '../../api/reports'

type Props = { params: ReportParams; onChange: (next: Partial<ReportParams>) => void }

const presets = [
  { label: '7 ngày qua', value: [dayjs().subtract(6, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '30 ngày qua', value: [dayjs().subtract(29, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '90 ngày qua', value: [dayjs().subtract(89, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: 'Năm nay', value: [dayjs().startOf('year'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
]

export default function ReportFilters({ params, onChange }: Props) {
  return (
    <Space wrap>
      <DatePicker.RangePicker
        format="DD/MM/YYYY"
        allowClear={false}
        presets={presets}
        value={[dayjs(params.from), dayjs(params.to)]}
        disabledDate={(d) => d.isAfter(dayjs(), 'day')}
        onChange={(dates) => {
          if (dates?.[0] && dates[1]) {
            onChange({ from: dates[0].format('YYYY-MM-DD'), to: dates[1].format('YYYY-MM-DD') })
          }
        }}
      />
      <Segmented<GroupBy>
        value={params.groupBy}
        onChange={(groupBy) => onChange({ groupBy })}
        options={[
          { value: 'day', label: 'Theo ngày' },
          { value: 'week', label: 'Theo tuần' },
          { value: 'month', label: 'Theo tháng' },
        ]}
      />
    </Space>
  )
}