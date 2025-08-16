import React, {useEffect, useMemo, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import SelectInput from '../components/select-input.mjs';
import PixelLoader from '../components/pixel-loader.mjs';
import {fetchAgents, fetchAgentJobs} from '../api/index.mjs';

const BRAND_HEX = '#7F00FF';

function AgentRow({agent, jobCount}) {
  const tags = (agent.tags || []).map(t => t?.name).filter(Boolean);
  const credits = agent?.price?.credits;
  return React.createElement(
    Box,
    {flexDirection: 'row', justifyContent: 'space-between', width: '100%'},
    React.createElement(Box, {flexDirection: 'column', flexGrow: 1, flexShrink: 1},
      React.createElement(Text, {bold: true, wrap: 'truncate'}, agent.name || ''),
      agent.description && React.createElement(Text, {dimColor: true, wrap: 'truncate'}, agent.description),
      tags.length > 0 && React.createElement(Text, {dimColor: true, wrap: 'truncate'}, `Tags: ${tags.join(', ')}`),
      Number.isFinite(jobCount) && React.createElement(Text, {dimColor: true}, `Jobs with results: ${jobCount}`)
    ),
    React.createElement(Box, {marginLeft: 2, flexGrow: 0, flexShrink: 0},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, credits != null ? `${credits}\u00A0cr` : '')
    )
  );
}

