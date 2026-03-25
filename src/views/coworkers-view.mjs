import React, {useEffect, useMemo, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import SelectInput from '../components/select-input.mjs';
import PixelLoader from '../components/pixel-loader.mjs';
import {fetchCoworkers} from '../api/index.mjs';

const BRAND_HEX = '#7F00FF';

function CoworkerListRow({coworker}) {
  const credits = coworker?.price?.credits;
  return React.createElement(
    Box,
    {flexDirection: 'row', justifyContent: 'space-between', width: '100%'},
    React.createElement(Text, {bold: true, wrap: 'truncate-end'}, coworker.name || coworker.id || 'Untitled Coworker'),
    React.createElement(Box, {marginLeft: 2, flexGrow: 0, flexShrink: 0, minWidth: 8, justifyContent: 'flex-end'},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, credits != null ? `${credits}\u00A0cr` : '')
    )
  );
}

export default function CoworkersView({onBack, onSelectCoworker, onCreateTask}) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [coworkers, setCoworkers] = useState([]);
  const [error, setError] = useState(null);
  const [highlightedCoworker, setHighlightedCoworker] = useState(null);

  const load = async () => {
    setStatus('loading');
    setError(null);
    try {
      const {coworkers: list} = await fetchCoworkers();
      setCoworkers(list);
      setHighlightedCoworker(list?.[0] || null);
      setStatus('ready');
    } catch (e) {
      setError(e?.message || 'Failed to load coworkers');
      setStatus('error');
    }
  };

  useEffect(() => { load(); }, []);

  const items = useMemo(() => {
    return [
      ...coworkers.map(coworker => ({
        label: coworker.name || coworker.id,
        value: coworker.id,
        coworker,
        render: () => React.createElement(CoworkerListRow, {coworker})
      })),
      {label: 'Back', value: '__back'}
    ];
  }, [coworkers]);

  const handleSelect = item => {
    if (item.value === '__back') return onBack && onBack();
    const selected = coworkers.find(c => c.id === item.value) || item.coworker;
    if (selected) onSelectCoworker && onSelectCoworker(selected);
  };

  useInput((input, key) => {
    if (status !== 'ready') return;
    if (key.return || key.upArrow || key.downArrow || key.escape) return;
    if ((input === 't' || input === 'T') && highlightedCoworker) {
      onCreateTask && onCreateTask(highlightedCoworker);
    }
  });

  const selectedCapabilities = useMemo(
    () => (highlightedCoworker?.capabilities || []).filter(Boolean),
    [highlightedCoworker]
  );

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column', width: '100%'},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Coworkers'),
      React.createElement(Box, {marginTop: 1},
        React.createElement(Text, {dimColor: true}, 'Coworkers coordinate multiple specialist agents to complete complex workflows')
      ),
      status === 'loading' && React.createElement(Box, {marginTop: 1}, React.createElement(PixelLoader)),
      status === 'error' && React.createElement(Box, {marginTop: 1}, React.createElement(Text, {color: 'red'}, error || 'Error')),
      status === 'ready' && coworkers.length === 0 && React.createElement(Box, {marginTop: 1}, React.createElement(Text, null, 'No coworkers available')),
      status === 'ready' && React.createElement(Box, {marginTop: 1, flexDirection: 'column', width: '100%'},
        React.createElement(SelectInput, {
          items,
          onSelect: handleSelect,
          onHighlight: item => setHighlightedCoworker(item?.coworker || null),
          maxVisibleItems: 8
        }),
        React.createElement(Box, {
          marginTop: 1,
          flexDirection: 'column',
          borderStyle: 'single',
          borderColor: 'gray',
          paddingX: 1,
          width: '100%'
        },
        highlightedCoworker
          ? React.createElement(Box, {flexDirection: 'column', width: '100%'},
              React.createElement(Text, {bold: true, color: BRAND_HEX}, highlightedCoworker.name || highlightedCoworker.id || 'Coworker Preview'),
              highlightedCoworker.description && React.createElement(Text, {dimColor: true}, highlightedCoworker.description),
              selectedCapabilities.length > 0 && React.createElement(Text, {dimColor: true}, `Capabilities: ${selectedCapabilities.join(', ')}`),
              highlightedCoworker.estimatedDuration && React.createElement(Text, {dimColor: true}, `Estimated duration: ${highlightedCoworker.estimatedDuration}`),
              highlightedCoworker?.price?.credits != null && React.createElement(Text, {dimColor: true}, `Price: ${highlightedCoworker.price.credits} credits per task`),
              React.createElement(Text, {dimColor: true}, `Status: ${highlightedCoworker.status || 'unknown'}`),
              React.createElement(Text, {dimColor: true}, 'Enter opens details. Press T to create a task immediately.')
            )
          : React.createElement(Box, {flexDirection: 'column', width: '100%'},
              React.createElement(Text, {bold: true}, 'Back'),
              React.createElement(Text, {dimColor: true}, 'Return to the main menu.')
            )
        )
      ),
      React.createElement(Box, {marginTop: 1},
        React.createElement(Text, {dimColor: true}, 'Enter: details • T: create task • Esc: go back')
      )
    )
  );
}
