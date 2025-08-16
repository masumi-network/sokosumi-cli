import React, {useEffect} from 'react';
import {useStdout} from 'ink';

// Clears terminal display and scrollback, moves cursor to home.
export default function ClearScreen() {
  const {stdout} = useStdout();
  useEffect(() => {
    if (stdout && stdout.isTTY) {
      // Clear screen (2J), clear scrollback (3J), move cursor to 1;1 (H)
      stdout.write('\u001b[2J\u001b[3J\u001b[H');
    }
  }, [stdout]);
  return null;
}


