import React, {useEffect, useMemo, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import TextInput from '../components/text-input.mjs';
import PixelLoader from '../components/pixel-loader.mjs';
import SelectInput from '../components/select-input.mjs';
import {addJobToTask, createAgentJob, fetchAgentInputSchema} from '../api/index.mjs';
import {getJobStatusLabel, getJobStatusTone} from '../utils/status.mjs';

const BRAND_HEX = '#7F00FF';
const MAX_CREDITS_FIELD_ID = '__maxCredits';

function buildInitialValues(schemaFields) {
  const initialValues = {};
  for (const field of schemaFields) {
    if (field?.type !== 'none' && field?.id) {
      initialValues[field.id] = '';
    }
  }
  return initialValues;
}

export default function HireAgentView({agent, task, onBack, onJobCreated}) {
  const [status, setStatus] = useState('idle');
  const [inputSchema, setInputSchema] = useState(null);
  const [fields, setFields] = useState([]);
  const [error, setError] = useState(null);
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [job, setJob] = useState(null);
  const [maxCredits, setMaxCredits] = useState(() => {
    const base = Number(agent?.price?.credits);
    return Number.isFinite(base) ? base : null;
  });
  const [focusedFieldId, setFocusedFieldId] = useState(null);

  useEffect(() => {
    let aborted = false;

    const load = async () => {
      if (!agent?.id) return;
      setStatus('loading');
      setError(null);
      setSubmitError(null);
      setJob(null);

      try {
        const {schema, fields: schemaFields} = await fetchAgentInputSchema(agent.id);
        if (aborted) return;

        setInputSchema(schema);
        setFields(schemaFields);
        setValues(buildInitialValues(schemaFields));
        setStatus('ready');
        setFocusedFieldId(schemaFields[0]?.id || MAX_CREDITS_FIELD_ID);
      } catch (loadError) {
        if (aborted) return;
        setError(loadError?.message || 'Failed to load input schema');
        setStatus('error');
      }
    };

    load();
    return () => {
      aborted = true;
    };
  }, [agent?.id]);

  const items = useMemo(() => (
    fields.map(field => ({
      id: field.id,
      type: field.type,
      name: field.name || field.id,
      data: field.data || {},
      validations: Array.isArray(field.validations) ? field.validations : []
    }))
  ), [fields]);

  const focusOrder = useMemo(() => {
    const fieldIds = items.map(item => item.id).filter(Boolean);
    return [...fieldIds, MAX_CREDITS_FIELD_ID];
  }, [items]);

  useInput((input, key) => {
    if (status !== 'ready' || job) return;
    if (!key.tab) return;

    if (focusOrder.length === 0) {
      setFocusedFieldId(null);
      return;
    }

    if (key.shift) {
      if (!focusedFieldId) {
        setFocusedFieldId(focusOrder[focusOrder.length - 1]);
        return;
      }

      const currentIndex = focusOrder.indexOf(focusedFieldId);
      if (currentIndex <= 0) {
        setFocusedFieldId(null);
      } else {
        setFocusedFieldId(focusOrder[currentIndex - 1]);
      }
      return;
    }

    if (!focusedFieldId) {
      setFocusedFieldId(focusOrder[0]);
      return;
    }

    const currentIndex = focusOrder.indexOf(focusedFieldId);
    if (currentIndex < 0 || currentIndex === focusOrder.length - 1) {
      setFocusedFieldId(null);
    } else {
      setFocusedFieldId(focusOrder[currentIndex + 1]);
    }
  });

  const handleSubmit = async () => {
    if (submitting || !agent?.id || !inputSchema) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      const cleanedValues = {};
      for (const [key, value] of Object.entries(values)) {
        if (value !== '' && value != null) {
          cleanedValues[key] = value;
        }
      }

      const payload = {
        inputSchema,
        inputData: cleanedValues,
        maxCredits
      };

      const result = task?.id
        ? await addJobToTask(task.id, {
            agentId: agent.id,
            ...payload
          })
        : await createAgentJob(agent.id, payload);

      setJob(result.job || null);
      setFocusedFieldId(null);
    } catch (submitFailure) {
      let message = submitFailure?.message || 'Failed to submit job';
      if (submitFailure?.body) {
        const responseBody = typeof submitFailure.body === 'string'
          ? submitFailure.body
          : JSON.stringify(submitFailure.body, null, 2);
        message += `\n\nServer response:\n${responseBody}`;
      }
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessDone = () => {
    if (onJobCreated) {
      onJobCreated(job);
      return;
    }

    onBack && onBack();
  };

  const title = task?.id ? 'Add Agent Job' : 'Hire an Agent';
  const subtitle = task?.id
    ? `Task: ${task.name || task.id}`
    : `Agent: ${agent?.name || agent?.id || 'Unknown Agent'}`;

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column'},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, title),
      React.createElement(Text, {dimColor: true}, subtitle),
      task?.id && agent && React.createElement(Text, {dimColor: true}, `Agent: ${agent.name || agent.id}`),
      status === 'loading' && React.createElement(Box, {marginTop: 1}, React.createElement(PixelLoader, {label: 'Loading form…'})),
      status === 'error' && React.createElement(Box, {marginTop: 1}, React.createElement(Text, {color: 'red'}, error || 'Error')),
      status === 'ready' && !job && React.createElement(Box, {flexDirection: 'column', marginTop: 1},
        ...items.map(field => {
          if (field.type === 'none') {
            return React.createElement(
              Box,
              {key: field.id, flexDirection: 'column', marginBottom: 1},
              React.createElement(Text, {bold: true}, field.name),
              field.data?.description && React.createElement(Text, {dimColor: true}, field.data.description),
              React.createElement(Text, {dimColor: true, italic: true}, '(no input required)')
            );
          }

          return React.createElement(
            Box,
            {key: field.id, flexDirection: 'column', marginBottom: 1},
            React.createElement(Text, {bold: true}, field.name),
            field.data?.description && React.createElement(Text, {dimColor: true}, field.data.description),
            React.createElement(TextInput, {
              value: values[field.id] || '',
              onChange: value => setValues(currentValues => ({...currentValues, [field.id]: value})),
              placeholder: field.data?.placeholder || '',
              focus: focusedFieldId === field.id
            })
          );
        }),
        React.createElement(Box, {flexDirection: 'column', marginTop: 1},
          React.createElement(Text, {bold: true}, 'Max accepted credits'),
          React.createElement(Text, {dimColor: true}, 'Leave empty to use the server default'),
          React.createElement(TextInput, {
            value: maxCredits != null ? String(maxCredits) : '',
            onChange: value => {
              if (!value || value.trim() === '') {
                setMaxCredits(null);
                return;
              }

              const parsedValue = Number(value);
              setMaxCredits(Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null);
            },
            placeholder: agent?.price?.credits != null ? String(agent.price.credits) : 'e.g. 5',
            focus: focusedFieldId === MAX_CREDITS_FIELD_ID
          })
        ),
        React.createElement(Box, {marginTop: 1},
          React.createElement(SelectInput, {
            items: [
              {label: submitting ? 'Submitting…' : (task?.id ? 'Add Job to Task' : 'Hire Agent'), value: '__submit'},
              {label: 'Back', value: '__back'}
            ],
            listen: !focusedFieldId,
            onSelect: item => {
              if (item.value === '__back') {
                onBack && onBack();
                return;
              }

              if (item.value === '__submit') {
                handleSubmit();
              }
            }
          })
        ),
        submitError && React.createElement(Box, {marginTop: 1},
          React.createElement(Text, {color: 'red'}, submitError)
        )
      ),
      job && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(Text, {color: 'green', bold: true}, task?.id ? '✓ Job added to task' : '✓ Job created'),
        React.createElement(Text, {bold: true}, job.name || job.id || 'Job'),
        React.createElement(Text, {color: getJobStatusTone(job.status)}, getJobStatusLabel(job.status)),
        job.result && React.createElement(Text, {dimColor: true, wrap: 'truncate-end'}, job.result),
        React.createElement(Box, {marginTop: 1},
          React.createElement(SelectInput, {
            items: [{label: task?.id ? 'Back to Task' : 'Done', value: '__done'}],
            onSelect: handleSuccessDone
          })
        )
      ),
      React.createElement(Box, {marginTop: 1},
        React.createElement(Text, {dimColor: true}, 'Press Tab to move between fields, then Tab again to reach the actions. Press Esc to go back.')
      )
    )
  );
}
