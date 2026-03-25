import React, {useEffect, useMemo, useState} from 'react';
import {Box, Text} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import SelectInput from '../components/select-input.mjs';
import PixelLoader from '../components/pixel-loader.mjs';
import {
  createTaskEvent,
  fetchCoworkers,
  fetchTask,
  fetchTaskEvents,
  fetchTaskJobs
} from '../api/index.mjs';
import {
  getJobStatusLabel,
  getJobStatusTone,
  getTaskStatusLabel,
  getTaskStatusTone,
  isTaskDone,
  normalizeTaskStatus
} from '../utils/status.mjs';
import {
  createTaskCommentPreview,
  extractTaskCommentArtifacts
} from '../utils/task-comment.mjs';

const BRAND_HEX = '#7F00FF';

function renderDate(value) {
  if (!value) return '-';
  const resolved = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(resolved.getTime())) return '-';
  return resolved.toLocaleString();
}

function renderEventSummary(event) {
  const statusLabel = event?.status ? getTaskStatusLabel(event.status) : null;
  const comment = event?.comment ? createTaskCommentPreview(event.comment, 140) : null;

  if (statusLabel && comment) return `${statusLabel} • ${comment}`;
  if (statusLabel) return statusLabel;
  if (comment) return comment;
  return event?.origin || event?.id || 'Event';
}

function renderInlineStrong(line) {
  const parts = String(line || '').split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const match = part.match(/^\*\*([^*]+)\*\*$/);
    if (match) {
      return React.createElement(Text, {key: index, bold: true}, match[1]);
    }
    return React.createElement(Text, {key: index}, part);
  });
}

