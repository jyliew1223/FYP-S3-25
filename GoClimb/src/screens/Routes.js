// GoClimb/src/screens/Routes.js
import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { getCragInfo } from '../services/api/CragService';

// ------- Data model --------
// country -> area -> crag  (dynamic: crag expands to load routes from API) -> route

// Map your known crags to IDs used by the "Crag Info" endpoint.
const CRAG_IDS = {
  // Singapore
  'Dairy Farm: Yawning Turtle': 'df-yawning',
  'Dairy Farm: Toast Bunch': 'df-toast-bunch',
  'Dairy Farm: Superstar': 'df-superstar',
  'Dairy Farm: Heart': 'df-heart',
  'Dairy Farm: Green Attack': 'df-green-attack',
  'Dairy Farm: Brother': 'df-brother',
  'Dairy Farm: Caveman': 'df-caveman',
  'Dairy Farm: New World': 'df-new-world',
  'Dairy Farm: Cookie Crumble': 'df-cookie-crumble',
  // add more as your backend defines them
};

// Initial static hierarchy up to the crag level.
// Only when a "crag" node is expanded do we fetch its routes from the API.
function initialBoulderTree() {
  return [
    {
      type: 'country',
      name: 'Singapore',
      children: [
        {
          type: 'area',
          name: 'Dairy Farm',
          children: [
            { type: 'crag', name: 'Yawning Turtle', cragId: CRAG_IDS['Dairy Farm: Yawning Turtle'] },
            { type: 'crag', name: 'Toast Bunch', cragId: CRAG_IDS['Dairy Farm: Toast Bunch'] },
            { type: 'crag', name: 'Superstar', cragId: CRAG_IDS['Dairy Farm: Superstar'] },
            { type: 'crag', name: 'Heart', cragId: CRAG_IDS['Dairy Farm: Heart'] },
            { type: 'crag', name: 'Green Attack', cragId: CRAG_IDS['Dairy Farm: Green Attack'] },
            { type: 'crag', name: 'Brother', cragId: CRAG_IDS['Dairy Farm: Brother'] },
            { type: 'crag', name: 'Caveman', cragId: CRAG_IDS['Dairy Farm: Caveman'] },
            { type: 'crag', name: 'New World', cragId: CRAG_IDS['Dairy Farm: New World'] },
            { type: 'crag', name: 'Cookie Crumble', cragId: CRAG_IDS['Dairy Farm: Cookie Crumble'] },
          ],
        },
        { type: 'area', name: 'Bukit Ciambi', children: [] },
        { type: 'area', name: 'Pulau Ubin', children: [] },
        { type: 'area', name: 'Changi', children: [] },
      ],
    },
    { type: 'country', name: 'France', children: [] },
    { type: 'country', name: 'Australia', children: [] },
    { type: 'country', name: 'USA', children: [] },
    { type: 'country', name: 'UK', children: [] },
  ];
}

const PADDING_L = 16;
const ROW_H = 40;

