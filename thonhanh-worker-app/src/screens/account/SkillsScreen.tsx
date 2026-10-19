import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errMsg, qk } from '../../api';
import { useWorkerMe } from '../../auth/AuthContext';
import { Banner } from '../../components/Bits';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { useOverlay } from '../../components/Overlay';
import { Header, Screen } from '../../components/Screen';
import { StateView } from '../../components/StateView';
import type { ScreenProps } from '../../navigation/types';
import { colors, radius } from '../../theme';
import { money, serviceIcon } from '../../utils/format';

const MAX_YEARS = 40;
const SHOW_SERVICES = 4;

type Picked = Map<number, number>; // category_id -> số năm kinh nghiệm

const sameSkills = (a: Picked, b: Picked) => a.size === b.size && [...a].every(([id, y]) => b.get(id) === y);
const yearsText = (y: number) => (y === 0 ? 'Dưới 1 năm' : `${y} năm`);

/**
 * Nhóm dịch vụ (danh mục) thợ nhận làm + số năm kinh nghiệm từng nhóm.
 * Hệ thống chỉ gửi đơn thuộc các nhóm đã chọn; số năm kinh nghiệm là tiêu chí "kỹ năng" khi ghép đơn.
 *
 * Mặc định ở chế độ XEM (chạm nhầm khi cuộn không đổi gì); bấm "Sửa" mới tick / chỉnh số năm,
 * "Lưu" chỉ bật khi có thay đổi. Thợ chưa chọn nhóm nào (đang làm hồ sơ) thì vào thẳng chế độ sửa.
 */
