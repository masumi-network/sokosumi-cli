import React, {useEffect, useMemo, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import SelectInput from '../components/select-input.mjs';
import PixelLoader from '../components/pixel-loader.mjs';
import {fetchAgents} from '../api/index.mjs';
import {getAgentDescriptionSummary} from '../utils/agent-description.mjs';

const BRAND_HEX = '#7F00FF';

function AgentListRow({agent}) {
  const credits = agent?.price?.credits;
  return React.createElement(
    Box,
    {flexDirection: 'row', justifyContent: 'space-between', width: '100%'},
    React.createElement(Text, {bold: true, wrap: 'truncate-end'}, agent.name || agent.id || 'Untitled Agent'),
    React.createElement(Box, {marginLeft: 2, flexGrow: 0, flexShrink: 0, minWidth: 8, justifyContent: 'flex-end'},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, credits != null ? `${credits}\u00A0cr` : '')
    )
  );
}

export default function AgentsView({onBack, onSelectAgent, onHireAgent}) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState(null);
  const [highlightedAgent, setHighlightedAgent] = useState(null);

  const load = async () => {
    setStatus('loading');
    setError(null);
    try {
      const {agents: list} = await fetchAgents();
      setAgents(list);
      setHighlightedAgent(list?.[0] || null);
      setStatus('ready');
    } catch (e) {
      setError(e?.message || 'Failed to load agents');
      setStatus('error');
    }
  };

  useEffect(() => { load(); }, []);

  const items = useMemo(() => {
    return [
      ...agents.map(agent => ({
        label: agent.name || agent.id,
        value: agent.id,
        agent,
        render: () => React.createElement(AgentListRow, {agent})
      })),
      {label: 'Back', value: '__back'}
    ];
  }, [agents]);

  const handleSelect = item => {
    if (item.value === '__back') return onBack && onBack();
    const selected = agents.find(a => a.id === item.value) || item.agent;
    if (selected) onSelectAgent && onSelectAgent(selected);
  };

  useInput((input, key) => {
    if (status !== 'ready') return;
    if (key.return || key.upArrow || key.downArrow || key.escape) return;
    if ((input === 'h' || input === 'H') && highlightedAgent) {
      onHireAgent && onHireAgent(highlightedAgent);
    }
  });

  const selectedTags = useMemo(
    () => (highlightedAgent?.tags || []).map(tag => tag?.name).filter(Boolean),
    [highlightedAgent]
  );
  const highlightedDescription = useMemo(
    () => getAgentDescriptionSummary(highlightedAgent?.description, {maxLength: 360}),
    [highlightedAgent?.description]
  );

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column', width: '100%'},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Agents Gallery'),
      status === 'loading' && React.createElement(PixelLoader),
      status === 'error' && React.createElement(Text, {color: 'red'}, error || 'Error'),
      status === 'ready' && agents.length === 0 && React.createElement(Text, null, 'No agents available'),
      status === 'ready' && React.createElement(Box, {marginTop: 1, flexDirection: 'column', width: '100%'},
        React.createElement(SelectInput, {
          items,
          onSelect: handleSelect,
          onHighlight: item => setHighlightedAgent(item?.agent || null),
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
        highlightedAgent
          ? React.createElement(Box, {flexDirection: 'column', width: '100%'},
              React.createElement(Text, {bold: true, color: BRAND_HEX}, highlightedAgent.name || highlightedAgent.id || 'Agent Preview'),
              highlightedDescription && React.createElement(Text, {dimColor: true}, highlightedDescription),
              selectedTags.length > 0 && React.createElement(Text, {dimColor: true}, `Tags: ${selectedTags.join(', ')}`),
              highlightedAgent?.price?.credits != null && React.createElement(Text, {dimColor: true}, `Price: ${highlightedAgent.price.credits} credits`),
              React.createElement(Text, {dimColor: true}, 'Enter opens details. Press H to hire immediately.')
            )
          : React.createElement(Box, {flexDirection: 'column', width: '100%'},
              React.createElement(Text, {bold: true}, 'Back'),
              React.createElement(Text, {dimColor: true}, 'Return to the main menu.')
            )
        )
      ),
      React.createElement(Box, {marginTop: 1},
        React.createElement(Text, null, 'Enter: details • H: hire selected agent • Esc: main menu')
      )
    )
  );
}