export default function Routes({ navigation }) {
  const { colors } = useTheme();

  // Static tree up to crag level
  const [tree, setTree] = useState(initialBoulderTree);

  // Which rows are expanded
  const [expanded, setExpanded] = useState(new Set());

  // Track loading state per cragId
  const [loadingCrags, setLoadingCrags] = useState({}); // { [cragId]: boolean }

  // Cache fetched routes per cragId so we don’t refetch repeatedly
  const routesCacheRef = useRef(new Map()); // cragId -> [{id, name, grade, sector}]

  const [mode, setMode] = useState('boulder'); // sport WIP

  const toggleExpand = async (key, node, pathIndices) => {
    const next = new Set(expanded);
    const currentlyOpen = next.has(key);

    // If closing, just collapse it.
    if (currentlyOpen) {
      next.delete(key);
      setExpanded(next);
      return;
    }

    // If opening a crag, fetch routes (once) and inject children.
    if (node.type === 'crag' && node.cragId) {
      // If not fetched before, load.
      if (!routesCacheRef.current.has(node.cragId)) {
        setLoadingCrags((s) => ({ ...s, [node.cragId]: true }));
        const result = await getCragInfo(node.cragId);
        setLoadingCrags((s) => ({ ...s, [node.cragId]: false }));

        if (result?.success && result.data) {
          const routes = (result.data.sectors || []).flatMap((sector) =>
            (sector.routes || []).map((r) => ({
              type: 'route',
              id: r.id,
              name: r.name,
              grade: r.grade || '—',
              sector: sector.name,
            })),
          );

          routesCacheRef.current.set(node.cragId, routes);

          // Inject children into the tree at the path for this node
          setTree((prev) => {
            // clone deep along the path so React state updates properly
            const newTree = JSON.parse(JSON.stringify(prev));
            // walk by indices to the node
            let cursor = newTree;
            for (let i = 0; i < pathIndices.length - 1; i++) {
              cursor = cursor[pathIndices[i]].children;
            }
            const nodeIndex = pathIndices[pathIndices.length - 1];
            const existing = cursor[nodeIndex];
            cursor[nodeIndex] = { ...existing, children: routes }; // add fetched routes as children
            return newTree;
          });
        } else {
          // API failed — put a placeholder child so user sees something
          routesCacheRef.current.set(node.cragId, []);
          setTree((prev) => {
            const newTree = JSON.parse(JSON.stringify(prev));
            let cursor = newTree;
            for (let i = 0; i < pathIndices.length - 1; i++) {
              cursor = cursor[pathIndices[i]].children;
            }
            const nodeIndex = pathIndices[pathIndices.length - 1];
            const existing = cursor[nodeIndex];
            cursor[nodeIndex] = {
              ...existing,
              children: [{ type: 'placeholder', name: 'No routes found (try again later)' }],
            };
            return newTree;
          });
        }
      }
    }

    // Open it
    next.add(key);
    setExpanded(next);
  };

  const onOpenRoute = (route) => {
    navigation.navigate('RouteDetails', {
      name: route.name,
      grade: route.grade || '—',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      {/* simple "Boulder/Sport" toggle; sport disabled for now */}
      <View style={[styles.segmentWrap, { borderColor: colors.divider, backgroundColor: colors.surfaceAlt }]}>
        <TouchableOpacity
          style={[styles.segmentBtn, { backgroundColor: colors.surface }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, { color: colors.accent }]}>Boulder</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.segmentBtn} activeOpacity={0.8} onPress={() => {}}>
          <Text style={[styles.segmentText, { color: colors.textDim }]}>Sport (WIP)</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.divider,
            overflow: 'hidden',
          }}
        >
          {tree.map((node, idx) => (
            <TreeRow
              key={'root-' + idx}
              node={node}
              depth={0}
              pathIndices={[idx]}
              expanded={expanded}
              onToggle={toggleExpand}
              onOpenRoute={onOpenRoute}
              loadingCrags={loadingCrags}
              colors={colors}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function pathKeyFromNames(pathNames) {
  return pathNames.join(' / ');
}

function TreeRow({
  node,
  depth,
  pathNames = [],
  pathIndices = [],
  expanded,
  onToggle,
  onOpenRoute,
  loadingCrags,
  colors,
}) {
  const isRoute = node.type === 'route';
  const isCrag = node.type === 'crag';
  const isPlaceholder = node.type === 'placeholder';
  const key = pathKeyFromNames([...pathNames, node.name]);
  const isOpen = expanded.has(key);

  const leftPad = PADDING_L + depth * 14;

  const handlePress = () => {
    if (isRoute) {
      onOpenRoute(node);
    } else {
      onToggle(key, node, pathIndices);
    }
  };

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        disabled={isPlaceholder}
        style={[styles.row, { paddingLeft: leftPad, borderBottomColor: colors.divider }]}
      >
        {/* Left icon */}
        {isRoute ? (
          <Ionicons name="document-text-outline" size={16} color={colors.textDim} style={{ width: 22 }} />
        ) : isPlaceholder ? (
          <Ionicons name="alert-circle-outline" size={16} color={colors.accent} style={{ width: 22 }} />
        ) : (
          <Ionicons name={isOpen ? 'chevron-down' : 'chevron-forward'} size={16} color={colors.textDim} style={{ width: 22 }} />
        )}

        {/* Label */}
        <Text
          style={[
            styles.rowText,
            { color: colors.text },
            isRoute && styles.routeText,
            isPlaceholder && { color: colors.textDim, fontStyle: 'italic' },
          ]}
        >
          {isRoute
            ? `${node.name}${node.grade ? `, ${node.grade}` : ''}`
            : node.name}
        </Text>

        {/* Right adornments (spinner for crag loading) */}
        {isCrag && loadingCrags[node.cragId] ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginLeft: 8 }} />
        ) : null}
      </TouchableOpacity>

      {/* Children */}
      {!isRoute && isOpen && node.children && node.children.length > 0 && (
        <View>
          {node.children.map((child, idx) => (
            <TreeRow
              key={key + '::' + idx}
              node={child}
              depth={depth + 1}
              pathNames={[...pathNames, node.name]}
              pathIndices={[...pathIndices, idx]}
              expanded={expanded}
              onToggle={onToggle}
              onOpenRoute={onOpenRoute}
              loadingCrags={loadingCrags}
              colors={colors}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  segmentWrap: {
    flexDirection: 'row',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentText: { fontWeight: '700' },

  row: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
  },
  rowText: { fontSize: 14, fontWeight: '600' },
  routeText: { fontWeight: '500' },
});
