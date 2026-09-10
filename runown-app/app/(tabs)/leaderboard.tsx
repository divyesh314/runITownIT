import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { api, type LeaderboardRow } from '@/services/api';

export default function LeaderboardScreen() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setRows(await api.leaderboard());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Leaderboard
      </ThemedText>
      <ThemedText style={styles.subtitle}>Ranked by territories currently owned.</ThemedText>

      <FlatList
        data={rows}
        keyExtractor={(row) => String(row.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? <ThemedText style={styles.empty}>Nobody owns any turf yet.</ThemedText> : null}
        renderItem={({ item, index }) => (
          <ThemedView style={styles.row}>
            <ThemedText type="defaultSemiBold" style={styles.rank}>
              #{index + 1}
            </ThemedText>
            <ThemedText style={styles.name}>{item.name}</ThemedText>
            <ThemedText type="defaultSemiBold">{item.territories_count}</ThemedText>
          </ThemedView>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  title: { marginBottom: 4 },
  subtitle: { opacity: 0.7, marginBottom: 12 },
  list: { paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8884',
    gap: 12,
  },
  rank: { width: 36, opacity: 0.6 },
  name: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 40, opacity: 0.6 },
});
