import React, {useEffect, useMemo, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import TextInput from '../components/text-input.mjs';
import PixelLoader from '../components/pixel-loader.mjs';
import {fetchAgentInputSchema} from '../api/index.mjs';
import SelectInput from '../components/select-input.mjs';
import {createAgentJob} from '../api/index.mjs';

const BRAND_HEX = '#7F00FF';

export default function HireAgentView({agent, onBack}) {
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [fields, setFields] = useState([]);
  const [error, setError] = useState(null);
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [job, setJob] = useState(null);
  const [maxAcceptedCredits, setMaxAcceptedCredits] = useState(() => {
    const base = Number(agent?.price?.credits);
    if (Number.isFinite(base)) return base;
    return null;
  });
  const [focusedFieldId, setFocusedFieldId] = useState(null);

  useEffect(() => {
    let aborted = false;
    const load = async () => {
      if (!agent?.id) return;
      setStatus('loading');
      setError(null);
      try {
        const {fields: schemaFields} = await fetchAgentInputSchema(agent.id);
        if (aborted) return;
        setFields(schemaFields);
        // initialize values
        const initial = {};
        for (const f of schemaFields) initial[f.id] = '';
        setValues(initial);
        setStatus('ready');
        setFocusedFieldId(schemaFields[0]?.id || null);
      } catch (e) {
        if (aborted) return;
        setError(e?.message || 'Failed to load input schema');
        setStatus('error');
      }
    };
    load();
    return () => { aborted = true; };
  }, [agent?.id]);

  const items = useMemo(() => {
    return fields.map(f => ({
      id: f.id,
      type: f.type,
      name: f.name || f.id,
      data: f.data || {},
      validations: Array.isArray(f.validations) ? f.validations : [],
    }));
  }, [fields]);

  useInput((input, key) => {
    if (status !== 'ready') return;
    if (key.tab) {
      // Toggle focus between first field and actions
      setFocusedFieldId(prev => (prev ? null : (items[0]?.id || null)));
    }
  });

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column'},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Hire an Agent'),
      agent && React.createElement(Text, {dimColor: true}, `Agent: ${agent.name || agent.id}`),
      status === 'loading' && React.createElement(Box, {marginTop: 1}, React.createElement(PixelLoader, {label: 'Loading form…'})),
      status === 'error' && React.createElement(Box, {marginTop: 1}, React.createElement(Text, {color: 'red'}, error || 'Error')),
      status === 'ready' && React.createElement(Box, {flexDirection: 'column', marginTop: 1},
        ...items.map(field => (
          React.createElement(Box, {key: field.id, flexDirection: 'column', marginBottom: 1},
            React.createElement(Text, {bold: true}, field.name),
            field.type === 'textarea'
              ? React.createElement(TextInput, {
                  value: values[field.id] || '',
                  onChange: (val) => setValues(v => ({...v, [field.id]: val})),
                  placeholder: field.data?.placeholder || '',
                  focus: focusedFieldId === field.id
                })
              : React.createElement(Text, {dimColor: true}, 'Unsupported field type')
          )
        )),
        React.createElement(Box, {flexDirection: 'column', marginTop: 1},
          React.createElement(Text, {bold: true}, 'Max accepted credits'),
          React.createElement(TextInput, {
            value: maxAcceptedCredits != null ? String(maxAcceptedCredits) : '',
            onChange: (val) => {
              const n = Number(val);
              setMaxAcceptedCredits(Number.isFinite(n) ? n : null);
            },
            placeholder: agent?.price?.credits != null ? String(agent.price.credits) : 'e.g., 2.5',
            focus: false
          })
        ),
        React.createElement(Box, {marginTop: 1},
          React.createElement(SelectInput, {
            items: [
              {label: submitting ? 'Hiring…' : 'Hire Agent', value: '__submit'},
              {label: 'Back', value: '__back'}
            ],
            listen: !focusedFieldId,
            onSelect: async (item) => {
              if (item.value === '__back') return onBack && onBack();
              if (item.value === '__submit') {
                if (submitting || !agent?.id) return;
                setSubmitError(null);
                setSubmitting(true);
                try {
                  const payload = {inputData: values, maxAcceptedCredits};
                  const {job: created} = await createAgentJob(agent.id, payload);
                  setJob(created || null);
                } catch (e) {
                  setSubmitError(e?.message || 'Failed to hire agent');
                } finally {
                  setSubmitting(false);
                }
              }
            }
          })
        ),
        job && React.createElement(Box, {marginTop: 1},
          React.createElement(Text, {color: BRAND_HEX}, `Job created: ${job.id || ''}`)
        ),
        submitError && React.createElement(Box, {marginTop: 1},
          React.createElement(Text, {color: 'red'}, submitError)
        )
      ),
      React.createElement(Box, {marginTop: 1},
        React.createElement(Text, null, 'Tip: Press Esc to return')
      )
    )
  );
}



