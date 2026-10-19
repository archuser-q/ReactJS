/**
 * Báo giá phát sinh = danh sách mục như một hóa đơn nhỏ (giống thợ báo giá thật ngoài đời):
 *  - Mục trong bảng giá chung: GIÁ CỐ ĐỊNH, thợ chỉ chọn số lượng -> khách yên tâm, không bị "hét giá"
 *  - Mục khác (hàng khác loại/khác hãng, việc ngoài bảng giá): thợ tự nhập tên + đơn giá
 * Gửi đi 1 báo giá gồm nhiều mục; khách đồng ý trên app thì mới cộng vào hóa đơn.
 * API giữ nguyên { description, amount } nên app khách / web quản trị không phải sửa:
 * nội dung ghi rõ từng mục, VD "Aptomat 1 cực 16–32A x2: 190.000đ; Công lắp thêm 1 điểm: 50.000đ".
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { Button } from '../../components/Button';
import { Chip, TextField } from '../../components/Form';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/Overlay';
import { colors, radius, tabular } from '../../theme';
import { formatVnd, money } from '../../utils/format';
import { PRICE_LIST } from '../../utils/priceList';

type Line = { key: string; name: string; price: number; qty: number; custom?: boolean };

const MAX_LINES = 8;
const MAX_QTY = 20;
/** Khớp giới hạn độ dài nội dung báo giá của backend */
const DESC_MAX = 500;

export function quoteDescription(lines: Line[]) {
  return lines.map((l) => `${l.name}${l.qty > 1 ? ` x${l.qty}` : ''}: ${money(l.price * l.qty)}`).join('; ');
}

