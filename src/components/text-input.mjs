import React, {useEffect, useRef, useState} from 'react';
import {Box, Text, useInput} from 'ink';

export default function TextInput({value, onChange, onSubmit, placeholder = '', focus = false, cursorBlinkMs = 500}) {
  const [focused, setFocused] = useState(focus);
  const valRef = useRef(value || '');
  const [cursorVisible, setCursorVisible] = useState(true);
  const CURSOR_CHAR = '▎';
  const cursorTimerRef = useRef(null);

  useEffect(() => { valRef.current = value || ''; }, [value]);

  const triggerCursorPulse = () => {
    if (!focused) return;
    const duration = Math.max(80, Number(cursorBlinkMs) || 200);
    if (cursorTimerRef.current) {
      clearTimeout(cursorTimerRef.current);
      cursorTimerRef.current = null;
    }
    setCursorVisible(false);
    cursorTimerRef.current = setTimeout(() => {
      setCursorVisible(true);
      cursorTimerRef.current = null;
    }, duration);
  };

  useInput((input, key) => {
    if (!focused) return;
    if (key.return) {
      onSubmit && onSubmit(valRef.current);
      triggerCursorPulse();
      return;
    }
    if (key.backspace || key.delete) {
      const next = valRef.current.slice(0, -1);
      valRef.current = next;
      onChange && onChange(next);
      triggerCursorPulse();
      return;
    }
    if (key.leftArrow || key.rightArrow || key.upArrow || key.downArrow || key.tab) return;
    const next = valRef.current + input;
    valRef.current = next;
    onChange && onChange(next);
    triggerCursorPulse();
  });

  useEffect(() => { setFocused(focus); }, [focus]);

  useEffect(() => {
    if (!focused) {
      setCursorVisible(false);
      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
        cursorTimerRef.current = null;
      }
      return;
    }
    setCursorVisible(true);
    return () => {
      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
        cursorTimerRef.current = null;
      }
    };
  }, [focused, cursorBlinkMs]);

  const display = (value && value.length > 0) ? value : placeholder;
  const dim = !(value && value.length > 0);

  return React.createElement(
    Box,
    null,
    // When showing placeholder and focused, show cursor at the beginning
    (dim && focused) && React.createElement(Text, null, cursorVisible ? CURSOR_CHAR : ' '),
    React.createElement(Text, {dimColor: dim}, display),
    // When showing actual value and focused, show cursor at the end
    (!dim && focused) && React.createElement(Text, null, cursorVisible ? CURSOR_CHAR : ' ')
  );
}


