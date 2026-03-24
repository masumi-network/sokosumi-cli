import React, {useEffect, useMemo, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import SelectInput from '../components/select-input.mjs';
import PixelLoader from '../components/pixel-loader.mjs';
import {fetchJobs, fetchJobFiles, fetchJobLinks} from '../api/index.mjs';
import {getJobStatusLabel, getJobStatusTone, isJobActive} from '../utils/status.mjs';

const BRAND_HEX = '#7F00FF';

export default function HiredAgentsView({onBack}) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobFiles, setJobFiles] = useState([]);
  const [jobLinks, setJobLinks] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    let aborted = false;
    async function load() {
      setStatus('loading');
      setError(null);
      try {
        const {jobs: fetchedJobs} = await fetchJobs();
        if (aborted) return;
        setJobs(fetchedJobs || []);
        setStatus('ready');
      } catch (e) {
        if (aborted) return;
        setError(e?.message || 'Failed to load jobs');
        setStatus('error');
      }
    }
    load();
    return () => { aborted = true; };
  }, []);

  const renderDate = (value) => {
    if (!value) return '-';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  };

  const JobRow = ({job}) => {
    return React.createElement(
      Box,
      {flexDirection: 'row', justifyContent: 'space-between', width: '100%'},
      React.createElement(Box, {flexDirection: 'column', flexGrow: 1, flexShrink: 1},
        React.createElement(Text, {bold: true, wrap: 'truncate'}, job.name || job.id || 'Job'),
        React.createElement(Text, {dimColor: true, wrap: 'truncate'}, `Created: ${renderDate(job.createdAt)}`)
      ),
      React.createElement(Box, {marginLeft: 2, flexDirection: 'column', flexGrow: 0, flexShrink: 0, alignItems: 'flex-end'},
        React.createElement(Text, {color: getJobStatusTone(job.status)}, getJobStatusLabel(job.status)),
        job.credits != null && React.createElement(Text, {dimColor: true}, `${job.credits} cr`)
      )
    );
  };

  const jobItems = useMemo(() => jobs.map(j => ({
    label: j.name || j.id || 'Job',
    value: j.id,
    job: j,
    render: () => React.createElement(JobRow, {job: j})
  })), [jobs]);

  const handleJobSelect = async (item) => {
    if (item.value === '__back') return onBack && onBack();
    const job = item?.job || jobs.find(j => j.id === item?.value);
    setSelectedJob(job || null);

    // Fetch files and links for this job
    if (job?.id) {
      setLoadingDetails(true);
      try {
        const [{files}, {links}] = await Promise.all([
          fetchJobFiles(job.id),
          fetchJobLinks(job.id)
        ]);
        setJobFiles(files || []);
        setJobLinks(links || []);
      } catch (e) {
        // Silently fail - some jobs may not have files/links
        setJobFiles([]);
        setJobLinks([]);
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  const returnToJobsList = () => {
    setSelectedJob(null);
    setJobFiles([]);
    setJobLinks([]);
  };

  useInput((input, key) => {
    if (key.escape && selectedJob) {
      returnToJobsList();
    }
  }, {isActive: Boolean(selectedJob)});

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

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column', width: '100%'},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, 'My Jobs'),
      React.createElement(Text, null, 'View all your hired agent jobs and their results'),

      // Jobs list
      !selectedJob && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        status === 'loading' && React.createElement(PixelLoader, {label: 'Loading jobs…'}),
        status === 'error' && React.createElement(Text, {color: 'red'}, error || 'Error'),
        status === 'ready' && jobItems.length === 0 && React.createElement(Text, null, 'No jobs yet. Hire an agent from the Agents Gallery to get started!'),
        status === 'ready' && jobItems.length > 0 && React.createElement(SelectInput, {
          items: [...jobItems, {label: 'Back to Main Menu', value: '__back'}],
          onSelect: handleJobSelect
        })
      ),

      // Selected job details
      selectedJob && React.createElement(Box, {marginTop: 1, flexDirection: 'column', width: '100%'},
        React.createElement(Text, {color: BRAND_HEX, bold: true}, selectedJob.name || selectedJob.id || 'Job Details'),
        React.createElement(Text, {dimColor: true}, `Status: ${getJobStatusLabel(selectedJob.status)}`),
        React.createElement(Text, {dimColor: true}, `Created: ${renderDate(selectedJob.createdAt)}`),
        selectedJob.completedAt && React.createElement(Text, {dimColor: true}, `Completed: ${renderDate(selectedJob.completedAt)}`),
        selectedJob.credits != null && React.createElement(Text, {dimColor: true}, `Credits: ${selectedJob.credits}`),

        // Result
        (selectedJob.result || selectedJob.output) && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
          React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Result'),
          renderMarkdown(selectedJob.result || selectedJob.output)
        ),

        // Files (images, PDFs, etc.)
        loadingDetails && React.createElement(Box, {marginTop: 1},
          React.createElement(PixelLoader, {label: 'Loading files and links…'})
        ),
        !loadingDetails && jobFiles.length > 0 && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
          React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Files'),
          ...jobFiles.map((file, idx) => {
            const sizeKB = file.size ? Math.round(file.size / 1024) : null;
            const sizeDisplay = sizeKB ? `${sizeKB} KB` : '';
            return React.createElement(Box, {key: file.id || idx, flexDirection: 'column', marginTop: 1, borderStyle: 'single', borderColor: 'gray', paddingX: 1},
              React.createElement(Text, {bold: true}, file.name || 'Untitled'),
              file.mimeType && React.createElement(Text, {dimColor: true}, `Type: ${file.mimeType}${sizeDisplay ? ` • Size: ${sizeDisplay}` : ''}`),
              file.url && React.createElement(Text, {color: 'cyan', wrap: 'truncate'}, `URL: ${file.url}`),
              !file.url && React.createElement(Text, {dimColor: true}, 'No download URL available'),
              React.createElement(Text, {dimColor: true, italic: true}, 'Tip: Copy URL to view/download file')
            );
          })
        ),

        // Links
        !loadingDetails && jobLinks.length > 0 && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
          React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Links'),
          ...jobLinks.map((link, idx) =>
            React.createElement(Box, {key: link.id || idx, flexDirection: 'column', marginTop: 1, borderStyle: 'single', borderColor: 'gray', paddingX: 1},
              React.createElement(Text, {bold: true}, link.title || 'Link'),
              link.description && React.createElement(Text, {dimColor: true}, link.description),
              link.url && React.createElement(Text, {color: 'cyan', wrap: 'truncate'}, link.url),
              React.createElement(Text, {dimColor: true, italic: true}, 'Tip: Copy URL to open in browser')
            )
          )
        ),

        // No result message
        !(selectedJob.result || selectedJob.output) && !loadingDetails && jobFiles.length === 0 && jobLinks.length === 0 && React.createElement(Box, {marginTop: 1},
          React.createElement(Text, {dimColor: true}, isJobActive(selectedJob.status) ? 'Job is still running...' : 'No result yet')
        ),

        // Back button
        React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
          React.createElement(SelectInput, {
            items: [{label: 'Back to Jobs List', value: '__backJobs'}],
            onSelect: returnToJobsList,
            listen: true
          })
        ),

        React.createElement(Box, {marginTop: 1},
          React.createElement(Text, {dimColor: true}, 'Tip: Press Esc to return to jobs list')
        )
      )
    )
  );
}
