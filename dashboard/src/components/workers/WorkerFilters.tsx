import { Input, Select, Space } from 'antd'
import type { UserStatus } from '../../api/users'
import type { Verification, WorkerListParams } from '../../api/workers'
import { USER_STATUS } from '../../constants/user'
import { VERIFICATION } from '../../constants/worker'

type Props = { onChange: (next: Partial<WorkerListParams>) => void }

export default function WorkerFilters({ onChange }: Props) {
  return (
    <Space wrap>
      <Input.Search
        placeholder="Tìm theo tên, email, số điện thoại"
        allowClear
        enterButton
        onSearch={(value) => onChange({ search: value || undefined })}
      />
      <Select<Verification>
        placeholder="Hồ sơ"
        allowClear
        onChange={(value) => onChange({ verification: value })}
        options={Object.entries(VERIFICATION).map(([value, v]) => ({ value: value as Verification, label: v.label }))}
      />
      <Select<UserStatus>
        placeholder="Tài khoản"
        allowClear
        onChange={(value) => onChange({ status: value })}
        options={Object.entries(USER_STATUS).map(([value, s]) => ({ value: value as UserStatus, label: s.label }))}
      />
    </Space>
  )
}