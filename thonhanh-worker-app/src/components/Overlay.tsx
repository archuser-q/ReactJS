/**
 * Hộp thoại xác nhận, thông báo nhanh (toast), bottom sheet, xem ảnh phóng to.
 * Tự làm thay cho Alert.alert vì Alert của React Native không chạy trên bản web.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { mediaUri } from '../config/env';
import { ZoomImage } from './ZoomImage';
import { colors, radius, shadow } from '../theme';

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

type DialogOptions = {
  title: string;
  message?: string;
  icon?: IconName;
  tone?: 'info' | 'danger' | 'success' | 'warning';
  confirmText?: string;
  cancelText?: string | null;
  /** Danh sách lựa chọn (VD lý do từ chối). Trả về giá trị đã chọn */
  choices?: string[];
};

type DialogState = DialogOptions & { resolve: (v: string | boolean | null) => void };

type OverlayApi = {
  confirm: (o: DialogOptions) => Promise<boolean>;
  alert: (title: string, message?: string, tone?: DialogOptions['tone']) => Promise<void>;
  choose: (o: DialogOptions & { choices: string[] }) => Promise<string | null>;
  toast: (message: string, tone?: 'success' | 'error' | 'info') => void;
  viewImage: (uri: string) => void;
};

const Ctx = createContext<OverlayApi | null>(null);

export function useOverlay(): OverlayApi {
  const c = useContext(Ctx);
  if (!c) throw new Error('useOverlay phải nằm trong <OverlayProvider>');
  return c;
}

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; tone: 'success' | 'error' | 'info'; id: number } | null>(null);
  const [image, setImage] = useState<string | null>(null);

  const clearToast = useCallback(() => setToastMsg(null), []);
  const closeImage = useCallback(() => setImage(null), []);
  const open = useCallback((o: DialogOptions) => new Promise<string | boolean | null>((resolve) => setDialog({ ...o, resolve })), []);
  const close = (v: string | boolean | null) => {
    dialog?.resolve(v);
    setDialog(null);
  };

  const api = useMemo<OverlayApi>(
    () => ({
      confirm: async (o) => (await open(o)) === true,
      alert: async (title, message, tone = 'info') => {
        await open({ title, message, tone, cancelText: null, confirmText: 'Đã hiểu' });
      },
      choose: async (o) => {
        const v = await open(o);
        return typeof v === 'string' ? v : null;
      },
      toast: (text, tone = 'success') => setToastMsg({ text, tone, id: Date.now() }),
      viewImage: (uri) => setImage(uri),
    }),
    [open],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <DialogView state={dialog} onClose={close} />
      <Toast msg={toastMsg} onDone={clearToast} />
      <ImageViewer uri={image} onClose={closeImage} />
    </Ctx.Provider>
  );
}

const TONE: Record<string, { c: string; bg: string; icon: IconName }> = {
  info: { c: colors.primary, bg: colors.primaryLight, icon: 'information-outline' },
  danger: { c: colors.danger, bg: colors.dangerBg, icon: 'alert-circle-outline' },
  warning: { c: colors.warning, bg: colors.warningBg, icon: 'alert-outline' },
  success: { c: colors.success, bg: colors.successBg, icon: 'check-circle-outline' },
};

function DialogView({ state, onClose }: { state: DialogState | null; onClose: (v: string | boolean | null) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => setPicked(null), [state]);
  if (!state) return null;
  const t = TONE[state.tone ?? 'info'];
  const choices = state.choices;
  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => onClose(choices ? null : false)}>
      <Pressable style={styles.backdrop} onPress={() => onClose(choices ? null : false)}>
        <Pressable style={styles.dialog} onPress={() => undefined}>
          <View style={[styles.dialogIcon, { backgroundColor: t.bg }]}>
            <Icon name={state.icon ?? t.icon} size={26} color={t.c} />
          </View>
          <Text style={styles.dialogTitle}>{state.title}</Text>
          {state.message ? <Text style={styles.dialogMsg}>{state.message}</Text> : null}
          {choices ? (
            <ScrollView style={{ maxHeight: 280, alignSelf: 'stretch' }} contentContainerStyle={{ gap: 8, paddingTop: 4 }}>
              {choices.map((c) => (
                <Pressable key={c} onPress={() => setPicked(c)} style={[styles.choice, picked === c && styles.choiceOn]}>
                  <Icon name={picked === c ? 'radiobox-marked' : 'radiobox-blank'} size={20} color={picked === c ? colors.primary : colors.faint} />
                  <Text style={[styles.choiceText, picked === c && { color: colors.primary }]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          <View style={styles.dialogBtns}>
            {state.cancelText !== null ? (
              <Button title={state.cancelText ?? 'Hủy'} variant="outline" onPress={() => onClose(choices ? null : false)} style={{ flex: 1 }} />
            ) : null}
            <Button
              title={state.confirmText ?? 'Đồng ý'}
              variant={state.tone === 'danger' ? 'dark' : 'primary'}
              disabled={!!choices && !picked}
              onPress={() => onClose(choices ? picked : true)}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Toast({ msg, onDone }: { msg: { text: string; tone: string; id: number } | null; onDone: () => void }) {
  const y = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!msg) return;
    y.setValue(0);
    Animated.timing(y, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(y, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onDone());
    }, 2600);
    return () => clearTimeout(t);
  }, [msg, y, onDone]);
  if (!msg) return null;
  const tone = msg.tone === 'error' ? TONE.danger : msg.tone === 'info' ? TONE.info : TONE.success;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        { top: insets.top + 10, opacity: y, transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
      ]}
    >
      <Icon name={tone.icon} size={20} color={tone.c} />
      <Text style={styles.toastText}>{msg.text}</Text>
    </Animated.View>
  );
}

function ImageViewer({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  if (!uri) return null;
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.viewer}>
        <View style={{ flex: 1, alignSelf: 'stretch' }}>
          <ZoomImage uri={mediaUri(uri)} />
        </View>
        <Text style={[styles.viewerHint, { bottom: insets.bottom + 16 }]}>Chụm 2 ngón để phóng to</Text>
        <Pressable onPress={onClose} style={[styles.viewerClose, { top: insets.top + 12 }]} hitSlop={10} accessibilityLabel="Đóng ảnh">
          <Icon name="close" size={22} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Bottom sheet
// ---------------------------------------------------------------------------

export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetWrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.grabber} />
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.sheetClose}>
              <Icon name="close" size={18} color={colors.body} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8, gap: 14 }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(17,24,39,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 380, backgroundColor: colors.white, borderRadius: radius.xxl, padding: 22, alignItems: 'center', gap: 10, ...shadow.lg },
  dialogIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dialogTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  dialogMsg: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  dialogBtns: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 8 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  choiceOn: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  choiceText: { fontSize: 14, color: colors.body, fontWeight: '600', flex: 1 },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    zIndex: 1000,
    ...shadow.md,
  },
  toastText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  viewer: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  viewerClose: { position: 'absolute', right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  viewerHint: { position: 'absolute', alignSelf: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17,24,39,0.5)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginTop: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  sheetTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.text },
  sheetClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.line, alignItems: 'center', justifyContent: 'center' },
});
