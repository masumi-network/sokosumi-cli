import React from 'react';
import {Box, Text, useInput} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import SelectInput from '../components/select-input.mjs';

const BRAND_HEX = '#7F00FF';

export default function CoworkerDetailsView({coworker, onBack, onCreateTask}) {
  useInput((input, key) => {
    if (key.escape) {
      onBack && onBack();
    }
  });

  if (!coworker) {
    return React.createElement(
      ScreenContainer,
      null,
      React.createElement(Text, {color: 'red'}, 'Coworker not found'),
      React.createElement(Box, {marginTop: 1},
        React.createElement(Text, null, 'Press Esc to go back')
      )
    );
  }

  const capabilities = (coworker.capabilities || []).filter(Boolean);
  const credits = coworker?.price?.credits;

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column'},
      React.createElement(Text, {color: BRAND_HEX, bold: true, fontSize: 18}, coworker.name || 'Unnamed Coworker'),
      React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(Text, {bold: true}, 'Description:'),
        React.createElement(Text, null, coworker.description || 'No description available')
      ),
      capabilities.length > 0 && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(Text, {bold: true}, 'Capabilities:'),
        ...capabilities.map((cap, idx) =>
          React.createElement(Text, {key: idx}, `  • ${cap}`)
        )
      ),
      React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(Text, {bold: true}, 'Pricing:'),
        React.createElement(Text, null, credits != null ? `${credits} credits per task` : 'Pricing not available')
      ),
      coworker.estimatedDuration && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(Text, {bold: true}, 'Estimated Duration:'),
        React.createElement(Text, null, coworker.estimatedDuration)
      ),
      React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(Text, {bold: true}, 'Status:'),
        React.createElement(Text, {color: coworker.status === 'active' ? 'green' : 'yellow'}, coworker.status || 'unknown')
      ),
      React.createElement(Box, {marginTop: 2},
        React.createElement(SelectInput, {
          items: [
            {label: 'Create Task', value: '__create'},
            {label: 'Back', value: '__back'}
          ],
          onSelect: item => {
            if (item.value === '__create') return onCreateTask && onCreateTask(coworker);
            return onBack && onBack();
          }
        })
      ),
      React.createElement(Box, {marginTop: 1},
        React.createElement(Text, {dimColor: true}, 'Press Esc to go back')
      )
    )
  );
}
