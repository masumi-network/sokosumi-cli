import React, {useEffect, useMemo, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import SelectInput from '../components/select-input.mjs';
import PixelLoader from '../components/pixel-loader.mjs';
import {fetchCoworkers, fetchJobInputRequest, fetchTasks} from '../api/index.mjs';
import {
  getTaskDashboardState,
  getTaskStatusLabel,
  getTaskStatusTone,
  isJobActive,
  isTaskDone,
  isTaskDraft
} from '../utils/status.mjs';

const BRAND_HEX = '#7F00FF';
const POLL_INTERVAL = 5000;

function renderDateAgo(date) {
  if (!date) return '-';
  const resolved = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(resolved.getTime())) return '-';

  const seconds = Math.max(0, Math.floor((Date.now() - resolved.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncate(value, maxLength) {
  const text = String(value || '');
  if (text.length <= maxLength) return text.padEnd(maxLength);
  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}

export default function DashboardView({onBack, onSelectTask}) {
  const [status, setStatus] = useState('loading');
  const [tasks, setTasks] = useState([]);
  const [coworkersById, setCoworkersById] = useState({});
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [inputRequests, setInputRequests] = useState({});

  const loadTasks = async () => {
    try {
      const {tasks: fetchedTasks} = await fetchTasks();
      const coworkersResult = await fetchCoworkers().catch(() => ({coworkers: []}));
      const coworkers = coworkersResult?.coworkers || [];

      const coworkerMap = Object.fromEntries(
        (coworkers || []).map(coworker => [coworker.id, coworker.name || coworker.id])
      );

      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const filtered = (fetchedTasks || []).filter(task => {
        const normalizedStatus = task.status;
        const updatedAt = task.updatedAt instanceof Date ? task.updatedAt.getTime() : new Date(task.updatedAt || task.createdAt || 0).getTime();

        if (isTaskDraft(normalizedStatus)) {
          return updatedAt >= oneDayAgo;
        }

        if (isTaskDone(normalizedStatus)) {
          return updatedAt >= oneDayAgo;
        }

        return true;
      });

      setCoworkersById(coworkerMap);
      setTasks(filtered);
      setStatus('ready');
      setLastUpdate(new Date());
      setError(null);
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load tasks');
      setStatus('error');
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadTasks();
    }, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkInputRequests = async () => {
      const requests = {};

      for (const task of tasks) {
        const activeJobs = (task.jobs || []).filter(job => isJobActive(job.status));
        for (const job of activeJobs) {
          try {
            const {inputRequest} = await fetchJobInputRequest(job.id);
            if (cancelled) return;
            if (inputRequest?.eventId) {
              requests[job.id] = inputRequest;
            }
          } catch {
            // Ignore jobs without active input requests.
          }
        }
      }

      if (!cancelled) {
        setInputRequests(requests);
      }
    };

    if (tasks.length > 0) {
      checkInputRequests();
      return () => {
        cancelled = true;
      };
    }

    setInputRequests({});
    return () => {
      cancelled = true;
    };
  }, [tasks]);

  const getStatusIcon = (taskStatus) => {
    switch (getTaskDashboardState(taskStatus)) {
      case 'todo':
        return '○';
      case 'running':
        return '◉';
      case 'attention':
        return '!';
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'canceled':
        return '–';
      default:
        return '·';
    }
  };

  const renderTableHeader = () => React.createElement(
    Box,
    {flexDirection: 'column', width: '100%'},
    React.createElement(Box, {flexDirection: 'row'},
      React.createElement(Text, {bold: true, color: BRAND_HEX}, truncate('TASK NAME', 28)),
      React.createElement(Text, {bold: true, color: BRAND_HEX}, truncate('COWORKER', 18)),
      React.createElement(Text, {bold: true, color: BRAND_HEX}, truncate('JOBS', 8)),
      React.createElement(Text, {bold: true, color: BRAND_HEX}, truncate('STATUS', 18)),
      React.createElement(Text, {bold: true, color: BRAND_HEX}, truncate('UPDATED', 12))
    ),
    React.createElement(Text, {dimColor: true}, '─'.repeat(84))
  );

  const taskItems = useMemo(() => {
    const rows = tasks.map(task => {
      const coworkerLabel = coworkersById[task.coworkerId] || task.coworkerName || task.coworkerId || '-';
      const inputRequestCount = (task.jobs || []).filter(job => inputRequests[job.id]).length;
      const jobsLabel = inputRequestCount > 0
        ? `${(task.jobs || []).length} 🔔`
        : String((task.jobs || []).length);
      const taskLabel = getTaskStatusLabel(task.status);
      const statusText = `${getStatusIcon(task.status)} ${taskLabel}`;

      return {
        label: task.name || 'Untitled Task',
        value: task.id,
        task,
        render: () => React.createElement(
          Box,
          {flexDirection: 'row', width: '100%'},
          React.createElement(Text, {wrap: 'truncate'}, truncate(task.name || 'Untitled Task', 28)),
          React.createElement(Text, {wrap: 'truncate'}, truncate(coworkerLabel, 18)),
          React.createElement(Text, {color: inputRequestCount > 0 ? 'red' : undefined}, truncate(jobsLabel, 8)),
          React.createElement(Text, {color: getTaskStatusTone(task.status)}, truncate(statusText, 18)),
          React.createElement(Text, {dimColor: true}, truncate(renderDateAgo(task.updatedAt || task.createdAt), 12))
        )
      };
    });

    rows.push({label: 'Refresh', value: '__refresh'});
    rows.push({label: 'Back', value: '__back'});
    return rows;
  }, [coworkersById, inputRequests, tasks]);

  const handleSelect = item => {
    if (item.value === '__refresh') {
      loadTasks();
      return;
    }

    if (item.value === '__back') {
      onBack && onBack();
      return;
    }

    const selectedTask = tasks.find(task => task.id === item.value) || item.task;
    if (selectedTask) {
      onSelectTask && onSelectTask(selectedTask);
    }
  };

  useInput((input) => {
    if (input === 'r' || input === 'R') {
      loadTasks();
    }
  });

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column', width: '100%'},
      React.createElement(Box, {flexDirection: 'row', justifyContent: 'space-between', width: '100%'},
        React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Task Dashboard'),
        React.createElement(Text, {dimColor: true}, `Last update: ${lastUpdate.toLocaleTimeString()}`)
      ),
      React.createElement(Text, {dimColor: true}, 'Live task monitoring for drafts, todo, in-flight work, and recent completions'),
      React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        status === 'loading' && React.createElement(PixelLoader, {label: 'Loading tasks...'}),
        status === 'error' && React.createElement(Text, {color: 'red'}, error || 'Error'),
        status === 'ready' && taskItems.length === 2 && React.createElement(Text, null, 'No tasks yet. Create a task from the Coworkers menu.'),
        status === 'ready' && taskItems.length > 2 && React.createElement(Box, {flexDirection: 'column', width: '100%'},
          renderTableHeader(),
          React.createElement(SelectInput, {items: taskItems, onSelect: handleSelect})
        )
      ),
      status === 'ready' && React.createElement(Box, {marginTop: 1},
        React.createElement(Text, {dimColor: true}, `Total visible tasks: ${tasks.length}`)
      ),
      React.createElement(Box, {marginTop: 1, borderStyle: 'single', borderColor: 'gray', paddingX: 1},
        React.createElement(Text, {dimColor: true}, 'Press Enter to open a task • Press R to refresh • Press Esc to go back')
      ),
      status === 'ready' && Object.keys(inputRequests).length > 0 && React.createElement(Box, {marginTop: 1},
        React.createElement(Text, {color: 'red'}, `${Object.keys(inputRequests).length} running job${Object.keys(inputRequests).length === 1 ? '' : 's'} waiting for input`)
      )
    )
  );
}
