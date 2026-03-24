import React, {useState} from 'react';
import {Box, Text} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import TextInput from '../components/text-input.mjs';
import SelectInput from '../components/select-input.mjs';
import PixelLoader from '../components/pixel-loader.mjs';
import {createTask} from '../api/index.mjs';
import {getTaskStatusLabel} from '../utils/status.mjs';

const BRAND_HEX = '#7F00FF';

export default function CreateTaskView({coworker, onBack, onTaskCreated}) {
  const [step, setStep] = useState('name'); // name | description | creating | success | error
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [createdTask, setCreatedTask] = useState(null);

  const handleNameSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Task name is required');
      return;
    }
    if (trimmed.length > 120) {
      setError('Task name must be 120 characters or less');
      return;
    }
    setError(null);
    setStep('description');
  };

  const handleDescriptionSubmit = async () => {
    setStep('creating');
    setError(null);

    try {
      const {task} = await createTask({
        name: name.trim(),
        description: description.trim() || undefined,
        coworkerId: coworker?.id || undefined,
        status: 'READY' // Set to READY so it starts immediately, not DRAFT
      });
      setCreatedTask(task);
      setStep('success');
    } catch (e) {
      setError(e?.message || 'Failed to create task');
      setStep('error');
    }
  };

  const handleDone = () => {
    if (onTaskCreated && createdTask) {
      onTaskCreated(createdTask);
    } else if (onBack) {
      onBack();
    }
  };

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column', width: '100%'},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Create Task'),
      coworker && React.createElement(Text, null, `Coworker: ${coworker.name || 'Unknown'}`),

      // Step 1: Enter task name
      step === 'name' && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(Text, {bold: true}, 'Task Name (required, max 120 chars)'),
        React.createElement(Text, {dimColor: true}, 'Keep it short - you can add full details in the next step'),
        React.createElement(Box, {marginTop: 1},
          React.createElement(Text, {color: BRAND_HEX}, '› '),
          React.createElement(TextInput, {
            value: name,
            onChange: setName,
            onSubmit: handleNameSubmit,
            placeholder: 'e.g., "Sokosumi CLI Discoverability Research"',
            focus: true
          })
        ),
        error && React.createElement(Text, {color: 'red', marginTop: 1}, error),
        React.createElement(Text, {
          color: name.length > 120 ? 'red' : 'dimColor',
          marginTop: 1
        }, `${name.length}/120 characters`),
        React.createElement(Text, {dimColor: true, marginTop: 1}, 'Press Enter to continue, Esc to cancel')
      ),

      // Step 2: Enter description (optional)
      step === 'description' && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(Text, {bold: true}, 'Task Description (optional, no limit)'),
        React.createElement(Text, {dimColor: true}, 'Add full details, requirements, context, etc.'),
        React.createElement(Text, {dimColor: true}, 'New tasks are created as READY so they appear in Todo immediately'),
        React.createElement(Box, {marginTop: 1},
          React.createElement(Text, {color: BRAND_HEX}, '› '),
          React.createElement(TextInput, {
            value: description,
            onChange: setDescription,
            onSubmit: handleDescriptionSubmit,
            placeholder: 'Full task details go here...',
            focus: true
          })
        ),
        React.createElement(Text, {dimColor: true, marginTop: 1}, `${description.length} characters`),
        React.createElement(Text, {dimColor: true, marginTop: 1}, 'Press Enter to create task, Esc to go back')
      ),

      // Creating...
      step === 'creating' && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(PixelLoader, {label: 'Creating task…'})
      ),

      // Success
      step === 'success' && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(Text, {color: 'green', bold: true}, '✓ Task created successfully!'),
        createdTask && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
          React.createElement(Text, {bold: true}, createdTask.name || 'Task'),
          createdTask.description && React.createElement(Text, {dimColor: true}, createdTask.description),
          React.createElement(Text, {dimColor: true}, `Status: ${getTaskStatusLabel(createdTask.status || 'READY')}`)
        ),
        React.createElement(Box, {marginTop: 2},
          React.createElement(SelectInput, {
            items: [{label: 'Done', value: 'done'}],
            onSelect: handleDone,
            listen: true
          })
        )
      ),

      // Error
      step === 'error' && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(Text, {color: 'red', bold: true}, '✗ Failed to create task'),
        error && React.createElement(Text, {color: 'red'}, error),
        React.createElement(Box, {marginTop: 2},
          React.createElement(SelectInput, {
            items: [{label: 'Back', value: 'back'}],
            onSelect: onBack,
            listen: true
          })
        )
      )
    )
  );
}
