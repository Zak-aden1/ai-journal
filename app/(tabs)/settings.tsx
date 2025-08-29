import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/app';
import { track } from '@/utils/analytics';
import { GoalCleanup } from '@/components/GoalCleanup';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'action' | 'info';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const { privacy, togglePrivacy, mode, setMode } = useAppStore();
  const { theme, themeMode, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const styles = createStyles(theme);

  const handleExportData = () => {
    track('settings_export_data');
    Alert.alert(
      'Export Data',
      'Your journal entries and goals will be exported as an encrypted file.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => console.log('Export data') }
      ]
    );
  };

  const handleDeleteAllData = () => {
    track('settings_delete_data_requested');
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your journal entries, goals, and habits. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            track('settings_delete_data_confirmed');
            console.log('Delete all data');
          }
        }
      ]
    );
  };

  const handleContactSupport = () => {
    track('settings_contact_support');
    Alert.alert(
      'Contact Support',
      'Send us feedback or report issues at support@aijournal.app',
      [{ text: 'OK' }]
    );
  };

  const privacySettings: SettingItem[] = [
    {
      id: 'local_only',
      title: 'Local-Only Storage',
      subtitle: 'Keep all data on your device only',
      type: 'toggle',
      value: privacy.localOnly,
      onToggle: (value) => togglePrivacy('localOnly'),
    },
    {
      id: 'voice_recording',
      title: 'Voice Recording Storage',
      subtitle: 'Allow storing voice messages locally',
      type: 'toggle',
      value: privacy.voice,
      onToggle: (value) => togglePrivacy('voice'),
    },
    {
      id: 'biometric',
      title: 'Biometric Lock',
      subtitle: 'Use Face ID or Touch ID to secure your journal',
      type: 'toggle',
      value: biometricEnabled,
      onToggle: setBiometricEnabled,
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: 'theme',
      title: 'Dark Mode',
      subtitle: 'Switch between light and dark themes',
      type: 'toggle',
      value: themeMode === 'dark',
      onToggle: () => {
        toggleTheme();
        track('settings_theme_changed', { theme: themeMode === 'dark' ? 'light' : 'dark' });
      },
    },
    {
      id: 'notifications',
      title: 'Daily Reminders',
      subtitle: 'Get reminded to journal and track habits',
      type: 'toggle',
      value: notificationsEnabled,
      onToggle: setNotificationsEnabled,
    },
    {
      id: 'coach_mode',
      title: mode === 'Coach' ? 'Coach Mode (Active)' : 'Companion Mode (Active)',
      subtitle: mode === 'Coach' 
        ? 'Direct accountability and tough love' 
        : 'A supportive friend for your journey',
      type: 'action',
      onPress: () => {
        const newMode = mode === 'Coach' ? 'Companion' : 'Coach';
        setMode(newMode);
        track('settings_mode_changed', { mode: newMode });
      },
    },
  ];

  const dataSettings: SettingItem[] = [
    {
      id: 'export',
      title: 'Export Data',
      subtitle: 'Download your journal entries and goals',
      type: 'action',
      onPress: handleExportData,
    },
    {
      id: 'delete',
      title: 'Delete All Data',
      subtitle: 'Permanently remove all your data',
      type: 'action',
      onPress: handleDeleteAllData,
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: 'version',
      title: 'Version',
      subtitle: '1.0.0 (Beta)',
      type: 'info',
    },
    {
      id: 'support',
      title: 'Contact Support',
      subtitle: 'Get help or send feedback',
      type: 'action',
      onPress: handleContactSupport,
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.settingItem,
        item.type === 'info' && styles.settingItemInfo
      ]}
      onPress={item.onPress}
      disabled={item.type === 'info' || item.type === 'toggle'}
    >
      <View style={styles.settingContent}>
        <Text style={[
          styles.settingTitle,
          item.id === 'delete' && styles.dangerText
        ]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      
      {item.type === 'toggle' && (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ 
            false: theme.colors.background.tertiary, 
            true: theme.colors.primary 
          }}
          thumbColor={theme.colors.background.primary}
        />
      )}
      
      {item.type === 'action' && item.id !== 'delete' && (
        <Text style={styles.chevron}>›</Text>
      )}
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {items.map(renderSettingItem)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your AI Journal experience</Text>
        </View>

        {renderSection('Privacy & Security', privacySettings)}
        {renderSection('App Preferences', appSettings)}
        {renderSection('Data Management', dataSettings)}
        
        {/* Goal cleanup section - only visible for development */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Development Tools</Text>
          <View style={styles.sectionContent}>
            <GoalCleanup />
          </View>
        </View>
        
        {renderSection('Support', supportSettings)}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            AI Journal is privacy-first. Your data stays on your device unless you choose to export it.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    ...theme.type.hero,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.type.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  sectionContent: {
    backgroundColor: theme.colors.background.secondary,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius,
    ...theme.shadows.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  settingItemInfo: {
    opacity: 0.8,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...theme.type.body,
    color: theme.colors.text.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  dangerText: {
    color: theme.colors.danger,
  },
  chevron: {
    fontSize: 18,
    color: theme.colors.text.muted,
    marginLeft: theme.spacing.sm,
  },
  footer: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
