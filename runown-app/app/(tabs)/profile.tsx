import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { api, type Challenge } from '@/services/api';
import { formatMeters } from '@/services/geo';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [runCount, setRunCount] = useState<number | null>(null);
  const [distance, setDistance] = useState(0);

  const load = useCallback(async () => {
    try {
      const [myChallenges, myRuns] = await Promise.all([api.listChallenges(), api.myRuns()]);
      setChallenges(myChallenges.filter((c) => c.status === 'pending'));
      setRunCount(myRuns.length);
      setDistance(myRuns.reduce((sum, r) => sum + (r.distance ?? 0), 0));
    } catch {
      // Keep whatever was already on screen.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const respond = async (challenge: Challenge, accept: boolean) => {
    try {
      if (accept) await api.acceptChallenge(challenge.id);
      else await api.declineChallenge(challenge.id);
      load();
    } catch {
      Alert.alert('Something went wrong', 'Could not update that challenge.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">{user?.name}</ThemedText>
      <ThemedText style={styles.email}>{user?.email}</ThemedText>

      <ThemedView style={styles.stats}>
        <ThemedView style={styles.stat}>
          <ThemedText type="title">{runCount ?? '–'}</ThemedText>
          <ThemedText style={styles.statLabel}>runs</ThemedText>
        </ThemedView>
        <ThemedView style={styles.stat}>
          <ThemedText type="title">{formatMeters(distance)}</ThemedText>
          <ThemedText style={styles.statLabel}>total distance</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Challenges against your turf
      </ThemedText>
      {challenges.length === 0 && <ThemedText style={styles.empty}>Nobody&apos;s challenging you right now.</ThemedText>}
      {challenges.map((challenge) => (
        <ThemedView key={challenge.id} style={styles.challengeRow}>
          <ThemedText>
            <ThemedText type="defaultSemiBold">{challenge.challenger.name}</ThemedText> wants{' '}
            {challenge.territory.name}
          </ThemedText>
          <ThemedView style={styles.challengeActions}>
            <Pressable style={styles.acceptButton} onPress={() => respond(challenge, true)}>
              <ThemedText style={styles.buttonText}>Accept</ThemedText>
            </Pressable>
            <Pressable style={styles.declineButton} onPress={() => respond(challenge, false)}>
              <ThemedText style={styles.buttonText}>Decline</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      ))}

      <Pressable style={styles.logoutButton} onPress={logout}>
        <ThemedText style={styles.logoutText}>Log out</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40, gap: 8 },
  email: { opacity: 0.7, marginBottom: 16 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  stat: { alignItems: 'center' },
  statLabel: { opacity: 0.6, marginTop: 4 },
  sectionTitle: { marginTop: 8, marginBottom: 8 },
  empty: { opacity: 0.6, marginBottom: 16 },
  challengeRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8884',
    gap: 8,
  },
  challengeActions: { flexDirection: 'row', gap: 8 },
  acceptButton: { backgroundColor: '#2e7d32', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  declineButton: { backgroundColor: '#8884', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  buttonText: { color: '#fff', fontWeight: '600' },
  logoutButton: { marginTop: 32, alignItems: 'center', padding: 14 },
  logoutText: { color: '#d32f2f', fontWeight: '600' },
});
