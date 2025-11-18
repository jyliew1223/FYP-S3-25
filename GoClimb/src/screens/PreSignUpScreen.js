// GoClimb/src/screens/PreSignUpScreen.js

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export default function PreSignUpScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const handleJoinNow = () => {
    // Navigate to payment screen
    navigation.navigate('Payment');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const features = [
    { icon: 'camera', title: 'AR Features' },
    { icon: 'people', title: 'Community Forum' },
    { icon: 'add-circle', title: 'Log Climbs' },
    { icon: 'trophy', title: 'Rankings' },
    { icon: 'create', title: 'Add Content' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Join GoClimb</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
            <Ionicons name="rocket" size={40} color="#FFFFFF" />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Unlock Full Access
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textDim }]}>
            One-time payment • Lifetime access
          </Text>
        </View>

        {/* Features List - Compact */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>What You'll Get:</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureChip}>
                <Ionicons name={feature.icon} size={18} color={colors.accent} />
                <Text style={[styles.featureChipText, { color: colors.text }]}>
                  {feature.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing */}
        <View style={[styles.pricingCard, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
          <Text style={[styles.pricingLabel, { color: colors.textDim }]}>One-Time Payment</Text>
          <Text style={[styles.pricingAmount, { color: colors.accent }]}>S$0.60</Text>
          <Text style={[styles.pricingNote, { color: colors.textDim }]}>
            Lifetime access • No recurring fees
          </Text>
        </View>

        {/* Join Button */}
        <TouchableOpacity
          style={[styles.joinButton, { backgroundColor: colors.accent }]}
          onPress={handleJoinNow}
          activeOpacity={0.8}
        >
          <Text style={styles.joinButtonText}>Join Now!</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginSection}>
          <Text style={[styles.loginText, { color: colors.textDim }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={[styles.loginLink, { color: colors.accent }]}>
              Log in here
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  featuresSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    gap: 6,
  },
  featureChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pricingCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 20,
  },
  pricingLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  pricingAmount: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 6,
  },
  pricingNote: {
    fontSize: 11,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
