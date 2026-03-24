import React, {useEffect, useMemo, useState} from 'react';
import {Box, Text} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import SelectInput from '../components/select-input.mjs';
import PixelLoader from '../components/pixel-loader.mjs';
import {fetchCoworkers, fetchTasks} from '../api/index.mjs';
import {getTaskStatusLabel, getTaskStatusTone} from '../utils/status.mjs';

const BRAND_HEX = '#7F00FF';

function TaskRow({task, coworkerLabel}) {
  const jobCount = task?.jobs?.length || 0;
  return React.createElement(
    Box,
    {flexDirection: 'row', justifyContent: 'space-between', width: '100%'},
    React.createElement(Box, {flexDirection: 'column', flexGrow: 1, flexShrink: 1},
      React.createElement(Text, {bold: true, wrap: 'truncate'}, task.name || 'Unnamed Task'),
      coworkerLabel && React.createElement(Text, {dimColor: true, wrap: 'truncate'}, `Coworker: ${coworkerLabel}`),
      React.createElement(Text, {dimColor: true, wrap: 'truncate'}, `${jobCount} job${jobCount !== 1 ? 's' : ''}`)
    ),
    React.createElement(Box, {marginLeft: 2, flexGrow: 0, flexShrink: 0},
      React.createElement(Text, {
        color: getTaskStatusTone(task.status),
        bold: true
      }, getTaskStatusLabel(task.status))
    )
  );
}

export default function TasksView({onBack, onSelectTask}) {
  const [status, setStatus] = useState('loading');
  const [tasks, setTasks] = useState([]);
  const [coworkersById, setCoworkersById] = useState({});
  const [error, setError] = useState(null);

  const load = async () => {
    setStatus('loading');
    setError(null);
    try {
      const {tasks: list} = await fetchTasks();
      const coworkersResult = await fetchCoworkers().catch(() => ({coworkers: []}));
      const coworkers = coworkersResult?.coworkers || [];
      const coworkerMap = Object.fromEntries((coworkers || []).map(coworker => [coworker.id, coworker.name || coworker.id]));
      setTasks(list);
      setCoworkersById(coworkerMap);
      setStatus('ready');
    } catch (e) {
      setError(e?.message || 'Failed to load tasks');
      setStatus('error');
    }
  };

  useEffect(() => { load(); }, []);

  const items = useMemo(() => {
    const rows = tasks.map(t => ({
      label: t.name || t.id,
      value: t.id,
      task: t,
      render: () => React.createElement(TaskRow, {
        task: t,
        coworkerLabel: coworkersById[t.coworkerId] || t.coworkerName || t.coworkerId || null
      })
    }));
    rows.push({label: 'Refresh', value: '__refresh'});
    rows.push({label: 'Back', value: '__back'});
    return rows;
  }, [tasks, coworkersById]);

  const handleSelect = item => {
    if (item.value === '__back') return onBack && onBack();
    if (item.value === '__refresh') return load();
    const selected = tasks.find(t => t.id === item.value) || item.task;
    if (selected) onSelectTask && onSelectTask(selected);
  };

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column'},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Your Tasks'),
      status === 'loading' && React.createElement(Box, {marginTop: 1}, React.createElement(PixelLoader)),
      status === 'error' && React.createElement(Box, {marginTop: 1}, React.createElement(Text, {color: 'red'}, error || 'Error')),
      status === 'ready' && tasks.length === 0 && React.createElement(Box, {marginTop: 1}, React.createElement(Text, null, 'No tasks yet. Create one from the Coworkers menu!')),
      status === 'ready' && React.createElement(Box, {marginTop: 1},
        React.createElement(SelectInput, {items, onSelect: handleSelect})
      ),
      React.createElement(Box, {marginTop: 1},
        React.createElement(Text, null, 'Tip: Press Esc to return to the main menu')
      )
    )
  );
}
