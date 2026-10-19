/**
 * Bảng giá vật tư & công tham khảo (Hà Nội) — giúp thợ báo giá phát sinh nhanh, nhất quán.
 * Chỉ để gợi ý: thợ vẫn sửa được nội dung/số tiền trước khi gửi, và khách phải đồng ý trên app.
 */
export type PriceItem = { name: string; price: number };
export type PriceGroup = { group: string; icon: 'toggle-switch-outline' | 'power-socket-de' | 'cable-data' | 'lightbulb-on-outline' | 'account-hard-hat'; items: PriceItem[] };

export const PRICE_LIST: PriceGroup[] = [
  {
    group: 'Thiết bị đóng cắt',
    icon: 'toggle-switch-outline',
    items: [
      { name: 'Aptomat 1 cực 16–32A', price: 95_000 },
      { name: 'Aptomat 2 cực 32A', price: 180_000 },
      { name: 'Aptomat chống giật RCBO 20A', price: 380_000 },
      { name: 'Aptomat tổng 2 cực 63A', price: 320_000 },
    ],
  },
  {
    group: 'Ổ cắm, công tắc',
    icon: 'power-socket-de',
    items: [
      { name: 'Ổ cắm đôi 3 chấu', price: 85_000 },
      { name: 'Công tắc đơn', price: 45_000 },
      { name: 'Công tắc 2 chiều', price: 60_000 },
      { name: 'Mặt + đế âm tường', price: 35_000 },
    ],
  },
  {
    group: 'Dây, ống luồn',
    icon: 'cable-data',
    items: [
      { name: 'Dây điện 1.5mm² (10 m)', price: 80_000 },
      { name: 'Dây điện 2.5mm² (10 m)', price: 120_000 },
      { name: 'Ống luồn dây 20mm (5 cây)', price: 110_000 },
      { name: 'Hộp nối, băng keo cách điện', price: 30_000 },
    ],
  },
  {
    group: 'Đèn, quạt',
    icon: 'lightbulb-on-outline',
    items: [
      { name: 'Đèn LED âm trần 9W', price: 95_000 },
      { name: 'Đèn tuýp LED 1,2 m', price: 120_000 },
      { name: 'Tụ quạt 1,5–2,5µF', price: 50_000 },
      { name: 'Chấn lưu, chuột đèn', price: 40_000 },
    ],
  },
  {
    group: 'Công thợ',
    icon: 'account-hard-hat',
    items: [
      { name: 'Công đi dây nổi (5 m)', price: 125_000 },
      { name: 'Công đục tường đi dây âm (2 m)', price: 200_000 },
      { name: 'Công lắp thêm 1 điểm', price: 50_000 },
      { name: 'Phụ phí làm sau 21h', price: 100_000 },
    ],
  },
];