function renderMarkdown(markdown) {
  const lines = String(markdown || '').split('\n');

  return React.createElement(
    Box,
    {flexDirection: 'column', width: '100%'},
    ...lines.map((line, index) => {
      if (/^\s*#{1,3}\s+/.test(line)) {
        const clean = line.replace(/^\s*#{1,3}\s+/, '');
        return React.createElement(Text, {key: index, bold: true, color: BRAND_HEX}, clean);
      }

      if (/^\s*[-*]\s+/.test(line)) {
        const clean = line.replace(/^\s*[-*]\s+/, '');
        return React.createElement(Text, {key: index}, '• ', ...renderInlineStrong(clean));
      }

      return React.createElement(Text, {key: index}, ...renderInlineStrong(line));
    })
  );
}

function getArtifactSummary(artifacts) {
  if (!artifacts) return null;

  const parts = [];
  if (artifacts.files?.length) {
    parts.push(`${artifacts.files.length} deliverable${artifacts.files.length === 1 ? '' : 's'}`);
  }
  if (artifacts.links?.length) {
    parts.push(`${artifacts.links.length} link${artifacts.links.length === 1 ? '' : 's'}`);
  }

  return parts.length > 0 ? parts.join(' • ') : null;
}

export default function TaskDetailsView({task, onBack, onAddJob}) {
  const [status, setStatus] = useState('loading');
  const [taskData, setTaskData] = useState(task || null);
  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [coworkerName, setCoworkerName] = useState(task?.coworkerName || null);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const taskId = task?.id || taskData?.id;

  const load = async () => {
    if (!taskId) {
      setError('Task not found');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);
    setActionError(null);

    try {
      const [{task: loadedTask}, {jobs: loadedJobs}, {events: loadedEvents}, coworkersResult] = await Promise.all([
        fetchTask(taskId),
        fetchTaskJobs(taskId),
        fetchTaskEvents(taskId),
        fetchCoworkers().catch(() => ({coworkers: []}))
      ]);
      const coworkers = coworkersResult?.coworkers || [];

      const coworkerMap = Object.fromEntries((coworkers || []).map(coworker => [coworker.id, coworker.name || coworker.id]));

      setTaskData(loadedTask || null);
      setJobs(loadedJobs || []);
      setEvents(Array.isArray(loadedEvents) ? loadedEvents : []);
      setCoworkerName(
        coworkerMap[loadedTask?.coworkerId] ||
        loadedTask?.coworkerName ||
        loadedTask?.coworkerId ||
        null
      );
      setStatus('ready');
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load task');
      setStatus('error');
    }
  };

  useEffect(() => {
    load();
  }, [taskId]);

  const normalizedTaskStatus = normalizeTaskStatus(taskData?.status);
  const canToggleStatus = normalizedTaskStatus === 'DRAFT' || normalizedTaskStatus === 'READY';
  const canAddJob = !isTaskDone(normalizedTaskStatus);

  const actionItems = useMemo(() => {
    const items = [];

    if (canAddJob) {
      items.push({label: 'Add Agent Job', value: '__addJob'});
    }

    if (canToggleStatus) {
      items.push({
        label: normalizedTaskStatus === 'DRAFT' ? 'Mark Ready' : 'Move to Draft',
        value: '__toggleStatus'
      });
    }

    items.push({label: 'Refresh', value: '__refresh'});
    items.push({label: 'Back', value: '__back'});
    return items;
  }, [canAddJob, canToggleStatus, normalizedTaskStatus]);

  const orderedEvents = useMemo(() => {
    return [...events].sort((left, right) => {
      const leftTime = new Date(left?.createdAt || 0).getTime();
      const rightTime = new Date(right?.createdAt || 0).getTime();
      return rightTime - leftTime;
    });
  }, [events]);

  const sortedEvents = useMemo(() => orderedEvents.slice(0, 5), [orderedEvents]);

  const highlightedEvent = useMemo(() => {
    const latestCommentEvent = orderedEvents.find(event => (
      event?.comment &&
      String(event.comment).trim()
    )) || null;

    if (!isTaskDone(normalizedTaskStatus)) {
      return latestCommentEvent;
    }

    return orderedEvents.find(event => (
      normalizeTaskStatus(event?.status) === 'COMPLETED' &&
      event?.comment &&
      String(event.comment).trim()
    )) || latestCommentEvent;
  }, [normalizedTaskStatus, orderedEvents]);

  const highlightedArtifacts = useMemo(() => {
    return highlightedEvent?.comment ? extractTaskCommentArtifacts(highlightedEvent.comment) : null;
  }, [highlightedEvent]);

  const handleSelect = async item => {
    if (item.value === '__back') {
      onBack && onBack();
      return;
    }

    if (item.value === '__refresh') {
      load();
      return;
    }

    if (item.value === '__addJob') {
      onAddJob && onAddJob(taskData);
      return;
    }

    if (item.value === '__toggleStatus') {
      const nextStatus = normalizedTaskStatus === 'DRAFT' ? 'READY' : 'DRAFT';
      setActionBusy(true);
      setActionError(null);
      try {
        await createTaskEvent(taskId, {status: nextStatus});
        await load();
      } catch (updateError) {
        setActionError(updateError?.message || 'Failed to update task status');
      } finally {
        setActionBusy(false);
      }
    }
  };

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column', width: '100%'},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Task Details'),
      status === 'loading' && React.createElement(PixelLoader, {label: 'Loading task...'}),
      status === 'error' && React.createElement(Text, {color: 'red'}, error || 'Error'),
      status === 'ready' && taskData && React.createElement(Box, {flexDirection: 'column', marginTop: 1},
        React.createElement(Text, {bold: true}, taskData.name || taskData.id || 'Untitled Task'),
        taskData.description && React.createElement(Text, {dimColor: true}, taskData.description),
        React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
          React.createElement(Text, {color: getTaskStatusTone(taskData.status), bold: true}, getTaskStatusLabel(taskData.status)),
          React.createElement(Text, {dimColor: true}, `Coworker: ${coworkerName || '-'}`),
          taskData.totalCredits != null && React.createElement(Text, {dimColor: true}, `Credits: ${taskData.totalCredits}`),
          React.createElement(Text, {dimColor: true}, `Created: ${renderDate(taskData.createdAt)}`),
          React.createElement(Text, {dimColor: true}, `Updated: ${renderDate(taskData.updatedAt)}`)
        ),
        React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
          React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Jobs'),
          jobs.length === 0 && React.createElement(Box, {flexDirection: 'column'},
            React.createElement(Text, {dimColor: true}, 'No direct agent jobs added yet'),
            React.createElement(Text, {dimColor: true}, 'Coworker results appear in Latest Result and Recent Activity below')
          ),
          jobs.length > 0 && jobs.map(job => React.createElement(
            Box,
            {key: job.id || `${job.agentId}-${job.createdAt}`, flexDirection: 'row', justifyContent: 'space-between', width: '100%'},
            React.createElement(Box, {flexDirection: 'column', flexGrow: 1, flexShrink: 1},
              React.createElement(Text, {bold: true, wrap: 'truncate'}, job.name || job.agentName || job.id || 'Job'),
              job.agentName && React.createElement(Text, {dimColor: true, wrap: 'truncate'}, `Agent: ${job.agentName}`)
            ),
            React.createElement(Box, {marginLeft: 2, flexDirection: 'column', alignItems: 'flex-end'},
              React.createElement(Text, {color: getJobStatusTone(job.status)}, getJobStatusLabel(job.status)),
              job.credits != null && React.createElement(Text, {dimColor: true}, `${job.credits} cr`)
            )
          ))
        ),
        highlightedArtifacts && (highlightedArtifacts.body || highlightedArtifacts.files.length > 0 || highlightedArtifacts.links.length > 0) && React.createElement(
          Box,
          {marginTop: 1, flexDirection: 'column'},
          React.createElement(
            Text,
            {color: BRAND_HEX, bold: true},
            normalizeTaskStatus(highlightedEvent?.status) === 'COMPLETED' ? 'Latest Result' : 'Latest Update'
          ),
          React.createElement(Text, {dimColor: true}, renderDate(highlightedEvent?.createdAt)),
          highlightedArtifacts.body && React.createElement(Box, {marginTop: 1}, renderMarkdown(highlightedArtifacts.body)),
          highlightedArtifacts.files.length > 0 && React.createElement(
            Box,
            {marginTop: 1, flexDirection: 'column'},
            React.createElement(Text, {bold: true}, 'Deliverables'),
            ...highlightedArtifacts.files.map((file, index) => React.createElement(
              Box,
              {
                key: `${file.url}-${index}`,
                flexDirection: 'column',
                marginTop: 1,
                borderStyle: 'single',
                borderColor: 'gray',
                paddingX: 1
              },
              React.createElement(Text, {bold: true}, file.name || 'Attachment'),
              React.createElement(Text, {color: 'cyan', wrap: 'truncate'}, file.url)
            ))
          ),
          highlightedArtifacts.links.length > 0 && React.createElement(
            Box,
            {marginTop: 1, flexDirection: 'column'},
            React.createElement(Text, {bold: true}, 'Links'),
            ...highlightedArtifacts.links.map((link, index) => React.createElement(
              Box,
              {
                key: `${link.url}-${index}`,
                flexDirection: 'column',
                marginTop: 1,
                borderStyle: 'single',
                borderColor: 'gray',
                paddingX: 1
              },
              React.createElement(Text, {bold: true}, link.title || 'Link'),
              link.description && React.createElement(Text, {dimColor: true}, link.description),
              React.createElement(Text, {color: 'cyan', wrap: 'truncate'}, link.url)
            ))
          )
        ),
        React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
          React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Recent Activity'),
          sortedEvents.length === 0 && React.createElement(Text, {dimColor: true}, 'No task activity yet'),
          sortedEvents.length > 0 && sortedEvents.map(event => {
            const artifacts = event?.comment ? extractTaskCommentArtifacts(event.comment) : null;
            const artifactSummary = getArtifactSummary(artifacts);

            return React.createElement(
              Box,
              {key: event.id || `${event.createdAt}-${event.origin}`, flexDirection: 'column', marginBottom: 1},
              React.createElement(Text, null, renderEventSummary(event)),
              artifactSummary && React.createElement(Text, {dimColor: true}, artifactSummary),
              React.createElement(Text, {dimColor: true}, renderDate(event.createdAt))
            );
          })
        ),
        actionBusy && React.createElement(Box, {marginTop: 1},
          React.createElement(PixelLoader, {label: 'Updating task...'})
        ),
        actionError && React.createElement(Box, {marginTop: 1},
          React.createElement(Text, {color: 'red'}, actionError)
        ),
        React.createElement(Box, {marginTop: 1},
          React.createElement(SelectInput, {items: actionItems, onSelect: handleSelect, listen: !actionBusy})
        )
      ),
      React.createElement(Box, {marginTop: 1},
        React.createElement(Text, {dimColor: true}, 'Press Esc to go back')
      )
    )
  );
}
