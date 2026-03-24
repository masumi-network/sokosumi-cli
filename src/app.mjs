import React, {useEffect, useState, useMemo} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import SelectInput from './components/select-input.mjs';
import TextInput from './components/text-input.mjs';
import {loadEnvFromLocalFile, getApiKeyFromEnv} from './utils/env.mjs';
import {interpretUserRequest} from './utils/nl.mjs';
import AnimatedLogo from './components/animated-logo.mjs';
import PixelLoader from './components/pixel-loader.mjs';
import ClearScreen from './components/clear-screen.mjs';
import AccountView from './views/account-view.mjs';
import {fetchCurrentUser} from './api/index.mjs';
import AgentsView from './views/agents-view.mjs';
import AgentDetailsView from './views/agent-details-view.mjs';
import HiredAgentsView from './views/hired-agents-view.mjs';
import HireAgentView from './views/hire-agent-view.mjs';
import CoworkersView from './views/coworkers-view.mjs';
import CoworkerDetailsView from './views/coworker-details-view.mjs';
import TasksView from './views/tasks-view.mjs';
import CreateTaskView from './views/create-task-view.mjs';
import DashboardView from './views/dashboard-view.mjs';
import TaskDetailsView from './views/task-details-view.mjs';
import AuthSetupView from './views/auth-setup-view.mjs';
import {getAuthManager} from './auth/auth-manager.mjs';

const BRAND_HEX = '#7F00FF'; // RGB(127,0,255)

