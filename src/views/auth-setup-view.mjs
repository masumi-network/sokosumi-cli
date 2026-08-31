import React, {useMemo, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import ScreenContainer from '../components/screen-container.mjs';
import SelectInput from '../components/select-input.mjs';
import TextInput from '../components/text-input.mjs';
import {
  getAuthBaseUrlFromEnv,
  getCliConfigPath,
  writeApiKeyToEnv
} from '../utils/env.mjs';
import {getAuthManager} from '../auth/auth-manager.mjs';
import {loginWithBrowser} from '../auth/oauth.mjs';
import {
  getConnectionsUrl,
  getOAuthClientsUrl,
  resolveApiKeyEnvironment
} from '../auth/magic-link.mjs';

const BRAND_HEX = '#7F00FF';

function AuthStepTitle({children}) {
  return React.createElement(Text, {color: BRAND_HEX, bold: true}, children);
}

export default function AuthSetupView({onDone, onBack}) {
  const [step, setStep] = useState('options');
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const connectionsUrl = useMemo(() => getConnectionsUrl(), []);
  const oauthClientsUrl = useMemo(() => getOAuthClientsUrl(), []);
  const configPath = useMemo(() => getCliConfigPath(), []);
  const authBaseUrl = useMemo(() => getAuthBaseUrlFromEnv(), []);
  const clientId = useMemo(
    () => String(process.env.SOKOSUMI_OAUTH_CLIENT_ID || '').trim(),
    [],
  );

  const optionItems = useMemo(() => ([
    {label: 'Approve sign-in in browser', value: 'browser-oauth'},
    {label: 'Paste an API key', value: 'api-key'},
  ]), []);

  const resetToOptions = () => {
    setBusy(false);
    setError(null);
    setStep('options');
  };

  const handleBrowserLogin = async () => {
    setError(null);
    if (!clientId) {
      setError(`Set SOKOSUMI_OAUTH_CLIENT_ID first. Create a client at ${oauthClientsUrl}.`);
      return;
    }

    setBusy(true);
    try {
      const credentials = await loginWithBrowser({
        authBaseUrl,
        clientId,
        clientSecret: process.env.SOKOSUMI_OAUTH_CLIENT_SECRET,
      });
      getAuthManager().saveCredentials(credentials);
      onDone && onDone(credentials.authToken);
    } catch (submitError) {
      setError(submitError?.message || 'Browser sign-in failed');
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

    if (onBack) onBack();
  });

  return React.createElement(
    ScreenContainer,
    null,
    React.createElement(Box, {flexDirection: 'column'},
      React.createElement(AuthStepTitle, null, 'Sign in to Sokosumi CLI'),
      React.createElement(Text, null, 'Choose browser approval for a user session, or use an API key for headless work.'),
      step === 'options' && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(SelectInput, {
          items: optionItems,
          onSelect: (item) => {
            setError(null);
            if (item.value === 'browser-oauth') {
              setStep('browser-oauth');
              void handleBrowserLogin();
              return;
            }
            setStep('api-key');
          }
        }),
        React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
          React.createElement(Text, {dimColor: true}, 'Browser approval keeps OAuth tokens in the OS keychain.'),
          React.createElement(Text, {dimColor: true}, 'API keys remain available for headless commands.'),
          onBack && React.createElement(Text, {dimColor: true}, 'Press Esc to go back.')
        )
      ),
      step === 'browser-oauth' && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(AuthStepTitle, null, 'Browser Sign-In'),
        React.createElement(Text, null, busy ? 'Approve access in the browser window.' : 'Select this option again to retry.'),
        React.createElement(Text, {dimColor: true}, `OAuth issuer: ${authBaseUrl}`),
        React.createElement(Text, {dimColor: true}, clientId ? `Client: ${clientId}` : `Create a client at: ${oauthClientsUrl}`),
        React.createElement(Text, {dimColor: true}, 'Press Esc to choose another sign-in option.')
      ),
      step === 'api-key' && React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        React.createElement(AuthStepTitle, null, 'Paste Sokosumi API Key'),
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