export default function SkillsScreen({ navigation }: ScreenProps<'Skills'>) {
  const me = useWorkerMe();
  const qc = useQueryClient();
  const ui = useOverlay();
  const catalog = useQuery({
    queryKey: qk.catalog,
    queryFn: async () => ({ categories: await api.categories(), services: await api.services() }),
    staleTime: 5 * 60_000,
  });
  const [picked, setPicked] = useState<Picked>(new Map());
  const [editing, setEditing] = useState<boolean | null>(null); // null = chưa biết (đang tải hồ sơ)
  const [firstTime, setFirstTime] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const saved: Picked = useMemo(() => new Map((me.data?.skills ?? []).map((s) => [s.category_id, s.years])), [me.data]);

  useEffect(() => {
    if (!me.data) return;
    if (editing === null) {
      const none = me.data.skills.length === 0;
      setFirstTime(none);
      setEditing(none);
    }
    if (!editing) setPicked(new Map(saved));
  }, [me.data, saved, editing]);

  const groups = useMemo(() => {
    if (!catalog.data) return [];
    return catalog.data.categories
      .map((c) => ({ ...c, services: catalog.data.services.filter((s) => s.category_id === c.id) }))
      .filter((g) => g.services.length);
  }, [catalog.data]);

  if (!catalog.data || !me.data || editing === null) {
    return (
      <Screen>
        <Header title="Nhóm dịch vụ nhận làm" />
        <StateView
          loading={catalog.isLoading || me.isLoading}
          error={catalog.error ? errMsg(catalog.error) : me.error ? errMsg(me.error) : null}
          onRetry={() => void catalog.refetch()}
        />
      </Screen>
    );
  }

  const dirty = !sameSkills(picked, saved);
  const defaultYears = Math.max(1, Math.min(MAX_YEARS, me.data.profile.experience_years || 1));

  const toggle = (id: number) =>
    setPicked((m) => {
      const n = new Map(m);
      if (n.has(id)) n.delete(id);
      else n.set(id, saved.get(id) ?? defaultYears);
      return n;
    });
  const setYears = (id: number, years: number) => setPicked((m) => new Map(m).set(id, Math.max(0, Math.min(MAX_YEARS, years))));
  const toggleExpand = (id: number) => setExpanded((x) => (x.has(id) ? new Set([...x].filter((i) => i !== id)) : new Set(x).add(id)));

  const cancelEdit = async () => {
    if (dirty && !(await ui.confirm({ title: 'Bỏ thay đổi?', message: 'Các nhóm dịch vụ vừa chọn sẽ không được lưu.', confirmText: 'Bỏ thay đổi', tone: 'danger' }))) return;
    if (firstTime) return void navigation.goBack();
    setPicked(new Map(saved));
    setEditing(false);
  };

  const save = async () => {
    if (!picked.size) return void ui.alert('Chưa chọn nhóm dịch vụ', 'Chọn ít nhất 1 nhóm dịch vụ bạn làm được.', 'warning');
    setBusy(true);
    try {
      await api.setSkills([...picked].map(([category_id, years]) => ({ category_id, years })));
      await qc.invalidateQueries({ queryKey: qk.me });
      ui.toast(`Đã lưu ${picked.size} nhóm dịch vụ`);
      if (firstTime) navigation.goBack(); // đang làm hồ sơ: quay lại danh sách các bước
      else setEditing(false);
    } catch (e) {
      void ui.alert('Chưa lưu được', errMsg(e), 'danger');
    } finally {
      setBusy(false);
    }
  };

  const serviceRows = (g: (typeof groups)[number], on: boolean) => {
    const open = expanded.has(g.id);
    const shown = open ? g.services : g.services.slice(0, SHOW_SERVICES);
    return (
      <>
        {shown.map((s) => (
          <View key={s.id} style={[styles.item, styles.line]}>
            <Icon name={serviceIcon(s.name)} size={16} color={on ? colors.primary : colors.faint} />
            <Text style={[styles.name, !on && { color: colors.muted }]} numberOfLines={1}>
              {s.name}
            </Text>
            <Text style={styles.price}>
              {money(s.base_price)}
              {s.unit ? `/${s.unit}` : ''}
            </Text>
          </View>
        ))}
        {g.services.length > SHOW_SERVICES ? (
          <Pressable onPress={() => toggleExpand(g.id)} style={[styles.item, styles.line]} hitSlop={4}>
            <Text style={styles.more}>{open ? 'Thu gọn' : `Xem thêm ${g.services.length - SHOW_SERVICES} dịch vụ`}</Text>
          </Pressable>
        ) : null}
      </>
    );
  };

  // ── Chế độ xem ────────────────────────────────────────────────────────────
  // key khác nhau cho 2 chế độ: dựng mới cây giao diện khi đổi chế độ, không tái dùng nút "Huỷ"/"Lưu"
  // làm nút "Sửa" (Android có lúc không vẽ lại chữ trong nút được tái dùng).
  if (!editing) {
    const mine = groups.filter((g) => saved.has(g.id));
    const others = groups.filter((g) => !saved.has(g.id));
    return (
      <Screen key="view">
        <Header
          title="Nhóm dịch vụ nhận làm"
          subtitle={`${mine.length}/${groups.length} nhóm`}
          right={{ icon: 'map-marker-radius-outline', onPress: () => navigation.navigate('ServiceArea'), label: 'Khu vực nhận việc' }}
        />
        <ScrollView contentContainerStyle={styles.body}>
          <Banner text="Hệ thống chỉ gửi cho bạn đơn thuộc các nhóm dưới đây. Số năm kinh nghiệm ở từng nhóm giúp bạn được ưu tiên khi ghép đơn." />
          {mine.map((g) => (
            <View key={g.id} style={styles.group}>
              <View style={styles.groupHead}>
                <View style={[styles.icon, { backgroundColor: colors.primaryLight }]}>
                  <Icon name={serviceIcon(g.name)} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupTitle}>{g.name}</Text>
                  <Text style={styles.price}>{g.description || `${g.services.length} dịch vụ`}</Text>
                </View>
                <View style={styles.yearsBadge}>
                  <Text style={styles.yearsBadgeText}>{yearsText(saved.get(g.id) ?? 0)}</Text>
                </View>
              </View>
              {serviceRows(g, true)}
            </View>
          ))}
          {others.length ? (
            <View style={styles.others}>
              <Text style={styles.othersTitle}>Chưa nhận</Text>
              {others.map((g) => (
                <View key={g.id} style={styles.otherRow}>
                  <Icon name={serviceIcon(g.name)} size={16} color={colors.faint} />
                  <Text style={styles.otherName}>{g.name}</Text>
                  <Text style={styles.price}>{g.services.length} dịch vụ</Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.footer}>
          <Button title="Sửa nhóm dịch vụ" icon="pencil-outline" variant="secondary" onPress={() => setEditing(true)} size="lg" />
        </View>
      </Screen>
    );
  }

  // ── Chế độ sửa ────────────────────────────────────────────────────────────
  return (
    <Screen key="edit">
      <Header
        title={firstTime ? 'Chọn nhóm dịch vụ' : 'Sửa nhóm dịch vụ'}
        subtitle={`Đã chọn ${picked.size} nhóm${dirty && !firstTime ? ' · chưa lưu' : ''}`}
        onBack={cancelEdit}
      />
      <ScrollView contentContainerStyle={styles.body}>
        <Banner text="Tick nhóm bạn làm được và chỉnh số năm kinh nghiệm ở từng nhóm. Giá là giá tham chiếu của nền tảng; phát sinh vật tư thì gửi báo giá cho khách duyệt." />
        {groups.map((g) => {
          const on = picked.has(g.id);
          const years = picked.get(g.id) ?? 0;
          return (
            <View key={g.id} style={[styles.group, on && styles.groupOn]}>
              <Pressable onPress={() => toggle(g.id)} style={styles.groupHead} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                <View style={[styles.icon, { backgroundColor: on ? colors.primaryLight : colors.line }]}>
                  <Icon name={serviceIcon(g.name)} size={20} color={on ? colors.primary : colors.faint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupTitle}>{g.name}</Text>
                  <Text style={styles.price}>{g.description || `${g.services.length} dịch vụ`}</Text>
                </View>
                <Icon name={on ? 'checkbox-marked' : 'checkbox-blank-outline'} size={26} color={on ? colors.primary : colors.faint} />
              </Pressable>

              {on ? (
                <View style={styles.yearsRow}>
                  <Text style={styles.yearsLabel}>Kinh nghiệm ở nhóm này</Text>
                  <View style={styles.stepper}>
                    <Pressable onPress={() => setYears(g.id, years - 1)} style={styles.stepBtn} hitSlop={6} accessibilityLabel="Bớt 1 năm">
                      <Icon name="minus" size={18} color={years > 0 ? colors.primary : colors.faint} />
                    </Pressable>
                    <Text style={styles.yearsValue}>{yearsText(years)}</Text>
                    <Pressable onPress={() => setYears(g.id, years + 1)} style={styles.stepBtn} hitSlop={6} accessibilityLabel="Thêm 1 năm">
                      <Icon name="plus" size={18} color={colors.primary} />
                    </Pressable>
                  </View>
                </View>
              ) : null}
              {serviceRows(g, on)}
            </View>
          );
        })}
      </ScrollView>
      <View style={[styles.footer, styles.footerRow]}>
        <Button title={firstTime ? 'Để sau' : 'Huỷ'} variant="outline" onPress={cancelEdit} size="lg" style={{ flex: 1 }} />
        <Button title={`Lưu (${picked.size} nhóm)`} onPress={save} loading={busy} disabled={!dirty || !picked.size} size="lg" style={{ flex: 2 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14, paddingBottom: 24 },
  group: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  groupOn: { borderColor: colors.primary },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  groupTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  yearsBadge: { backgroundColor: colors.primaryLight, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  yearsBadgeText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  yearsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 12, gap: 8 },
  yearsLabel: { fontSize: 13, color: colors.muted, flexShrink: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryLight, borderRadius: radius.pill, paddingHorizontal: 4, paddingVertical: 2 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  yearsValue: { minWidth: 82, textAlign: 'center', fontSize: 14, fontWeight: '700', color: colors.primary },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  line: { borderTopWidth: 1, borderTopColor: colors.line },
  name: { flex: 1, fontSize: 14, color: colors.text },
  price: { fontSize: 12, color: colors.faint },
  more: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  others: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  othersTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, marginBottom: 2 },
  otherRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  otherName: { flex: 1, fontSize: 14, color: colors.muted },
  footer: { padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
  footerRow: { flexDirection: 'row', gap: 10 },
});
