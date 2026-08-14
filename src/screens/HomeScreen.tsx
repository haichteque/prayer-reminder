import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Modal, TextInput, Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useSettingsStore, PrayerOffsets } from '../store/useSettingsStore';
import { getPrayerTimesForDate, DailyPrayerTimes } from '../services/PrayerTimeService';
import { schedulePrayerNotifications, requestNotificationPermission, checkExactAlarmPermission } from '../services/NotificationService';
import { Feather } from '@expo/vector-icons';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       '#0A0A0A',
  surface:  '#141414',
  border:   '#222222',
  accent:   '#6366f1',
  textPri:  '#F8FAFC',
  textSec:  '#64748B',
  textMut:  '#334155',
};

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
type PrayerName = typeof PRAYERS[number];

const MAX_OFFSET = 120;

type Props = { navigation: NativeStackNavigationProp<any, any> };

export default function HomeScreen({ navigation }: Props) {
  const {
    location, setLocation,
    madhab,
    reminderMode, setReminderMode,
    offsets, setOffset,
    manualPrayerTimes, setManualPrayerTime, syncManualPrayerTimes,
    use24HourClock,
    selectedSound,
  } = useSettingsStore();

  const [prayerTimes, setPrayerTimes]       = useState<DailyPrayerTimes | null>(null);
  const [loading, setLoading]               = useState(false);
  const [cityName, setCityName]             = useState<string>('Current Location');
  const [nextPrayerName, setNextPrayerName] = useState<string | null>(null);
  const [nextPrayerInfo, setNextPrayerInfo] = useState<{ name: string; timeDiff: string } | null>(null);

  // Modal: which prayer is being edited, and which mode (time | offset)
  const [editPrayer, setEditPrayer]   = useState<PrayerName | null>(null);
  const [editMode, setEditMode]       = useState<'time' | 'offset'>('time');
  const [tempHours, setTempHours]     = useState<string>('');
  const [tempMinutes, setTempMinutes] = useState<string>('');
  const [tempAmPm, setTempAmPm]       = useState<'AM' | 'PM'>('AM');
  const [tempOffsetText, setTempOffsetText] = useState<string>('0');

  // ── Permission & location boot ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        setLoading(false);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      const notifGranted = await requestNotificationPermission();
      if (!notifGranted) {
        console.warn('Notification permissions not granted');
      } else {
        await checkExactAlarmPermission();
      }
      let currentLoc;
      try {
        currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } catch {
        currentLoc = await Location.getLastKnownPositionAsync({});
      }
      if (!currentLoc) {
        alert('Could not fetch location. Please ensure location services are enabled.');
        setLoading(false);
        return;
      }
      const newLoc = { latitude: currentLoc.coords.latitude, longitude: currentLoc.coords.longitude };
      setLocation(newLoc);
      try {
        const geocode = await Location.reverseGeocodeAsync(newLoc);
        if (geocode?.length > 0) {
          const p = geocode[0];
          setCityName(p.city || p.region || p.country || 'Current Location');
        }
      } catch { /* silent */ }
      await schedulePrayerNotifications(newLoc, madhab, reminderMode, offsets, manualPrayerTimes, selectedSound, 7);
      setLoading(false);
    })();
  }, []);

  // ── Prayer times ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!location) return;
    const autoTimes = getPrayerTimesForDate(new Date(), location, madhab);
    if (reminderMode === 'Manual' && manualPrayerTimes) {
      const build = (hm: { hours: number; minutes: number }) => {
        const d = new Date(); d.setHours(hm.hours, hm.minutes, 0, 0); return d;
      };
      setPrayerTimes({
        fajr:    build(manualPrayerTimes.Fajr),
        sunrise: build(manualPrayerTimes.Sunrise),
        dhuhr:   build(manualPrayerTimes.Dhuhr),
        asr:     build(manualPrayerTimes.Asr),
        sunset:  autoTimes.sunset,
        maghrib: build(manualPrayerTimes.Maghrib),
        isha:    build(manualPrayerTimes.Isha),
      });
    } else {
      setPrayerTimes(autoTimes);
    }
  }, [location, madhab, reminderMode, manualPrayerTimes]);

  useEffect(() => {
    if (location) {
      schedulePrayerNotifications(location, madhab, reminderMode, offsets, manualPrayerTimes, selectedSound, 7);
    }
  }, [reminderMode, offsets, manualPrayerTimes, selectedSound]);

  // ── Countdown timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!prayerTimes) return;
    const timer = setInterval(() => {
      const now = new Date();
      const list = [
        { name: 'Fajr',                                             time: prayerTimes.fajr },
        { name: 'Sunrise',                                          time: prayerTimes.sunrise },
        { name: now.getDay() === 5 ? 'Jummah' : 'Dhuhr',          time: prayerTimes.dhuhr },
        { name: 'Asr',                                             time: prayerTimes.asr },
        { name: 'Maghrib',                                         time: prayerTimes.maghrib },
        { name: 'Isha',                                            time: prayerTimes.isha },
      ];
      let next = list.find(p => p.time > now);
      if (!next) {
        const tmrw = new Date(prayerTimes.fajr); tmrw.setDate(tmrw.getDate() + 1);
        next = { name: 'Fajr', time: tmrw };
      }
      setNextPrayerName(next.name);
      const diff = next.time.getTime() - now.getTime();
      if (diff <= 0) { setNextPrayerInfo(null); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      let str = '';
      if (h > 0) str += `${h}h `;
      if (m > 0 || h > 0) str += `${m}m `;
      str += `${s}s`;
      setNextPrayerInfo({ name: next.name, timeDiff: str });
    }, 1000);
    return () => clearInterval(timer);
  }, [prayerTimes]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fmt = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !use24HourClock });

  // Open modal: tapping in Auto → offset editor; in Manual → time editor
  const openPrayerEditor = (prayer: PrayerName) => {
    setEditPrayer(prayer);
    if (reminderMode === 'Auto') {
      setEditMode('offset');
      setTempOffsetText(String(offsets[prayer] ?? 0));
    } else {
      setEditMode('time');
      const cur = manualPrayerTimes?.[prayer] || { hours: 12, minutes: 0 };
      if (use24HourClock) {
        setTempHours(String(cur.hours).padStart(2, '0'));
        setTempAmPm('AM');
      } else {
        setTempAmPm(cur.hours >= 12 ? 'PM' : 'AM');
        let h12 = cur.hours % 12; if (h12 === 0) h12 = 12;
        setTempHours(String(h12).padStart(2, '0'));
      }
      setTempMinutes(String(cur.minutes).padStart(2, '0'));
      // Also pre-load offset tab
      setTempOffsetText(String(offsets[prayer] ?? 0));
    }
  };

  const saveModal = () => {
    if (!editPrayer) return;
    // Always save offset regardless of tab (if user switched tabs)
    const parsedOffset = Math.min(MAX_OFFSET, Math.max(0, parseInt(tempOffsetText, 10) || 0));
    setOffset(editPrayer, parsedOffset);
    if (editMode === 'time' && reminderMode === 'Manual' && tempHours && tempMinutes) {
      let h = parseInt(tempHours, 10), m = parseInt(tempMinutes, 10);
      if (!isNaN(h) && !isNaN(m)) {
        if (!use24HourClock) {
          if (h < 1) h = 1; if (h > 12) h = 12;
          if (tempAmPm === 'PM' && h !== 12) h += 12;
          if (tempAmPm === 'AM' && h === 12) h = 0;
        } else {
          if (h < 0) h = 0; if (h > 23) h = 23;
        }
        if (m < 0) m = 0; if (m > 59) m = 59;
        setManualPrayerTime(editPrayer, h, m);
      }
    }
    setEditPrayer(null);
  };

  const handleSync = () => {
    if (location) {
      syncManualPrayerTimes(getPrayerTimesForDate(new Date(), location, madhab));
      alert('Prayer times synchronized to current auto times!');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>

      {/* Header */}
      <View style={s.header}>
        <View style={{ width: 36 }} />
        <Text style={s.headerTitle}>Prayer Times</Text>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Settings')}>
          <Feather name="settings" size={18} color={C.textSec} />
        </TouchableOpacity>
      </View>

      {/* Info strip */}
      <View style={s.infoStrip}>
        <View style={s.infoCell}>
          <Feather name="sun" size={14} color={C.textMut} />
          <Text style={s.infoCellLabel}>Sunrise</Text>
          <Text style={s.infoCellValue}>{prayerTimes ? fmt(prayerTimes.sunrise) : '--:--'}</Text>
        </View>
        <View style={s.infoDivider} />
        <View style={s.infoCenterCell}>
          <Text style={s.cityName}>{cityName}</Text>
          <Text style={s.madhabTag}>{madhab}</Text>
          {nextPrayerInfo && (
            <Text style={s.nextUp}>{nextPrayerInfo.name} in {nextPrayerInfo.timeDiff}</Text>
          )}
        </View>
        <View style={s.infoDivider} />
        <View style={s.infoCell}>
          <Feather name="sunset" size={14} color={C.textMut} />
          <Text style={s.infoCellLabel}>Sunset</Text>
          <Text style={s.infoCellValue}>{prayerTimes ? fmt(prayerTimes.sunset) : '--:--'}</Text>
        </View>
      </View>

      {/* Mode row */}
      <View style={s.modeRow}>
        <Text style={s.modeLabel}>
          {reminderMode === 'Auto' ? 'Auto reminders' : 'Manual reminders'}
        </Text>
        <View style={s.modeRight}>
          {reminderMode === 'Manual' && (
            <TouchableOpacity style={s.syncBtn} onPress={handleSync}>
              <Feather name="refresh-cw" size={13} color={C.accent} />
              <Text style={s.syncBtnText}>Sync</Text>
            </TouchableOpacity>
          )}
          <Switch
            value={reminderMode === 'Auto'}
            onValueChange={val => setReminderMode(val ? 'Auto' : 'Manual')}
            trackColor={{ false: C.border, true: C.accent }}
            thumbColor={C.textPri}
          />
        </View>
      </View>

      {/* Hint */}
      <Text style={s.tapHint}>
        {reminderMode === 'Auto'
          ? 'Tap a prayer to set an early alarm offset'
          : 'Tap a prayer to set its time or offset'}
      </Text>

      {/* Prayer list */}
      {loading ? (
        <ActivityIndicator size="large" color={C.accent} style={{ marginTop: 60 }} />
      ) : prayerTimes ? (
        <ScrollView style={s.listContainer} contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={s.listCard}>
            {PRAYERS.map((prayer, idx) => {
              const isNext    = nextPrayerName === prayer || (prayer === 'Dhuhr' && nextPrayerName === 'Jummah');
              const isLast    = idx === PRAYERS.length - 1;
              const display   = prayer === 'Dhuhr' && new Date().getDay() === 5 ? 'Jummah' : prayer;
              const timeStr   = fmt(prayerTimes[prayer.toLowerCase() as keyof DailyPrayerTimes]);
              const off       = offsets[prayer] ?? 0;
              return (
                <TouchableOpacity
                  key={prayer}
                  activeOpacity={0.6}
                  onPress={() => openPrayerEditor(prayer)}
                  style={[s.prayerRow, !isLast && s.prayerRowBorder]}
                >
                  <View style={[s.accentBar, isNext && s.accentBarActive]} />

                  <View style={s.prayerLeft}>
                    <Text style={[s.prayerName, isNext && s.prayerNameActive]}>{display}</Text>
                    {off > 0 && (
                      <Text style={s.offsetBadge}>−{off}m early</Text>
                    )}
                  </View>

                  <View style={s.prayerRight}>
                    <Text style={[s.prayerTime, isNext && s.prayerTimeActive]}>{timeStr}</Text>
                    <Feather
                      name={reminderMode === 'Auto' ? 'bell' : 'bell-off'}
                      size={16}
                      color={isNext ? C.accent : C.textMut}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <Text style={s.emptyText}>Waiting for location…</Text>
      )}

      {/* ── Edit Modal ── */}
      <Modal visible={!!editPrayer} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{editPrayer}</Text>

            {/* Tab bar — only show Time tab in Manual mode */}
            <View style={s.tabBar}>
              {reminderMode === 'Manual' && (
                <TouchableOpacity
                  style={[s.tab, editMode === 'time' && s.tabActive]}
                  onPress={() => setEditMode('time')}
                >
                  <Text style={[s.tabText, editMode === 'time' && s.tabTextActive]}>Time</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[s.tab, editMode === 'offset' && s.tabActive]}
                onPress={() => setEditMode('offset')}
              >
                <Text style={[s.tabText, editMode === 'offset' && s.tabTextActive]}>Offset</Text>
              </TouchableOpacity>
            </View>

            {/* ── TIME TAB ── */}
            {editMode === 'time' && reminderMode === 'Manual' && (
              <View>
                <Text style={s.modalSubtitle}>{use24HourClock ? '24-hour format' : '12-hour format'}</Text>
                <View style={s.timeRow}>
                  <TextInput
                    style={[s.timeInput, s.timeInputField]}
                    keyboardType="numeric"
                    value={tempHours}
                    onChangeText={setTempHours}
                    placeholder="HH"
                    placeholderTextColor={C.textMut}
                    maxLength={2}
                  />
                  <Text style={s.timeColon}>:</Text>
                  <TextInput
                    style={[s.timeInput, s.timeInputField]}
                    keyboardType="numeric"
                    value={tempMinutes}
                    onChangeText={setTempMinutes}
                    placeholder="MM"
                    placeholderTextColor={C.textMut}
                    maxLength={2}
                  />
                  {!use24HourClock && (
                    <View style={s.ampmCol}>
                      {(['AM', 'PM'] as const).map(v => (
                        <TouchableOpacity
                          key={v}
                          style={[s.ampmBtn, tempAmPm === v && s.ampmBtnActive]}
                          onPress={() => setTempAmPm(v)}
                        >
                          <Text style={[s.ampmText, tempAmPm === v && s.ampmTextActive]}>{v}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ── OFFSET TAB ── */}
            {editMode === 'offset' && (
              <View>
                <Text style={s.modalSubtitle}>
                  Minutes <Text style={{ color: C.textPri }}>before</Text> the prayer time (0 = at prayer time)
                </Text>
                <View style={s.offsetRow}>
                  <TouchableOpacity
                    style={s.offsetStepBtn}
                    onPress={() => {
                      const cur = Math.max(0, parseInt(tempOffsetText, 10) || 0);
                      setTempOffsetText(String(Math.max(0, cur - 1)));
                    }}
                  >
                    <Text style={s.offsetStepText}>−</Text>
                  </TouchableOpacity>

                  <TextInput
                    style={s.offsetInput}
                    keyboardType="numeric"
                    value={tempOffsetText}
                    onChangeText={text => {
                      // Allow empty string while typing; clamp on blur / save
                      const digits = text.replace(/[^0-9]/g, '');
                      setTempOffsetText(digits);
                    }}
                    onBlur={() => {
                      const v = Math.min(MAX_OFFSET, Math.max(0, parseInt(tempOffsetText, 10) || 0));
                      setTempOffsetText(String(v));
                    }}
                    maxLength={3}
                    selectTextOnFocus
                  />

                  <Text style={s.offsetUnit}>min</Text>

                  <TouchableOpacity
                    style={s.offsetStepBtn}
                    onPress={() => {
                      const cur = Math.min(MAX_OFFSET, parseInt(tempOffsetText, 10) || 0);
                      setTempOffsetText(String(Math.min(MAX_OFFSET, cur + 1)));
                    }}
                  >
                    <Text style={s.offsetStepText}>+</Text>
                  </TouchableOpacity>
                </View>
                {(parseInt(tempOffsetText, 10) || 0) > 0 && (
                  <Text style={s.offsetPreview}>
                    Alarm rings {parseInt(tempOffsetText, 10)} min before {editPrayer}
                  </Text>
                )}
              </View>
            )}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setEditPrayer(null)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSaveBtn} onPress={saveModal}>
                <Text style={s.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },

  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle:     { fontSize: 15, fontWeight: '600', color: C.textPri, letterSpacing: 0.5 },
  iconBtn:         { padding: 8 },

  infoStrip:       { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 4, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingVertical: 14, paddingHorizontal: 12 },
  infoCell:        { alignItems: 'center', gap: 4, flex: 1 },
  infoCellLabel:   { color: C.textMut, fontSize: 11, fontWeight: '500', letterSpacing: 0.5, marginTop: 3 },
  infoCellValue:   { color: C.textSec, fontSize: 13, fontWeight: '600' },
  infoDivider:     { width: 1, height: 40, backgroundColor: C.border },
  infoCenterCell:  { flex: 2, alignItems: 'center', gap: 2, paddingHorizontal: 8 },
  cityName:        { color: C.textPri, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  madhabTag:       { color: C.textMut, fontSize: 11, letterSpacing: 0.5 },
  nextUp:          { color: C.accent, fontSize: 11, fontWeight: '600', marginTop: 2 },

  modeRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  modeLabel:       { color: C.textSec, fontSize: 13 },
  modeRight:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  syncBtn:         { flexDirection: 'row', alignItems: 'center', gap: 5 },
  syncBtnText:     { color: C.accent, fontSize: 13, fontWeight: '600' },

  tapHint:         { color: C.textMut, fontSize: 11, paddingHorizontal: 20, paddingBottom: 10, paddingTop: 2 },

  listContainer:   { flex: 1, paddingHorizontal: 20 },
  listCard:        { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },

  prayerRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingRight: 20 },
  prayerRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  accentBar:       { width: 3, height: 20, borderRadius: 2, backgroundColor: 'transparent', marginHorizontal: 16 },
  accentBarActive: { backgroundColor: C.accent },
  prayerLeft:      { flex: 1, gap: 2 },
  prayerName:      { fontSize: 16, fontWeight: '400', color: C.textSec, letterSpacing: 0.3 },
  prayerNameActive:{ color: C.textPri, fontWeight: '600' },
  offsetBadge:     { fontSize: 11, color: C.accent, fontWeight: '500' },
  prayerRight:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prayerTime:      { fontSize: 18, fontWeight: '300', color: C.textSec },
  prayerTimeActive:{ color: C.textPri, fontWeight: '500' },

  emptyText:       { color: C.textSec, textAlign: 'center', marginTop: 40, fontSize: 14 },

  // Modal
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  modalBox:        { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 24, width: '85%' },
  modalTitle:      { color: C.textPri, fontSize: 18, fontWeight: '700', marginBottom: 12 },

  // Tabs
  tabBar:          { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab:             { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center', backgroundColor: C.bg },
  tabActive:       { borderColor: C.accent, backgroundColor: 'rgba(99,102,241,0.1)' },
  tabText:         { color: C.textSec, fontSize: 13, fontWeight: '600' },
  tabTextActive:   { color: C.accent },

  // Time inputs
  modalSubtitle:   { color: C.textMut, fontSize: 12, marginBottom: 14 },
  timeRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 },
  timeInput:       { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, color: C.textPri, fontSize: 22, fontWeight: '300', padding: 14, textAlign: 'center' },
  timeInputField:  { flex: 1 },
  timeColon:       { color: C.textSec, fontSize: 22, fontWeight: '300' },
  ampmCol:         { gap: 6 },
  ampmBtn:         { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  ampmBtnActive:   { backgroundColor: C.accent, borderColor: C.accent },
  ampmText:        { color: C.textMut, fontSize: 12, fontWeight: '600' },
  ampmTextActive:  { color: '#fff' },

  // Offset input
  offsetRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  offsetStepBtn:   { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  offsetStepText:  { color: C.textPri, fontSize: 20, lineHeight: 22 },
  offsetInput:     { flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.accent, borderRadius: 10, color: C.textPri, fontSize: 24, fontWeight: '300', paddingVertical: 10, textAlign: 'center' },
  offsetUnit:      { color: C.textSec, fontSize: 14 },
  offsetPreview:   { color: C.accent, fontSize: 12, fontWeight: '500', marginBottom: 8 },

  // Modal actions
  modalActions:    { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  modalCancelBtn:  { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  modalCancelText: { color: C.textSec, fontWeight: '600', fontSize: 14 },
  modalSaveBtn:    { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, backgroundColor: C.accent },
  modalSaveText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
});
