import React, {useEffect, useState, useMemo} from 'react';
import {Box, Text, useInput} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import SelectInput from '../components/select-input.mjs';
import PixelLoader from '../components/pixel-loader.mjs';
import {fetchTasks, fetchJobInputRequest} from '../api/index.mjs';

const BRAND_HEX = '#7F00FF';
const POLL_INTERVAL = 5000; // Poll every 5 seconds

export default function DashboardView({onBack, onSelectTask, onInputRequest}) {
  const [status, setStatus] = useState('loading');
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [inputRequests, setInputRequests] = useState({}); // taskId -> inputRequest

  // Initial load
  useEffect(() => {
    loadTasks();
  }, []);

  // Polling for updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadTasks();
      checkInputRequests();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [tasks]);

  const loadTasks = async () => {
    try {
      const {tasks: fetchedTasks} = await fetchTasks();

      // Filter tasks: show running/pending, or recently completed (last 24 hours)
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const filtered = (fetchedTasks || []).filter(task => {
        const jobs = task.jobs || [];

        // Show if has running or pending jobs
        const hasActiveJobs = jobs.some(j => j.status === 'running' || j.status === 'pending');
        if (hasActiveJobs) return true;

        // Show if completed/failed in last 24 hours
        const hasRecentJobs = jobs.some(j => {
          if (j.status !== 'completed' && j.status !== 'failed') return false;
          const completedAt = j.completedAt ? new Date(j.completedAt) : null;
          return completedAt && completedAt > oneDayAgo;
        });
        if (hasRecentJobs) return true;

        // Hide old drafts with no jobs
        if (jobs.length === 0 && task.status === 'DRAFT') {
          const createdAt = task.createdAt ? new Date(task.createdAt) : null;
          return createdAt && createdAt > oneDayAgo; // Only show recent drafts
        }

        return false;
      });

      setTasks(filtered);
      setStatus('ready');
      setLastUpdate(new Date());
      setError(null);
    } catch (e) {
      setError(e?.message || 'Failed to load tasks');
      setStatus('error');
    }
  };

  const checkInputRequests = async () => {
    // Check each running job for input requests
    const requests = {};
    for (const task of tasks) {
      const runningJobs = (task.jobs || []).filter(j => j.status === 'running' || j.status === 'pending');
      for (const job of runningJobs) {
        try {
          const {inputRequest} = await fetchJobInputRequest(job.id);
          if (inputRequest && inputRequest.eventId) {
            requests[job.id] = inputRequest;
          }
        } catch {
          // No input request for this job
        }
      }
    }
    setInputRequests(requests);
  };

  const getTaskStatus = (task) => {
    const jobs = task.jobs || [];
    if (jobs.length === 0) return 'draft';

    const hasRunning = jobs.some(j => j.status === 'running' || j.status === 'pending');
    const hasFailed = jobs.some(j => j.status === 'failed');
    const allCompleted = jobs.every(j => j.status === 'completed');

    if (hasRunning) return 'running';
    if (hasFailed) return 'failed';
    if (allCompleted) return 'completed';
    return 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'running': return 'yellow';
      default: return 'white';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✓';
      case 'failed': return '✗';
      case 'running': return '◉';
      case 'draft': return '○';
      default: return '·';
    }
  };

  const getTimeAgo = (date) => {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '-';

    const seconds = Math.floor((new Date() - d) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const truncate = (str, maxLen) => {
    const s = String(str || '');
    return s.length > maxLen ? s.substring(0, maxLen - 1) + '…' : s.padEnd(maxLen);
  };

  const renderTableHeader = () => {
    return React.createElement(
      Box,
      {flexDirection: 'column', width: '100%'},
      React.createElement(Box, {flexDirection: 'row'},
        React.createElement(Text, {bold: true, color: BRAND_HEX}, truncate('TASK NAME', 30)),
        React.createElement(Text, {bold: true, color: BRAND_HEX}, truncate('COWORKER', 15)),
        React.createElement(Text, {bold: true, color: BRAND_HEX}, truncate('JOBS', 8)),
        React.createElement(Text, {bold: true, color: BRAND_HEX}, truncate('STATUS', 12)),
        React.createElement(Text, {bold: true, color: BRAND_HEX}, truncate('UPDATED', 12))
      ),
      React.createElement(Text, {dimColor: true}, '─'.repeat(30) + '─'.repeat(15) + '─'.repeat(8) + '─'.repeat(12) + '─'.repeat(12))
    );
  };

  const renderTableRow = (task, index) => {
    const taskStatus = getTaskStatus(task);
    const statusColor = getStatusColor(taskStatus);
    const jobsWithInput = (task.jobs || []).filter(j => inputRequests[j.id]);
    const hasInputRequest = jobsWithInput.length > 0;
    const statusIcon = getStatusIcon(taskStatus);

    const jobCountText = hasInputRequest ? `${(task.jobs || []).length} 🔔` : String((task.jobs || []).length);

    return React.createElement(
      Box,
      {key: task.id || index, flexDirection: 'row', width: '100%'},
      React.createElement(Box, {width: 30, flexShrink: 0},
        taskStatus === 'running' && React.createElement(PixelLoader, {label: '', color: 'yellow'}),
        taskStatus === 'running' && React.createElement(Text, null, ' '),
        React.createElement(Text, {wrap: 'truncate'}, truncate((task.name || 'Untitled').replace(/^(.{0,27}).*$/, '$1'), taskStatus === 'running' ? 28 : 30))
      ),
      React.createElement(Text, {wrap: 'truncate'}, truncate(task.coworkerName || '-', 15)),
      React.createElement(Text, {color: hasInputRequest ? 'red' : 'white'}, truncate(jobCountText, 8)),
      React.createElement(Text, {color: statusColor}, truncate(`${statusIcon} ${taskStatus.toUpperCase()}`, 12)),
      React.createElement(Text, {dimColor: true}, truncate(getTimeAgo(task.updatedAt), 12))
    );
  };

  const taskItems = useMemo(() => tasks.map((t, i) => ({
    label: t.name || 'Untitled Task',
    value: t.id,
    task: t,
    index: i
  })), [tasks, inputRequests]);

  useInput((input, key) => {
    if (input === 'r' || input === 'R') {
      loadTasks();
    }
  });

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column', width: '100%'},
      React.createElement(Box, {flexDirection: 'row', justifyContent: 'space-between', width: '100%'},
        React.createElement(Text, {color: BRAND_HEX, bold: true}, '📊 Task Dashboard'),
        React.createElement(Text, {dimColor: true}, `Last update: ${lastUpdate.toLocaleTimeString()}`)
      ),
      React.createElement(Text, {dimColor: true}, 'Real-time task monitoring • Updates every 5 seconds'),

      React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        status === 'loading' && React.createElement(PixelLoader, {label: 'Loading tasks...'}),
        status === 'error' && React.createElement(Text, {color: 'red'}, error || 'Error'),
        status === 'ready' && taskItems.length === 0 && React.createElement(Text, null, 'No tasks yet. Create a task from Coworkers menu!'),
        status === 'ready' && taskItems.length > 0 && React.createElement(Box, {flexDirection: 'column', width: '100%'},
          renderTableHeader(),
          ...tasks.map((task, i) => renderTableRow(task, i)),
          React.createElement(Box, {marginTop: 1},
            React.createElement(Text, {dimColor: true}, '─'.repeat(77))
          ),
          React.createElement(Box, {marginTop: 1},
            React.createElement(Text, {bold: true}, `Total: ${taskItems.length} tasks`)
          )
        )
      ),


      React.createElement(Box, {marginTop: 1, borderStyle: 'single', borderColor: 'gray', paddingX: 1},
        React.createElement(Text, {dimColor: true}, 'Press R to refresh • Press Esc to go back')
      )
    )
  );
}
