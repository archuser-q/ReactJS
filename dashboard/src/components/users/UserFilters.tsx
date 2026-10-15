import { Input, Select, Space } from 'antd'
import type { UserListParams, UserStatus } from '../../api/users'
import { USER_STATUS } from '../../constants/user'

type Props = { onChange: (next: Partial<UserListParams>) => void }

export default function UserFilters({ onChange }: Props) {
  return (
    <Space wrap>
      <Input.Search
        placeholder="Tìm theo tên, email, số điện thoại"
        allowClear
        enterButton
        onSearch={(value) => onChange({ search: value || undefined })}
      />
      <Select<UserStatus>
        placeholder="Trạng thái"
        allowClear
        onChange={(value) => onChange({ status: value })}
        options={Object.entries(USER_STATUS).map(([value, s]) => ({ value: value as UserStatus, label: s.label }))}
      />
    </Space>
  )
}