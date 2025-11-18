// GoClimb/src/components/SearchModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { UI_CONSTANTS, STYLE_MIXINS, SCREEN_CONSTANTS } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

export default function SearchModal({
  visible,
  onClose,
  title = 'Search',
  placeholder = 'Search...',
  searchFunction,
  renderItem,
  keyExtractor,
  emptyIcon = 'search-outline',
  emptyTitle = 'No results found',
  emptySubtitle = 'Try a different search term',
}) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim() && searchFunction) {
        handleSearch(query.trim());
      } else {
        setResults([]);
      }
    }, SCREEN_CONSTANTS.SEARCH.DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [query, searchFunction]);

  const handleSearch = async (searchQuery) => {
    if (searchQuery.length < SCREEN_CONSTANTS.SEARCH.MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const result = await searchFunction(searchQuery);
      if (result.success) {
        setResults(result.data || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.log('Search error:', error);
      setResults([]);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
          <View style={[styles.searchInputWrapper, { backgroundColor: colors.bg, borderColor: colors.divider }]}>
            <Ionicons name="search" size={UI_CONSTANTS.ICON_SIZES.MEDIUM} color={colors.textDim} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={placeholder}
              placeholderTextColor={colors.textDim}
              value={query}
              onChangeText={setQuery}
              autoFocus={true}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={UI_CONSTANTS.ICON_SIZES.MEDIUM} color={colors.textDim} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Results */}
        <View style={styles.results}>
          {loading ? (
            <LoadingSpinner text="Searching..." />
          ) : query && results.length === 0 ? (
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              subtitle={emptySubtitle}
            />
          ) : (
            <FlatList
              data={results}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              contentContainerStyle={styles.resultsList}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    ...STYLE_MIXINS.flexRowCenter,
    justifyContent: 'space-between',
    height: UI_CONSTANTS.SPACING.XXXL + UI_CONSTANTS.SPACING.LG,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    padding: UI_CONSTANTS.SPACING.XS,
  },
  headerButtonText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
  },
  title: {
    fontSize: UI_CONSTANTS.FONT_SIZES.XL,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
  },
  searchContainer: {
    padding: UI_CONSTANTS.SPACING.LG,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInputWrapper: {
    ...STYLE_MIXINS.flexRowCenter,
    borderWidth: 1,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SMALL,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    gap: UI_CONSTANTS.SPACING.SM,
  },
  searchInput: {
    flex: 1,
    ...STYLE_MIXINS.input,
    padding: UI_CONSTANTS.SPACING.MD,
  },
  results: {
    flex: 1,
  },
  resultsList: {
    padding: UI_CONSTANTS.SPACING.LG,
  },
});