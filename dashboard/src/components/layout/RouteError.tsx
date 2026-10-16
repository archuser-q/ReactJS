import { Button, Result } from 'antd'
import { useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

export default function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const message = (error as { message?: string })?.message ?? 'Đã có lỗi xảy ra'

  return (
    <Result
      status="error"
      title="Không tải được trang"
      subTitle={message}
      extra={
        <Button
          type="primary"
          onClick={() => {
            reset()
            router.invalidate()
          }}
        >
          Thử lại
        </Button>
      }
    />
  )
}