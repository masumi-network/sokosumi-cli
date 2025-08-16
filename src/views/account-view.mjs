import React, {useEffect, useMemo, useState} from 'react';
import {Box, Text} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import SelectInput from '../components/select-input.mjs';
import PixelLoader from '../components/pixel-loader.mjs';
import {fetchCurrentUser} from '../api/index.mjs';

const BRAND_HEX = '#7F00FF';

export default function AccountView({onBack}) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    setStatus('loading');
    setError(null);
    try {
      const {user: me} = await fetchCurrentUser();
      setUser(me);
      setStatus('ready');
    } catch (e) {
      setError(e?.message || 'Failed to load account');
      setStatus('error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const items = useMemo(() => ([
    {label: 'Refresh', value: 'refresh'},
    {label: 'Back', value: 'back'}
  ]), []);

  const handleSelect = item => {
    if (item.value === 'refresh') return load();
    if (item.value === 'back') return onBack && onBack();
  };

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column'},
      React.createElement(Text, {color: BRAND_HEX, bold: true}, 'My Account'),
      status === 'loading' && React.createElement(PixelLoader),
      status === 'error' && React.createElement(Text, {color: 'red'}, error || 'Error'),
      status === 'ready' && user && React.createElement(Box, {flexDirection: 'column', marginTop: 1},
        React.createElement(Text, null, `Name: ${user.name ?? ''}`),
        React.createElement(Text, null, `Email: ${user.email ?? ''}`),
        React.createElement(Text, null, `Terms accepted: ${user.termsAccepted ? 'yes' : 'no'}`),
        React.createElement(Text, null, `Marketing opt-in: ${user.marketingOptIn ? 'yes' : 'no'}`),
        user.stripeCustomerId && React.createElement(Text, null, `Stripe customer: ${user.stripeCustomerId}`),
        user.id && React.createElement(Text, {dimColor: true}, `ID: ${user.id}`),
        user.createdAt && React.createElement(Text, {dimColor: true}, `Created: ${user.createdAt.toISOString()}`),
        user.updatedAt && React.createElement(Text, {dimColor: true}, `Updated: ${user.updatedAt.toISOString()}`)
      ),
      React.createElement(Box, {marginTop: 1},
        React.createElement(SelectInput, {items, onSelect: handleSelect})
      ),
      React.createElement(Box, {marginTop: 1},
        React.createElement(Text, null, 'Tip: Press Esc to return to the main menu')
      )
    )
  );
}