export function QuoteSheet({
  visible,
  onClose,
  rate,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  /** Tỷ lệ phí nền tảng (0,15) để báo thợ nhận thêm bao nhiêu */
  rate: number;
  /** Trả về true nếu gửi thành công */
  onSubmit: (desc: string, amount: number) => Promise<boolean>;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [group, setGroup] = useState(0);
  const [customOpen, setCustomOpen] = useState(false);
  const [cName, setCName] = useState('');
  const [cPrice, setCPrice] = useState('');
  const [busy, setBusy] = useState(false);

  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const desc = quoteDescription(lines);
  const tooLong = desc.length > DESC_MAX;
  const full = lines.length >= MAX_LINES;
  const cValue = parseInt(cPrice.replace(/\D/g, '') || '0', 10);
  const qtyOf = (key: string) => lines.find((l) => l.key === key)?.qty ?? 0;

  const setQty = (item: Omit<Line, 'qty'>, qty: number) =>
    setLines((ls) => {
      const i = ls.findIndex((l) => l.key === item.key);
      if (qty <= 0) return ls.filter((l) => l.key !== item.key);
      if (i < 0) return ls.length >= MAX_LINES ? ls : [...ls, { ...item, qty: 1 }];
      const next = [...ls];
      next[i] = { ...next[i], qty: Math.min(MAX_QTY, qty) };
      return next;
    });

  const addCustom = () => {
    if (cName.trim().length < 3 || cValue <= 0 || full) return;
    setQty({ key: `c-${Date.now()}`, name: cName.trim(), price: cValue, custom: true }, 1);
    setCName('');
    setCPrice('');
    setCustomOpen(false);
  };

  const submit = async () => {
    if (!lines.length || tooLong) return;
    setBusy(true);
    try {
      if (await onSubmit(desc, total)) {
        setLines([]);
        setCustomOpen(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const g = PRICE_LIST[group];

  return (
    <Sheet visible={visible} onClose={onClose} title="Báo giá phát sinh">
      <Text style={styles.note}>
        Chọn vật tư, công việc cần làm thêm. Giá theo bảng giá chung của Thợ Nhanh nên không sửa được; hàng khác loại, khác hãng thì thêm ở “Mục
        ngoài bảng giá”.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
        {PRICE_LIST.map((x, i) => (
          <Chip key={x.group} label={x.group} selected={group === i} onPress={() => setGroup(i)} />
        ))}
      </ScrollView>

      <View style={{ gap: 6 }}>
        {g.items.map((it) => {
          const key = `${g.group}/${it.name}`;
          const qty = qtyOf(key);
          return (
            <View key={key} style={[styles.row, qty > 0 && styles.rowOn]}>
              <Icon name={g.icon} size={18} color={qty > 0 ? colors.success : colors.muted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{it.name}</Text>
                <Text style={styles.price}>{money(it.price)}</Text>
              </View>
              {qty > 0 ? (
                <Stepper value={qty} onChange={(n) => setQty({ key, name: it.name, price: it.price }, n)} />
              ) : (
                <Pressable
                  onPress={() => setQty({ key, name: it.name, price: it.price }, 1)}
                  disabled={full}
                  style={[styles.add, full && { opacity: 0.4 }]}
                  hitSlop={6}
                  accessibilityLabel={`Thêm ${it.name}`}
                >
                  <Icon name="plus" size={18} color={colors.primary} />
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      {customOpen ? (
        <View style={styles.custom}>
          <Text style={styles.customTitle}>Mục ngoài bảng giá</Text>
          <TextField label="Tên vật tư / công việc" value={cName} onChangeText={setCName} placeholder="VD: Aptomat Panasonic 2 cực 40A" maxLength={80} />
          <TextField
            label="Đơn giá"
            value={cValue ? formatVnd(cValue) : ''}
            onChangeText={setCPrice}
            keyboardType="number-pad"
            placeholder="0"
            suffix="đ"
            style={{ fontVariant: ['tabular-nums'], fontWeight: '700' }}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Hủy" variant="outline" onPress={() => setCustomOpen(false)} style={{ flex: 1 }} />
            <Button title="Thêm vào báo giá" onPress={addCustom} disabled={cName.trim().length < 3 || cValue <= 0 || full} style={{ flex: 2 }} />
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setCustomOpen(true)} disabled={full} style={[styles.customBtn, full && { opacity: 0.4 }]}>
          <Icon name="pencil-plus-outline" size={18} color={colors.primary} />
          <Text style={styles.customBtnText}>Mục ngoài bảng giá (tự nhập giá)</Text>
        </Pressable>
      )}

      {lines.length ? (
        <View style={styles.summary}>
          <Text style={styles.sumTitle}>Báo giá gửi khách ({lines.length} mục)</Text>
          {lines.map((l) => (
            <View key={l.key} style={styles.sumRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sumName}>
                  {l.name}
                  {l.qty > 1 ? ` x${l.qty}` : ''}
                </Text>
                {l.custom ? <Text style={styles.sumTag}>Giá do bạn nhập</Text> : null}
              </View>
              <Text style={styles.sumAmt}>{money(l.price * l.qty)}</Text>
              <Pressable onPress={() => setQty(l, 0)} hitSlop={8} accessibilityLabel={`Bỏ ${l.name}`}>
                <Icon name="close-circle" size={18} color={colors.faint} />
              </Pressable>
            </View>
          ))}
          <View style={styles.sumLine} />
          <View style={styles.sumRow}>
            <Text style={styles.totalLabel}>Khách trả thêm</Text>
            <Text style={styles.totalValue}>{money(total)}</Text>
          </View>
          <Text style={styles.earn}>
            Khách đồng ý thì bạn nhận thêm {money(Math.round(total * (1 - rate)))} (sau phí {Math.round(rate * 100)}%).
          </Text>
          {tooLong ? <Text style={styles.warn}>Báo giá quá dài, hãy gộp bớt mục.</Text> : null}
        </View>
      ) : null}

      <Button title={lines.length ? `Gửi báo giá ${money(total)}` : 'Chọn ít nhất 1 mục'} onPress={submit} loading={busy} disabled={!lines.length || tooLong} size="lg" />
    </Sheet>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={() => onChange(value - 1)} style={styles.stepBtn} hitSlop={4} accessibilityLabel="Bớt 1">
        <Icon name={value <= 1 ? 'trash-can-outline' : 'minus'} size={16} color={colors.navy} />
      </Pressable>
      <Text style={styles.stepVal}>{value}</Text>
      <Pressable onPress={() => onChange(value + 1)} disabled={value >= MAX_QTY} style={styles.stepBtn} hitSlop={4} accessibilityLabel="Thêm 1">
        <Icon name="plus" size={16} color={colors.navy} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: colors.bg },
  rowOn: { backgroundColor: colors.successBg },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  price: { fontSize: 13, fontWeight: '700', color: colors.body, marginTop: 1, ...tabular },
  add: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 17, borderWidth: 1, borderColor: colors.border },
  stepBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  stepVal: { minWidth: 20, textAlign: 'center', fontSize: 15, fontWeight: '800', color: colors.text, ...tabular },
  customBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primaryMuted,
  },
  customBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  custom: { gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: colors.bg },
  customTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  summary: { gap: 8, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  sumTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  sumRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sumName: { fontSize: 14, color: colors.body },
  sumTag: { fontSize: 11, color: colors.warning, fontWeight: '700', marginTop: 1 },
  sumAmt: { fontSize: 14, fontWeight: '700', color: colors.text, ...tabular },
  sumLine: { height: 1, backgroundColor: colors.line, marginVertical: 2 },
  totalLabel: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.text, ...tabular },
  earn: { fontSize: 13, color: colors.success, fontWeight: '600' },
  warn: { fontSize: 13, color: colors.danger, fontWeight: '600' },
});
