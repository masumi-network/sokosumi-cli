import React, {useEffect, useMemo, useState} from 'react';
import {Box, Text} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import SelectInput from '../components/select-input.mjs';
import PixelLoader from '../components/pixel-loader.mjs';
import {fetchCoworkers} from '../api/index.mjs';

const BRAND_HEX = '#7F00FF';

function CoworkerRow({coworker}) {
  const capabilities = (coworker.capabilities || []).filter(Boolean);
  const credits = coworker?.price?.credits;
  return React.createElement(
    Box,
    {flexDirection: 'row', justifyContent: 'space-between', width: '100%'},
    React.createElement(Box, {flexDirection: 'column', flexGrow: 1, flexShrink: 1},
      React.createElement(Text, {bold: true, wrap: 'truncate'}, coworker.name || ''),
      coworker.description && React.createElement(Text, {dimColor: true, wrap: 'truncate'}, coworker.description),
      capabilities.length > 0 && React.createElement(Text, {dimColor: true, wrap: 'truncate'}, `Capabilities: ${capabilities.join(', ')}`),
      coworker.estimatedDuration && React.createElement(Text, {dimColor: true, wrap: 'truncate'}, `Est. duration: ${coworker.estimatedDuration}`)
    ),
    React.createElement(Box, {marginLeft: 2, flexGrow: 0, flexShrink: 0},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, credits != null ? `${credits}\u00A0cr` : '')
    )
  );
}

export default function CoworkersView({onBack, onSelectCoworker, onCreateTask}) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [coworkers, setCoworkers] = useState([]);
  const [error, setError] = useState(null);

  const load = async () => {
    setStatus('loading');
    setError(null);
    try {
      const {coworkers: list} = await fetchCoworkers();
      setCoworkers(list);
      setStatus('ready');
    } catch (e) {
      setError(e?.message || 'Failed to load coworkers');
      setStatus('error');
    }
  };

  useEffect(() => { load(); }, []);

  const items = useMemo(() => {
    const rows = coworkers.map(c => ({
      label: c.name || c.id,
      value: c.id,
      coworker: c,
      render: () => React.createElement(CoworkerRow, {coworker: c})
    }));
    rows.push({label: 'Back', value: '__back'});
    return rows;
  }, [coworkers]);

  const handleSelect = item => {
    if (item.value === '__back') return onBack && onBack();
    // Directly create task when selecting a coworker
    const selected = coworkers.find(c => c.id === item.value) || item.coworker;
    if (selected) onCreateTask && onCreateTask(selected);
  };

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column'},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Coworkers - Multi-Agent Orchestrators'),
      React.createElement(Box, {marginTop: 1},
        React.createElement(Text, {dimColor: true}, 'Coworkers coordinate multiple specialist agents to complete complex workflows')
      ),
      status === 'loading' && React.createElement(Box, {marginTop: 1}, React.createElement(PixelLoader)),
      status === 'error' && React.createElement(Box, {marginTop: 1}, React.createElement(Text, {color: 'red'}, error || 'Error')),
      status === 'ready' && coworkers.length === 0 && React.createElement(Box, {marginTop: 1}, React.createElement(Text, null, 'No coworkers available')),
      status === 'ready' && React.createElement(Box, {marginTop: 1},
        React.createElement(SelectInput, {items, onSelect: handleSelect})
      ),
      React.createElement(Box, {marginTop: 1},
        React.createElement(Text, {dimColor: true}, 'Select a coworker to create a task • Press Esc to go back')
      )
    )
  );
}
