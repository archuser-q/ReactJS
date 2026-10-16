import { Flex, InputNumber, Slider } from 'antd'

type Props = { value?: number; onChange?: (value: number) => void }

export default function WeightInput({ value = 0, onChange }: Props) {
  const percent = Math.round(value * 100)
  const emit = (v: number | null) => onChange?.(Math.max(0, Math.min(100, v ?? 0)) / 100)

  return (
    <Flex gap={12} align="center">
      <Slider min={0} max={100} value={percent} onChange={emit} style={{ flex: 1 }} />
      <InputNumber min={0} max={100} value={percent} onChange={emit} suffix="%" />
    </Flex>
  )
}