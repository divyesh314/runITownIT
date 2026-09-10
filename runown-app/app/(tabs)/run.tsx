import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formatDuration, formatMeters, totalDistanceMeters, type LatLng } from '@/services/geo';
import { ensureLocationPermission, watchPosition } from '@/services/gps';
import { api, ApiError } from '@/services/api';

type RunState = 'idle' | 'running' | 'verifying';

export default function RunScreen() {
  const [state, setState] = useState<RunState>('idle');
  const [path, setPath] = useState<LatLng[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const runIdRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const stopWatchingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (state !== 'running') return;
    const interval = setInterval(() => setElapsedSeconds((Date.now() - startedAtRef.current) / 1000), 500);
    return () => clearInterval(interval);
  }, [state]);

  const onStart = async () => {
    const granted = await ensureLocationPermission();
    if (!granted) {
      Alert.alert('Location needed', 'RunOwn needs your location to know which territory you ran through.');
      return;
    }

    try {
      const run = await api.startRun();
      runIdRef.current = run.id;
    } catch (e) {
      Alert.alert('Could not start run', e instanceof ApiError ? e.message : 'Check your connection and try again.');
      return;
    }

    setPath([]);
    setResult(null);
    setElapsedSeconds(0);
    startedAtRef.current = Date.now();
    setState('running');

    stopWatchingRef.current = await watchPosition((point) => setPath((prev) => [...prev, point]));
  };

  const onStop = async () => {
    stopWatchingRef.current?.();
    stopWatchingRef.current = null;

    const runId = runIdRef.current;
    if (!runId) {
      setState('idle');
      return;
    }

    setState('verifying');
    try {
      const { message, error } = await api.verifyRun(runId, path, (Date.now() - startedAtRef.current) / 1000);
      setResult(error ?? message);
    } catch (e) {
      setResult(e instanceof ApiError ? e.message : 'Could not reach the RunOwn server to verify this run.');
    } finally {
      setState('idle');
      runIdRef.current = null;
    }
  };

  const distance = totalDistanceMeters(path);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Run</ThemedText>

      <ThemedView style={styles.stats}>
        <ThemedView style={styles.stat}>
          <ThemedText type="title">{formatDuration(elapsedSeconds)}</ThemedText>
          <ThemedText style={styles.statLabel}>time</ThemedText>
        </ThemedView>
        <ThemedView style={styles.stat}>
          <ThemedText type="title">{formatMeters(distance)}</ThemedText>
          <ThemedText style={styles.statLabel}>distance</ThemedText>
        </ThemedView>
      </ThemedView>

      {state === 'idle' && (
        <Pressable style={styles.startButton} onPress={onStart}>
          <ThemedText style={styles.buttonText}>Start run</ThemedText>
        </Pressable>
      )}

      {state === 'running' && (
        <Pressable style={styles.stopButton} onPress={onStop}>
          <ThemedText style={styles.buttonText}>Stop &amp; verify</ThemedText>
        </Pressable>
      )}

      {state === 'verifying' && <ThemedText style={styles.center}>Checking your route…</ThemedText>}

      {result && <ThemedText style={styles.result}>{result}</ThemedText>}

      <ThemedText style={styles.hint}>
        Tap start, go for your run, then stop when you get back. If your path passed through an
        unclaimed territory, it&apos;s yours.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20, gap: 16 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 24 },
  stat: { alignItems: 'center' },
  statLabel: { opacity: 0.6, marginTop: 4 },
  startButton: { backgroundColor: '#0a7ea4', borderRadius: 12, padding: 18, alignItems: 'center' },
  stopButton: { backgroundColor: '#d32f2f', borderRadius: 12, padding: 18, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  center: { textAlign: 'center' },
  result: { textAlign: 'center', marginTop: 8, fontWeight: '600' },
  hint: { textAlign: 'center', opacity: 0.6, marginTop: 'auto', marginBottom: 24 },
});
