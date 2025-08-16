import React, {useEffect, useRef, useState} from 'react';
import {Box, Text, useInput} from 'ink';

export default function TextInput({value, onChange, onSubmit, placeholder = '', focus = false}) {
  const [focused, setFocused] = useState(focus);
  const valRef = useRef(value || '');

  useEffect(() => { valRef.current = value || ''; }, [value]);

  useInput((input, key) => {
    if (!focused) return;
    if (key.return) {
      onSubmit && onSubmit(valRef.current);
      return;
    }
    if (key.backspace || key.delete) {
      const next = valRef.current.slice(0, -1);
      valRef.current = next;
      onChange && onChange(next);
      return;
    }
    if (key.leftArrow || key.rightArrow || key.upArrow || key.downArrow || key.tab) return;
    const next = valRef.current + input;
    valRef.current = next;
    onChange && onChange(next);
  });

  useEffect(() => { setFocused(focus); }, [focus]);

  const display = (value && value.length > 0) ? value : placeholder;
  const dim = !(value && value.length > 0);

  return React.createElement(
    Box,
    null,
    React.createElement(Text, {dimColor: dim}, display)
  );
}


