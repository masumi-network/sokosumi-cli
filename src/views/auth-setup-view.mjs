import React, {useMemo, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import SelectInput from '../components/select-input.mjs';
import TextInput from '../components/text-input.mjs';
import {getCliConfigPath, writeApiKeyToEnv} from '../utils/env.mjs';
import {getAuthManager} from '../auth/auth-manager.mjs';
import {
  getConnectionsUrl,
  getOAuthClientsUrl,
  requestMagicLinkSignIn,
  resolveApiKeyEnvironment
} from '../auth/magic-link.mjs';

const BRAND_HEX = '#7F00FF';

function AuthStepTitle({children}) {
  return React.createElement(Text, {color: BRAND_HEX, bold: true}, children);
}

export default function AuthSetupView({onDone, onBack}) {
  const [step, setStep] = useState('options');
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const connectionsUrl = useMemo(() => getConnectionsUrl(), []);
  const oauthClientsUrl = useMemo(() => getOAuthClientsUrl(), []);
  const configPath = useMemo(() => getCliConfigPath(), []);

  const optionItems = useMemo(() => ([
    {label: 'Email me a sign-in link', value: 'magic-link'},
    {label: 'Paste an API key', value: 'api-key'},
  ]), []);

  const resetToOptions = () => {
    setBusy(false);
    setError(null);
    setStep('options');
  };

  const handleMagicLinkSubmit = async () => {
    const nextEmail = String(email || '').trim();
    if (!nextEmail) {
      setError('Enter the email address you use for Sokosumi');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await requestMagicLinkSignIn(nextEmail, {callbackUrl: connectionsUrl});
      setNotice(
        `We sent a sign-in link to ${nextEmail}. After you finish in the browser, create an API key on the Connections page and paste it below.`
      );
      setApiKey('');
      setStep('api-key');
    } catch (submitError) {
      setError(submitError?.message || 'Failed to send sign-in link');
    } finally {
      setBusy(false);
    }
  };

  const handleApiKeySubmit = async () => {
    const nextApiKey = String(apiKey || '').trim();
    if (!nextApiKey) {
      setError('Paste a Sokosumi API key to continue');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const resolvedEnvironment = await resolveApiKeyEnvironment(nextApiKey);
      await writeApiKeyToEnv(nextApiKey, {
        apiUrl: resolvedEnvironment.apiBaseUrl,
        webUrl: resolvedEnvironment.webBaseUrl,
        authUrl: resolvedEnvironment.authBaseUrl,
      });
      getAuthManager().logout();
      onDone && onDone(nextApiKey);
    } catch (submitError) {
      setError(submitError?.message || 'Failed to verify API key');
    } finally {
      setBusy(false);
    }
  };

  useInput((input, key) => {
    if (!key.escape || busy) return;

    if (step !== 'options') {
      resetToOptions();
      return;
    }

    if (onBack) {
      onBack();
    }
  });

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column'},
      React.createElement(AuthStepTitle, null, 'Sign in to Sokosumi CLI'),
      React.createElement(Text, null, 'Choose how you want to connect this CLI to your Sokosumi account.'),
      step === 'options' && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(SelectInput, {
          items: optionItems,
          onSelect: (item) => {
            setError(null);
            if (item.value === 'magic-link') {
              setStep('magic-link');
              return;
            }
            setStep('api-key');
          }
        }),
        React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
          React.createElement(Text, {dimColor: true}, 'Magic link: email sign-in, then land on the browser Connections page to create an API key.'),
          React.createElement(Text, {dimColor: true}, 'API key: paste an existing key if you already have one.'),
          onBack && React.createElement(Text, {dimColor: true}, 'Press Esc to go back.')
        )
      ),
      step === 'magic-link' && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(AuthStepTitle, null, 'Email Sign-In Link'),
        React.createElement(Text, null, 'We will send a sign-in email and route you to your Sokosumi Connections page after login.'),
        React.createElement(Text, null, 'If you do not have an account yet, the browser flow will let you register first.'),
        React.createElement(Box, {marginTop: 1},
          React.createElement(Text, {color: BRAND_HEX}, '› '),
          busy
            ? React.createElement(Text, null, 'sending sign-in link...')
            : React.createElement(TextInput, {
                value: email,
                onChange: setEmail,
                placeholder: 'you@example.com',
                onSubmit: handleMagicLinkSubmit,
                focus: true
              })
        ),
        React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
          React.createElement(Text, {dimColor: true}, `Connections URL: ${connectionsUrl}`),
          React.createElement(Text, {dimColor: true}, 'Press Esc to choose another sign-in option.')
        )
      ),
      step === 'api-key' && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(AuthStepTitle, null, 'Paste Sokosumi API Key'),
        notice && React.createElement(Text, {color: 'green'}, notice),
        React.createElement(Text, null, 'Paste an existing key, or create one in the browser and come back here.'),
        React.createElement(Text, {dimColor: true}, 'The CLI detects preprod or production automatically from the API key.'),
        React.createElement(Box, {marginTop: 1},
          React.createElement(Text, {color: BRAND_HEX}, '› '),
          busy
            ? React.createElement(Text, null, 'detecting environment and verifying API key...')
            : React.createElement(TextInput, {
                value: apiKey,
                onChange: setApiKey,
                placeholder: 'soko_... or coworker_...',
                onSubmit: handleApiKeySubmit,
                focus: true
              })
        ),
        React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
          React.createElement(Text, {dimColor: true}, `API key setup: ${connectionsUrl}`),
          React.createElement(Text, {dimColor: true}, `OAuth clients for future app-to-app auth: ${oauthClientsUrl}`),
          React.createElement(Text, {dimColor: true}, `Stored locally in: ${configPath}`),
          React.createElement(Text, {dimColor: true}, 'Press Esc to choose another sign-in option.')
        )
      ),
      error && React.createElement(Box, {marginTop: 1},
        React.createElement(Text, {color: 'red'}, error)
      )
    )
  );
}
