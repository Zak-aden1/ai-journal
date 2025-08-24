import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

type Props = {
  onSaved: (fileUri: string) => void;
};

export function VoiceRecorder({ onSaved }: Props) {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [perm, setPerm] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setPerm(status === 'granted');
    })();
  }, []);

  async function start() {
    if (!perm) return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    recordingRef.current = recording;
    setIsRecording(true);
  }

  async function stop() {
    const rec = recordingRef.current;
    if (!rec) return;
    await rec.stopAndUnloadAsync();
    const recUri = rec.getURI();
    setIsRecording(false);
    if (recUri) {
      const dest = `${FileSystem.documentDirectory}why_${Date.now()}.m4a`;
      await FileSystem.copyAsync({ from: recUri, to: dest });
      setUri(dest);
    }
  }

  async function play() {
    if (!uri) return;
    const { sound } = await Audio.Sound.createAsync({ uri });
    setSound(sound);
    await sound.playAsync();
  }

  async function save() {
    if (uri) onSaved(uri);
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Record a personal message (max ~30s)</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {!isRecording ? (
          <Pressable style={[styles.btn, styles.primary]} onPress={start}><Text style={styles.textDark}>Record</Text></Pressable>
        ) : (
          <Pressable style={[styles.btn, styles.secondary]} onPress={stop}><Text style={styles.textDark}>Stop</Text></Pressable>
        )}
        <Pressable style={[styles.btn, styles.ghost]} onPress={play} disabled={!uri}><Text style={styles.textDark}>Play</Text></Pressable>
        <Pressable style={[styles.btn, styles.primary]} onPress={save} disabled={!uri}><Text style={styles.textDark}>Save</Text></Pressable>
      </View>
      {uri ? <Text style={styles.uri}>Saved to: {uri}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, gap: 8 },
  title: { fontSize: 14, color: '#0F172A', fontWeight: '600' },
  btn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center' },
  primary: { backgroundColor: '#22C55E' },
  secondary: { backgroundColor: '#E5E7EB' },
  ghost: { backgroundColor: '#F8FAFC' },
  textDark: { color: '#0F172A', fontWeight: '600' },
  uri: { fontSize: 12, color: '#334155' },
});


