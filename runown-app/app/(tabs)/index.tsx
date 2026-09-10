import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { api, ApiError, type Territory } from '@/services/api';
import { getCurrentPoint } from '@/services/gps';

export default function MapScreen() {
  const { user } = useAuth();
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(async () => {
    try {
      setTerritories(await api.listTerritories());
    } catch {
      // Leave the previous list on screen; the pull-to-refresh spinner
      // stopping is signal enough that something went wrong.
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onChallenge = async (territory: Territory) => {
    try {
      await api.createChallenge(territory.id);
      Alert.alert('Challenge sent', `${territory.owner?.name} will see your challenge for ${territory.name}.`);
    } catch (e) {
      Alert.alert('Could not send challenge', e instanceof ApiError ? e.message : 'Something went wrong.');
    }
  };

  const onClaim = async () => {
    setClaiming(true);
    try {
      const point = await getCurrentPoint();
      const result = await api.claimTerritory(point);
      if ('error' in result) {
        Alert.alert('Already owned', result.error);
      } else {
        Alert.alert('Territory claimed!', result.message);
      }
      load();
    } catch (e) {
      Alert.alert('Could not claim territory', e instanceof ApiError ? e.message : 'Check your location permissions and try again.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Territories</ThemedText>
        <ThemedText style={styles.subtitle}>
          {user ? `Hey ${user.name}, here's the map so far.` : 'Zones near you'}
        </ThemedText>
      </ThemedView>

      <FlatList
        data={territories}
        keyExtractor={(t) => String(t.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <ThemedText style={styles.empty}>No territories yet - be the first to claim one!</ThemedText> : null
        }
        renderItem={({ item }) => (
          <ThemedView style={styles.row}>
            <ThemedView style={styles.rowText}>
              <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
              <ThemedText style={styles.owner}>
                {item.owner ? `Owned by ${item.owner.name}` : 'Unclaimed'}
              </ThemedText>
            </ThemedView>
            {item.owner && item.owner.id !== user?.id && (
              <Pressable onPress={() => onChallenge(item)}>
                <ThemedText type="link">Challenge</ThemedText>
              </Pressable>
            )}
          </ThemedView>
        )}
      />

      <ThemedText
        onPress={claiming ? undefined : onClaim}
        style={[styles.claimButton, claiming && styles.claimButtonDisabled]}>
        {claiming ? 'Locating you…' : '📍 Claim the zone I\'m standing in'}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { paddingHorizontal: 20, marginBottom: 8 },
  subtitle: { opacity: 0.7, marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8884',
  },
  rowText: { flex: 1 },
  owner: { opacity: 0.7, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, opacity: 0.6 },
  claimButton: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#0a7ea4',
    color: '#fff',
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    fontWeight: '600',
    overflow: 'hidden',
  },
  claimButtonDisabled: { opacity: 0.6 },
});
