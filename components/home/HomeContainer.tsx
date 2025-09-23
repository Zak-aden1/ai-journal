import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

interface HomeContainerProps {
  children: React.ReactNode;
  showScrollIndicator?: boolean;
  overlayElements?: React.ReactNode;
}

export function HomeContainer({
  children,
  showScrollIndicator = false,
  overlayElements
}: HomeContainerProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.wrapper}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={showScrollIndicator}
          scrollEventThrottle={16}
        >
          {children}
        </ScrollView>

        {/* Overlay elements that stay fixed during scroll */}
        {overlayElements && overlayElements}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl + 80, // Extra padding for FAB
  },
});