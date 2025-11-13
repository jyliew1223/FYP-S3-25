// GoClimb/src/screens/FAQScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const FAQ_DATA = [
  {
    id: 1,
    question: 'How do I log a climb?',
    answer: 'Click the "Log Climb" button on the Home screen and fill in the necessary information including the route, date, and any notes about your climb.',
  },
  {
    id: 2,
    question: 'Who is this app for?',
    answer: 'GoClimb is designed for climbers of all levels, especially those who want to track their progress, discover new routes, and connect with the climbing community.',
  },
  {
    id: 3,
    question: 'Is there a community forum?',
    answer: 'Yes! Click on the "Forum" tab at the bottom of the app to view posts from other climbers, share your experiences, and create new posts.',
  },
  {
    id: 4,
    question: 'Do I need internet connection?',
    answer: 'An internet connection is required to access most features including logging climbs, viewing the forum, checking rankings, and syncing your data. Some cached data may be available offline.',
  },
  {
    id: 5,
    question: 'How are routes graded?',
    answer: 'Routes are graded by our climbing experts and the community. You can also upload your own crag models with custom route data through the 3D Models feature.',
  },
  {
    id: 6,
    question: 'What makes GoClimb unique?',
    answer: 'GoClimb features an Augmented Reality (AR) experience for real-world crag climbing. Access it by opening the menu (three bars), selecting "AR Experience", then "Real World AR Experience" to visualize routes on actual rock faces.',
  },
  {
    id: 7,
    question: 'What payment methods do you accept?',
    answer: 'We accept PayNow, Mastercard, and Visa for premium memberships and features.',
  },
  {
    id: 8,
    question: 'How do I view weather conditions?',
    answer: 'Weather information is displayed on the Maps screen when you select a crag. You can see current conditions, temperature, wind speed, and climbing suitability.',
  },
  {
    id: 9,
    question: 'Can I track my climbing progress?',
    answer: 'Yes! Your Profile screen shows your climbing statistics including total routes climbed, average grades, and a detailed log of all your climbs.',
  },
  {
    id: 10,
    question: 'How do I find new climbing spots?',
    answer: 'Use the Maps tab to discover crags near you. You can also browse the Routes tab to see all available climbing locations and their routes.',
  },
  {
    id: 11,
    question: 'Can I upload my own 3D models?',
    answer: 'Yes! Premium users can upload 3D models of crags through the "My 3D Models" section in your profile. This allows you to create custom route visualizations.',
  },
  {
    id: 12,
    question: 'How do rankings work?',
    answer: 'Rankings are based on the number of routes you\'ve completed and your average climbing grades. Check the Rankings section to see how you compare with other climbers.',
  },
];

export default function FAQScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { screen: 'Home' });
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bg }]}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          FAQ
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {/* FAQ List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.introSection}>
          <Ionicons name="help-circle" size={48} color={colors.accent} />
          <Text style={[styles.introTitle, { color: colors.text }]}>
            Frequently Asked Questions
          </Text>
          <Text style={[styles.introSubtitle, { color: colors.textDim }]}>
            Find answers to common questions about GoClimb
          </Text>
        </View>

        {FAQ_DATA.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.faqItem,
              {
                backgroundColor: colors.surface,
                borderColor: colors.divider,
              },
            ]}
            onPress={() => toggleExpand(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.questionRow}>
              <View style={styles.questionNumber}>
                <Text style={[styles.numberText, { color: colors.accent }]}>
                  {item.id}
                </Text>
              </View>
              <Text style={[styles.questionText, { color: colors.text }]}>
                {item.question}
              </Text>
              <Ionicons
                name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textDim}
              />
            </View>

            {expandedId === item.id && (
              <View
                style={[
                  styles.answerContainer,
                  { borderTopColor: colors.divider },
                ]}
              >
                <Text style={[styles.answerText, { color: colors.textDim }]}>
                  {item.answer}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Contact Section */}
        <View
          style={[
            styles.contactSection,
            {
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.divider,
            },
          ]}
        >
          <Ionicons name="mail-outline" size={24} color={colors.accent} />
          <Text style={[styles.contactTitle, { color: colors.text }]}>
            Still have questions?
          </Text>
          <Text style={[styles.contactText, { color: colors.textDim }]}>
            Contact our support team for additional help
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  faqItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  numberText: {
    fontSize: 14,
    fontWeight: '800',
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 22,
    marginLeft: 44,
  },
  contactSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
