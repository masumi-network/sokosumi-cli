import React, {useEffect, useState} from 'react';
import {Box, Text, useStdout} from 'ink';

const BRAND_HEX = '#7F00FF';

export default function ScreenContainer({children}) {
  const {stdout} = useStdout();
  const [ready, setReady] = useState(false);
  const width = Math.max(0, (stdout && stdout.columns) ? stdout.columns : 80);
  const line = '─'.repeat(width);

  useEffect(() => {
    if (stdout && stdout.isTTY) {
      stdout.write('\u001b[2J\u001b[3J\u001b[H');
    }
    setReady(true);
  }, [stdout]);

  if (!ready) return null;

  return React.createElement(
    Box,
    {flexDirection: 'column', width: '100%'},
    (() => {
      const label = '* SOKOSUMI CLI ';
      const remaining = Math.max(0, width - label.length);
      const rule = '─'.repeat(remaining);
      return React.createElement(
        Box,
        {flexDirection: 'row', width: '100%'},
        React.createElement(Text, {color: BRAND_HEX, bold: true}, label),
        React.createElement(Text, {color: BRAND_HEX}, rule)
      );
    })(),
    React.createElement(Box, {marginTop: 2, flexDirection: 'column', width: '100%'}, children)
  );
}


