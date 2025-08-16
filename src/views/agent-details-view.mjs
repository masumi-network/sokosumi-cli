import React, {useEffect, useState, useMemo} from 'react';
import {Box, Text, useInput} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import {fetchAgentJobs} from '../api/index.mjs';
import SelectInput from '../components/select-input.mjs';
import PixelLoader from '../components/pixel-loader.mjs';

const BRAND_HEX = '#7F00FF';

export default function AgentDetailsView({agent, onBack}) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [lastJobIndex, setLastJobIndex] = useState(0);

  const tags = (agent?.tags || []).map(t => t?.name).filter(Boolean);

  useEffect(() => {
    let aborted = false;
    async function load() {
      if (!agent?.id) return;
      setStatus('loading');
      setError(null);
      try {
        const {jobs: list} = await fetchAgentJobs(agent.id);
        if (aborted) return;
        setJobs(list);
        setStatus('ready');
      } catch (e) {
        if (aborted) return;
        setError(e?.message || 'Failed to load jobs');
        setStatus('error');
      }
    }
    load();
    return () => { aborted = true; };
  }, [agent?.id]);

  const renderDate = (value) => {
    if (!value) return '-';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  };

  const JobRow = ({job}) => {
    return React.createElement(
      Box,
      {flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 1},
      React.createElement(Box, {flexDirection: 'column', flexGrow: 1, flexShrink: 1},
        React.createElement(Text, {bold: true, wrap: 'truncate'}, job.name || job.id || 'Job')
      ),
      React.createElement(Box, {marginLeft: 2, flexDirection: 'row', flexGrow: 0, flexShrink: 0},
        React.createElement(Text, {dimColor: true}, 'Status: '),
        React.createElement(Text, null, job.status || '-'),
        React.createElement(Text, {dimColor: true}, '   Started: '),
        React.createElement(Text, null, renderDate(job.startedAt))
      )
    );
  };

  const jobSelectItems = useMemo(() => jobs.map(j => ({
    label: j.name || j.id || 'Job',
    value: j.id || j.agentJobId,
    job: j,
    render: () => React.createElement(JobRow, {job: j})
  })), [jobs]);

  const handleJobSelect = (item) => {
    const job = item?.job || jobs.find(j => (j.id || j.agentJobId) === item?.value);
    if (job) {
      const idx = jobs.findIndex(j => (j.id || j.agentJobId) === (job.id || job.agentJobId));
      setLastJobIndex(idx >= 0 ? idx : 0);
    }
    setSelectedJob(job || null);
  };

  const parseJsonString = (maybeJsonString) => {
    if (!maybeJsonString || typeof maybeJsonString !== 'string') return null;
    try {
      return JSON.parse(maybeJsonString);
    } catch {
      return null;
    }
  };

  const renderMultiline = (text) => {
    const lines = String(text || '').split('\n');
    return React.createElement(
      Box,
      {flexDirection: 'column', width: '100%'},
      ...lines.map((line, idx) => React.createElement(Text, {key: idx}, line))
    );
  };

  const renderInlineStrong = (line) => {
    const parts = String(line || '').split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      const m = part.match(/^\*\*([^*]+)\*\*$/);
      if (m) {
        return React.createElement(Text, {key: idx, bold: true}, m[1]);
      }
      return React.createElement(Text, {key: idx}, part);
    });
  };

  const renderMarkdown = (md) => {
    const text = String(md || '');
    const lines = text.split('\n');
    return React.createElement(
      Box,
      {flexDirection: 'column', width: '100%'},
      ...lines.map((line, idx) => {
        if (/^\s*#\s+/.test(line) || /^\s*##\s+/.test(line) || /^\s*###\s+/.test(line)) {
          const clean = line.replace(/^\s*#+\s+/, '');
          return React.createElement(Text, {key: idx, bold: true, color: BRAND_HEX}, clean);
        }
        if (/^\s*[-*]\s+/.test(line)) {
          const clean = line.replace(/^\s*[-*]\s+/, '');
          return React.createElement(Text, {key: idx}, '• ', renderInlineStrong(clean));
        }
        return React.createElement(Text, {key: idx}, ...renderInlineStrong(line));
      })
    );
  };

  // Keyboard: when viewing a job's details, pressing Enter/Backspace/Left/B goes back to the list
  useInput((input, key) => {
    if (key.return || key.enter || key.backspace || key.leftArrow || input?.toLowerCase() === 'b' || input === '\\r' || input === '\\n') {
      setSelectedJob(null);
    }
  }, {isActive: Boolean(selectedJob)});

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column', width: '100%'},
    // Header with Agent info
    React.createElement(Text, {color: BRAND_HEX, bold: true}, agent?.name || 'Agent'),
    agent?.description && React.createElement(Text, null, agent.description),
    tags.length > 0 && React.createElement(Text, {dimColor: true}, `Tags: ${tags.join(', ')}`),
    agent?.price?.credits != null && React.createElement(Text, {color: BRAND_HEX}, `Credits: ${agent.price.credits}`),

    // Jobs list
    React.createElement(Box, {marginTop: 1},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Jobs')
    ),
    status === 'loading' && React.createElement(PixelLoader, {label: 'Loading jobs...'}),
    status === 'error' && React.createElement(Text, {color: 'red'}, error || 'Error'),
    status === 'ready' && jobs.length === 0 && React.createElement(Text, null, 'No jobs found for this agent'),
    status === 'ready' && jobs.length > 0 && React.createElement(Box, {flexDirection: 'column', width: '100%'},
      React.createElement(SelectInput, {items: jobSelectItems, onSelect: handleJobSelect, listen: !selectedJob, initialIndex: lastJobIndex, key: `jobs-${lastJobIndex}-${jobs.length}`})
    ),

    // Selected job details
    selectedJob && React.createElement(Box, {marginTop: 1, flexDirection: 'column', width: '100%'},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Job Details'),
      React.createElement(Text, {bold: true}, selectedJob.name || selectedJob.id || 'Job'),
      React.createElement(Text, {dimColor: true}, `Status: ${selectedJob.status || '-'}`),
      React.createElement(Text, {dimColor: true}, `Started: ${renderDate(selectedJob.startedAt)}`),

      // Input
      React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Input'),
        (() => {
          const parsed = parseJsonString(selectedJob.input);
          if (parsed && typeof parsed === 'object') {
            const mdParts = [];
            if (typeof parsed.question === 'string' && parsed.question.trim()) {
              mdParts.push('## Question');
              mdParts.push('');
              mdParts.push(parsed.question.trim());
            }
            const otherKeys = Object.keys(parsed).filter(k => k !== 'question');
            if (otherKeys.length > 0) {
              mdParts.push('');
              mdParts.push('## Inputs');
              for (const key of otherKeys) {
                const value = parsed[key];
                if (Array.isArray(value)) {
                  for (const item of value) mdParts.push(`- ${key}: ${String(item)}`);
                } else if (value && typeof value === 'object') {
                  mdParts.push(`- ${key}: ${JSON.stringify(value)}`);
                } else {
                  mdParts.push(`- ${key}: ${String(value)}`);
                }
              }
            }
            const md = mdParts.join('\n');
            return renderMarkdown(md);
          }
          return renderMarkdown(selectedJob.input || '—');
        })()
      ),

      // Output
      React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Output'),
        (() => {
          const parsed = parseJsonString(selectedJob.output);
          const resultMd = parsed && typeof parsed.result === 'string' ? parsed.result : (selectedJob.output || '—');
          return renderMarkdown(resultMd);
        })()
      )
    ),

    // Back action when in details
    selectedJob && React.createElement(Box, {marginTop: 1, flexDirection: 'column', width: '100%'},
      React.createElement(SelectInput, {
        items: [{label: 'Back to jobs', value: '__back'}],
        onSelect: () => setSelectedJob(null),
        listen: true
      })
    ),

    React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
      selectedJob && React.createElement(Text, null, 'Tip: Press Enter on "Back to jobs" to return to the list'),
      React.createElement(Text, null, 'Tip: Press Esc to return to the agents list')
    )
    )
  );
}