function MainMenu() {
  const {exit} = useApp();
  const [mode, setMode] = useState('menu'); // 'menu' | 'nl' | 'routing' | 'placeholder' | 'account' | 'agents' | 'agent' | 'jobs' | 'hire' | 'coworkers' | 'coworker' | 'tasks' | 'task' | 'taskAgents' | 'taskHire' | 'createTask' | 'dashboard' | 'auth'
  const [nl, setNl] = useState('');
  const [section, setSection] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [asked, setAsked] = useState('');
  const [userStatus, setUserStatus] = useState('loading'); // loading | ready | error
  const [user, setUser] = useState(null);
  const [userError, setUserError] = useState(null);
  const [userLoadNonce, setUserLoadNonce] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedCoworker, setSelectedCoworker] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskReturnMode, setTaskReturnMode] = useState('dashboard');

  const items = useMemo(() => ([
    {label: '📊 Dashboard (Live Tasks)', value: 'dashboard'},
    {label: 'My Tasks', value: 'tasks'},
    {label: 'My Account', value: 'account'},
    {label: 'Agents Gallery', value: 'agents'},
    {label: 'Coworkers (Multi-Agent)', value: 'coworkers'},
    {label: 'My Jobs', value: 'jobs'},
    {label: 'Authentication', value: 'auth'},
    {label: 'Quit', value: 'quit'}
  ]), []);

  const handleSelect = item => {
    if (item.value === 'quit') {
      exit();
      return;
    }
    setNl('');
    setRouteInfo(null);
    setAsked('');
    setSection(item.value);
    if (item.value === 'dashboard') return setMode('dashboard');
    if (item.value === 'tasks') return setMode('tasks');
    if (item.value === 'account') return setMode('account');
    if (item.value === 'agents') return setMode('agents');
    if (item.value === 'coworkers') return setMode('coworkers');
    if (item.value === 'auth') return setMode('auth');
    if (item.value === 'jobs') return setMode('jobs');
    setMode('placeholder');
  };

  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'auth') {
        return;
      }
      if (mode === 'agent') {
        setMode('agents');
        return;
      }
      if (mode === 'hire') {
        setMode('agents');
        return;
      }
      if (mode === 'coworker') {
        setMode('coworkers');
        return;
      }
      if (mode === 'createTask') {
        setMode('coworkers');
        return;
      }
      if (mode === 'task') {
        setMode(taskReturnMode);
        return;
      }
      if (mode === 'taskAgents') {
        setMode('task');
        return;
      }
      if (mode === 'taskHire') {
        setMode('taskAgents');
        return;
      }
      if (mode === 'jobs' || mode === 'tasks') {
        setMode('menu');
        return;
      }
      setMode('menu');
      setSection(null);
      setNl('');
      setRouteInfo(null);
      setAsked('');
      return;
    }
    if (mode === 'menu') {
      if (key.upArrow || key.downArrow || key.leftArrow || key.rightArrow || key.tab || key.return) return;
      const next = nl + input;
      setNl(next);
      setMode('nl');
    }
  });

  useEffect(() => {
    let aborted = false;
    setUserStatus('loading');
    setUserError(null);
    (async () => {
      try {
        const {user: me} = await fetchCurrentUser();
        if (aborted) return;
        setUser(me);
        setUserStatus('ready');
      } catch (e) {
        if (aborted) return;
        setUser(null);
        setUserError(e?.message || 'Failed to load user');
        setUserStatus('error');
      }
    })();
    return () => {
      aborted = true;
    };
  }, [userLoadNonce]);

  const renderAsciiTitle = (text) => {
    const glyphs = {
      'S': [
        '░██████╗░',
        '██╔════╝',
        '╚█████╗░',
        '░╚═══██╗',
        '██████╔╝',
        '╚═════╝░'
      ],
      'O': [
        '█████╗░',
        '██╔══██╗',
        '██║░░██║',
        '██║░░██║',
        '╚█████╔╝',
        '░╚════╝░'
      ],
      'K': [
        '██╗░░██╗',
        '██║░██╔╝',
        '█████═╝░',
        '██╔═██╗░',
        '██║░╚██╗',
        '╚═╝░░╚═╝'
      ],
      'U': [
        '██╗░░░██╗',
        '██║░░░██║',
        '██║░░░██║',
        '██║░░░██║',
        '╚██████╔╝',
        '░╚═════╝░'
      ],
      'M': [
        '███╗░░░███╗',
        '████╗░████║',
        '██╔████╔██║',
        '██║╚██╔╝██║',
        '██║░╚═╝░██║',
        '╚═╝░░░░░╚═╝'
      ],
      'I': [
        '██╗',
        '██║',
        '██║',
        '██║',
        '██║',
        '╚═╝'
      ],
      'C': [
        '░█████╗░',
        '██╔══██╗',
        '██║░░╚═╝',
        '██║░░██╗',
        '╚█████╔╝',
        '░╚════╝░'
      ],
      'L': [
        '██╗░░░░░',
        '██║░░░░░',
        '██║░░░░░',
        '██║░░░░░',
        '███████╗',
        '╚══════╝'
      ],
      ' ': [
        '░░',
        '░░',
        '░░',
        '░░',
        '░░',
        '░░'
      ]
    };

    const upper = String(text || '').toUpperCase();
    const height = 6;
    const rows = Array.from({length: height}, () => []);
    for (const ch of upper) {
      const g = glyphs[ch] || glyphs[' '];
      for (let i = 0; i < height; i++) {
        rows[i].push(g[i] || '');
      }
    }
    const lines = rows.map(parts => parts.join(''));
    return React.createElement(
      Box,
      {flexDirection: 'column'},
      ...lines.map((line, idx) => React.createElement(Text, {key: idx, color: BRAND_HEX, bold: true}, line))
    );
  };

  if (mode === 'nl') {
    return React.createElement(
      Box,
      {flexDirection: 'column'},
      React.createElement(ClearScreen),
      React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Ask me anything'),
      React.createElement(Box, null,
        React.createElement(Text, {color: BRAND_HEX}, '› '),
        React.createElement(TextInput, {
          value: nl,
          onChange: setNl,
          onSubmit: async () => {
            const utterance = nl;
            if (!utterance || utterance.trim().length === 0) {
              setMode('menu');
              return;
            }
            setAsked(utterance);
            setNl('');
            setMode('routing');
            setRouteInfo(null);
            try {
              const result = await interpretUserRequest(utterance);
              setRouteInfo(result);
              if (result.section === 'quit') {
                return exit();
              }
              const routedSection = result.section && result.section !== 'unknown' ? result.section : null;
              setSection(routedSection);
              if (routedSection === 'account') setMode('account');
              else if (routedSection === 'agents') setMode('agents');
              else setMode('placeholder');
            } catch (e) {
              setRouteInfo({section: 'unknown', action: 'unknown', args: {}, confidence: 0, reason: e?.message || 'error'});
              setSection(null);
              setMode('placeholder');
            }
          },
          placeholder: 'e.g., show my account details, list my agents, start a new job',
          focus: true
        })
      ),
      React.createElement(Box, {marginTop: 1},
        React.createElement(Text, null, 'Tip: You can press Esc to go back.')
      )
    );
  }

  if (mode === 'routing') {
    return React.createElement(
      Box,
      {flexDirection: 'column'},
      React.createElement(ClearScreen),
      React.createElement(Text, {color: BRAND_HEX, bold: true}, 'Interpreting your request...')
    );
  }

  if (mode === 'placeholder') {
    return React.createElement(
      Box,
      {flexDirection: 'column'},
      React.createElement(ClearScreen),
      React.createElement(Text, {color: BRAND_HEX, bold: true}, section ? `Coming soon: ${section}` : 'Coming soon'),
      asked && React.createElement(Text, null, `You asked: ${asked}`),
      routeInfo && React.createElement(Text, {dimColor: true}, `NL→ ${routeInfo.section}/${routeInfo.action || 'unknown'} (${Math.round((routeInfo.confidence || 0) * 100)}%)`),
      routeInfo && routeInfo.args && Object.keys(routeInfo.args).length > 0 && React.createElement(Text, {dimColor: true}, `Args: ${JSON.stringify(routeInfo.args)}`),
      routeInfo && routeInfo.reason && React.createElement(Text, {dimColor: true}, `Reason: ${routeInfo.reason}`),
      React.createElement(Text, null, 'We\'ll hook this up to your APIs and schemas next.')
    );
  }

  if (mode === 'account') {
    return React.createElement(AccountView, {onBack: () => setMode('menu')});
  }

  if (mode === 'agents') {
    return React.createElement(AgentsView, {
      onBack: () => setMode('menu'),
      onSelectAgent: (agent) => {
        setSelectedAgent(agent);
        setMode('agent');
      },
      onHireAgent: (agent) => {
        setSelectedAgent(agent);
        setMode('hire');
      }
    });
  }

  if (mode === 'agent') {
    return React.createElement(AgentDetailsView, {
      agent: selectedAgent,
      onBack: () => setMode('agents')
    });
  }

  if (mode === 'auth') {
    return React.createElement(AuthSetupView, {
      onDone: () => {
        setUserLoadNonce((value) => value + 1);
        setMode('menu');
      },
      onBack: () => setMode('menu')
    });
  }

  if (mode === 'jobs') {
    return React.createElement(HiredAgentsView, {
      onBack: () => setMode('menu')
    });
  }

  if (mode === 'hire') {
    return React.createElement(HireAgentView, {
      agent: selectedAgent,
      onBack: () => setMode('agents')
    });
  }

  if (mode === 'coworkers') {
    return React.createElement(CoworkersView, {
      onBack: () => setMode('menu'),
      onSelectCoworker: (coworker) => {
        setSelectedCoworker(coworker);
        setMode('coworker');
      },
      onCreateTask: (coworker) => {
        setSelectedCoworker(coworker);
        setMode('createTask');
      }
    });
  }

  if (mode === 'coworker') {
    return React.createElement(CoworkerDetailsView, {
      coworker: selectedCoworker,
      onBack: () => setMode('coworkers'),
      onCreateTask: (coworker) => {
        setSelectedCoworker(coworker);
        setMode('createTask');
      }
    });
  }

  if (mode === 'dashboard') {
    return React.createElement(DashboardView, {
      onBack: () => setMode('menu'),
      onSelectTask: (task) => {
        setSelectedTask(task);
        setTaskReturnMode('dashboard');
        setMode('task');
      }
    });
  }

  if (mode === 'createTask') {
    return React.createElement(CreateTaskView, {
      coworker: selectedCoworker,
      onBack: () => setMode('coworkers'),
      onTaskCreated: (task) => {
        setSelectedTask(task);
        setTaskReturnMode('dashboard');
        setMode('task');
      }
    });
  }

  if (mode === 'tasks') {
    return React.createElement(TasksView, {
      onBack: () => setMode('menu'),
      onSelectTask: (task) => {
        setSelectedTask(task);
        setTaskReturnMode('tasks');
        setMode('task');
      }
    });
  }

  if (mode === 'task') {
    return React.createElement(TaskDetailsView, {
      task: selectedTask,
      onBack: () => setMode(taskReturnMode),
      onAddJob: (task) => {
        setSelectedTask(task);
        setMode('taskAgents');
      }
    });
  }

  if (mode === 'taskAgents') {
    const handlePickTaskAgent = (agent) => {
      setSelectedAgent(agent);
      setMode('taskHire');
    };

    return React.createElement(AgentsView, {
      onBack: () => setMode('task'),
      onSelectAgent: handlePickTaskAgent,
      onHireAgent: handlePickTaskAgent
    });
  }

  if (mode === 'taskHire') {
    return React.createElement(HireAgentView, {
      agent: selectedAgent,
      task: selectedTask,
      onBack: () => setMode('taskAgents'),
      onJobCreated: () => {
        setMode('task');
      }
    });
  }

  return React.createElement(
    Box,
    {flexDirection: 'column'},
    React.createElement(ClearScreen),
    React.createElement(Box, {flexDirection: 'column', paddingX: 1, paddingY: 1, borderStyle: 'round', borderColor: BRAND_HEX},
      renderAsciiTitle('SOKOSUMI CLI'),
      React.createElement(Box, {marginTop: 1, flexDirection: 'column'},
        userStatus === 'loading' && React.createElement(PixelLoader, {label: 'Loading user…'}),
        userStatus === 'error' && React.createElement(Text, {color: 'red'}, userError || 'Error'),
        userStatus === 'ready' && user && React.createElement(Box, {flexDirection: 'column'},
          React.createElement(Text, null, `Name: ${user.name ?? ''}`),
          React.createElement(Text, null, `Email: ${user.email ?? ''}`),
          user.id && React.createElement(Text, {dimColor: true}, `ID: ${user.id}`)
        )
      )
    ),
    React.createElement(Box, {marginTop: 1},
      React.createElement(Text, null, 'Use arrows to navigate, Enter to select. Or just start typing a request.')
    ),
    React.createElement(Box, {marginTop: 1},
      React.createElement(SelectInput, {items, onSelect: handleSelect, listen: mode === 'menu'})
    ),
    React.createElement(Box, {marginTop: 1},
      React.createElement(Text, {color: BRAND_HEX}, '› '),
      React.createElement(TextInput, {
        value: nl,
        onChange: setNl,
        onSubmit: async () => {
          if (!nl || nl.trim().length === 0) return; // ignore empty submits in menu
          const utterance = nl;
          setAsked(utterance);
          setNl('');
          setMode('routing');
          setRouteInfo(null);
          try {
            const result = await interpretUserRequest(utterance);
            setRouteInfo(result);
            if (result.section === 'quit') {
              return exit();
            }
            const routedSection = result.section && result.section !== 'unknown' ? result.section : null;
            setSection(routedSection);
            setMode(routedSection === 'account' ? 'account' : 'placeholder');
          } catch (e) {
            setRouteInfo({section: 'unknown', action: 'unknown', args: {}, confidence: 0, reason: e?.message || 'error'});
            setSection(null);
            setMode('placeholder');
          }
        },
        placeholder: 'Try: "show my agents" or "what\'s my plan?"',
        focus: false
      })
    )
  );
}

export default function App() {
  const [stage, setStage] = useState('boot'); // boot -> auth|menu
  const [showLogo, setShowLogo] = useState(true);
  const [hasAuth, setHasAuth] = useState(false);

  useEffect(() => {
    loadEnvFromLocalFile();
    const key = getApiKeyFromEnv();
    const authManager = getAuthManager();
    authManager.loadCredentials();
    setHasAuth(Boolean(key) || authManager.isAuthenticated());
  }, []);

  useEffect(() => {
    if (!showLogo) {
      setStage(hasAuth ? 'menu' : 'auth');
    }
  }, [showLogo, hasAuth]);

  if (showLogo) {
    return React.createElement(
      Box,
      {flexDirection: 'column'},
      React.createElement(ClearScreen),
      React.createElement(AnimatedLogo, {onDone: () => setShowLogo(false)})
    );
  }

  if (stage === 'auth') {
    return React.createElement(AuthSetupView, {
      onDone: () => {
        setHasAuth(true);
        setStage('menu');
      }
    });
  }

  return React.createElement(MainMenu);
}
