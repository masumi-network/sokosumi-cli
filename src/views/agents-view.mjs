import React, {useEffect, useMemo, useState} from 'react';
import {Box, Text} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import SelectInput from '../components/select-input.mjs';
import PixelLoader from '../components/pixel-loader.mjs';
import {fetchAgents} from '../api/index.mjs';

const BRAND_HEX = '#7F00FF';

function AgentRow({agent}) {
  const tags = (agent.tags || []).map(t => t?.name).filter(Boolean);
  const credits = agent?.price?.credits;
  return React.createElement(
    Box,
    {flexDirection: 'row', justifyContent: 'space-between', width: '100%'},
    React.createElement(Box, {flexDirection: 'column', flexGrow: 1, flexShrink: 1},
      React.createElement(Text, {bold: true, wrap: 'truncate'}, agent.name || ''),
      agent.description && React.createElement(Text, {dimColor: true, wrap: 'truncate'}, agent.description),
      tags.length > 0 && React.createElement(Text, {dimColor: true, wrap: 'truncate'}, `Tags: ${tags.join(', ')}`)
    ),
    React.createElement(Box, {marginLeft: 2, flexGrow: 0, flexShrink: 0},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, credits != null ? `${credits}\u00A0cr` : '')
    )
  );
}

export default function AgentsView({onBack, onSelectAgent, onHireAgent}) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState(null);

  const load = async () => {
    setStatus('loading');
    setError(null);
    try {
      const {agents: list} = await fetchAgents();
      setAgents(list);
      setStatus('ready');
    } catch (e) {
      setError(e?.message || 'Failed to load agents');
      setStatus('error');
    }
  };

  useEffect(() => { load(); }, []);

  const items = useMemo(() => {
    const rows = [];
    for (const a of agents) {
      rows.push({
        label: a.name || a.id,
        value: a.id,
        agent: a,
        render: () => React.createElement(AgentRow, {agent: a})
      });
      rows.push({
        label: 'Hire this Agent',
        value: `__hire:${a.id}`,
        agent: a,
        render: () => React.createElement(
          Box,
          {marginLeft: 2},
          React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Hire this Agent')
        )
      });
    }
    rows.push({label: 'Back', value: '__back'});
    return rows;
  }, [agents]);

  const handleSelect = item => {
    if (item.value === '__back') return onBack && onBack();
    if (String(item.value || '').startsWith('__hire:')) {
      const id = String(item.value).slice('__hire:'.length);
      const agent = agents.find(a => a.id === id) || item.agent;
      return onHireAgent && onHireAgent(agent);
    }
    const selected = agents.find(a => a.id === item.value) || item.agent;
    if (selected) onSelectAgent && onSelectAgent(selected);
  };

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column'},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Agents Gallery'),
      status === 'loading' && React.createElement(PixelLoader),
      status === 'error' && React.createElement(Text, {color: 'red'}, error || 'Error'),
      status === 'ready' && agents.length === 0 && React.createElement(Text, null, 'No agents available'),
      status === 'ready' && React.createElement(Box, {marginTop: 1},
        React.createElement(SelectInput, {items, onSelect: handleSelect})
      ),
      React.createElement(Box, {marginTop: 1},
        React.createElement(Text, null, 'Tip: Press Esc to return to the main menu')
      )
    )
  );
}