export default function HiredAgentsView({onBack}) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [agentsData, setAgentsData] = useState([]); // [{agent, jobs: []}]
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [lastJobIndex, setLastJobIndex] = useState(0);
  // Follow AgentDetailsView behavior: don't overmanage focus; rely on listen flags

  useEffect(() => {
    let aborted = false;
    async function load() {
      setStatus('loading');
      setError(null);
      try {
        const {agents} = await fetchAgents();
        if (aborted) return;
        const jobPromises = agents.map(async (a) => {
          try {
            const {jobs} = await fetchAgentJobs(a.id);
            const withResults = (jobs || []).filter(j => {
              const out = j?.output;
              return out != null && String(out).trim().length > 0;
            });
            return {agent: a, jobs: withResults};
          } catch {
            return {agent: a, jobs: []};
          }
        });
        const results = await Promise.all(jobPromises);
        if (aborted) return;
        const filtered = results.filter(r => r.jobs.length > 0);
        setAgentsData(filtered);
        setStatus('ready');
      } catch (e) {
        if (aborted) return;
        setError(e?.message || 'Failed to load hired agents');
        setStatus('error');
      }
    }
    load();
    return () => { aborted = true; };
  }, []);

  const selectedAgentData = useMemo(() => agentsData.find(d => d.agent?.id === selectedAgentId) || null, [agentsData, selectedAgentId]);

  const renderDate = (value) => {
    if (!value) return '-';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  };

  const JobRow = ({job, agentName}) => {
    return React.createElement(
      Box,
      {flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 1},
      React.createElement(Box, {flexDirection: 'column', flexGrow: 1, flexShrink: 1},
        React.createElement(Text, {bold: true, wrap: 'truncate'}, job.name || job.id || 'Job'),
        React.createElement(Text, {dimColor: true, wrap: 'truncate'}, `Agent: ${agentName || '-'}`)
      ),
      React.createElement(Box, {marginLeft: 2, flexDirection: 'row', flexGrow: 0, flexShrink: 0},
        React.createElement(Text, {dimColor: true}, 'Status: '),
        React.createElement(Text, null, job.status || '-'),
        React.createElement(Text, {dimColor: true}, '   Started: '),
        React.createElement(Text, null, renderDate(job.startedAt))
      )
    );
  };

  const agentItems = useMemo(() => agentsData.map(({agent, jobs}) => ({
    label: agent.name || agent.id,
    value: agent.id,
    agent,
    jobs,
    render: () => React.createElement(AgentRow, {agent, jobCount: jobs.length})
  })), [agentsData]);

  const jobItems = useMemo(() => {
    if (!selectedAgentData) return [];
    const agentName = selectedAgentData.agent?.name || selectedAgentData.agent?.id;
    return selectedAgentData.jobs.map(j => ({
      label: `${agentName} — ${j.name || j.id || 'Job'}`,
      value: j.id || j.agentJobId,
      job: j,
      render: () => React.createElement(JobRow, {job: j, agentName})
    }));
  }, [selectedAgentData]);

  const handleAgentSelect = (item) => {
    if (item.value === '__back') return onBack && onBack();
    setSelectedJob(null);
    setSelectedAgentId(item.value);
  };

  const handleJobSelect = (item) => {
    const list = selectedAgentData?.jobs || [];
    const job = item?.job || list.find(j => (j.id || j.agentJobId) === item?.value);
    if (job) {
      const idx = list.findIndex(j => (j.id || j.agentJobId) === (job.id || job.agentJobId));
      setLastJobIndex(idx >= 0 ? idx : 0);
    }
    setSelectedJob(job || null);
  };

  const returnToJobsList = () => setSelectedJob(null);

  const parseJsonString = (maybeJsonString) => {
    if (!maybeJsonString || typeof maybeJsonString !== 'string') return null;
    try {
      return JSON.parse(maybeJsonString);
    } catch {
      return null;
    }
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

  // Keyboard: when viewing a job's details, allow quick back to job list (same as AgentDetailsView)
  useInput((input, key) => {
    if (key.return || key.enter || key.backspace || key.leftArrow || input?.toLowerCase() === 'b' || input === '\\r' || input === '\\n') {
      returnToJobsList();
    }
  }, {isActive: Boolean(selectedJob)});

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column', width: '100%'},
    React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Hired Agents'),

    // Agents list (only those with results)
    !selectedAgentId && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
      status === 'loading' && React.createElement(PixelLoader),
      status === 'error' && React.createElement(Text, {color: 'red'}, error || 'Error'),
      status === 'ready' && agentItems.length === 0 && React.createElement(Text, null, 'No hired agents with results yet'),
      status === 'ready' && agentItems.length > 0 && React.createElement(SelectInput, {items: [...agentItems, {label: 'Back', value: '__back'}], onSelect: handleAgentSelect})
    ),

    // Selected agent view
    selectedAgentId && (() => {
      const agent = selectedAgentData?.agent;
      const jobs = selectedAgentData?.jobs || [];
      const agentName = agent?.name || 'Agent';
      return React.createElement(
        Box,
        {flexDirection: 'column', width: '100%'},
        React.createElement(Text, {color: BRAND_HEX, bold: true}, agentName),
        agent?.description && React.createElement(Text, null, agent.description),
        (agent?.tags || []).length > 0 && React.createElement(Text, {dimColor: true}, `Tags: ${(agent.tags || []).map(t => t?.name).filter(Boolean).join(', ')}`),
        agent?.price?.credits != null && React.createElement(Text, {color: BRAND_HEX}, `Credits: ${agent.price.credits}`),

        React.createElement(Box, {marginTop: 1},
          React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Jobs with results')
        ),
        jobs.length === 0 && React.createElement(Text, null, 'No completed jobs for this agent'),
        jobs.length > 0 && React.createElement(Box, {flexDirection: 'column', width: '100%'},
          React.createElement(SelectInput, {items: jobItems, onSelect: handleJobSelect, listen: !selectedJob, initialIndex: lastJobIndex, key: `jobs-${lastJobIndex}-${jobs.length}`})
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
          ),

          // Back action when in details
          React.createElement(Box, {marginTop: 1, flexDirection: 'column', width: '100%'},
            React.createElement(SelectInput, {
              items: [{label: 'Back to jobs', value: '__backJobs'}],
              onSelect: returnToJobsList,
              listen: true,
              initialIndex: 0,
              key: `back-${selectedJob?.id || selectedJob?.agentJobId || 'job'}`
            })
          )
        ),

        React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
          selectedJob
            ? React.createElement(Text, null, 'Tip: Press Enter/Backspace/Left/B or select "Back to jobs" to return to the jobs list')
            : React.createElement(Text, null, 'Tip: Press Esc to return to the main menu')
        )
      );
    })()
    )
  );
}


