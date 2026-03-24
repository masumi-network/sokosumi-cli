import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';

const BRAND_HEX = '#7F00FF';

export default function SelectInput({items, onSelect, initialIndex = 0, listen = true}) {
  const [index, setIndex] = useState(initialIndex);

  // Reset index if it's out of bounds when items change
  useEffect(() => {
    if (index >= items.length) {
      setIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, index]);

  useInput((input, key) => {
    if (!listen) return;
    if (key.upArrow) {
      setIndex(i => {
        const newIndex = i - 1;
        return newIndex < 0 ? items.length - 1 : newIndex;
      });
    }
    if (key.downArrow) {
      setIndex(i => {
        const newIndex = i + 1;
        return newIndex >= items.length ? 0 : newIndex;
      });
    }
    if (key.return) onSelect && onSelect(items[index]);
  });

  return React.createElement(
    Box,
    {flexDirection: 'column', width: '100%'},
    ...items.map((item, i) => (
      React.createElement(Box, {key: item.value, width: '100%'},
        React.createElement(Text, {color: i === index ? BRAND_HEX : undefined}, i === index ? '› ' : '  '),
        React.createElement(Box, {flexGrow: 1, width: '100%'},
          item.render
            ? React.createElement(Box, {width: '100%'}, item.render())
            : React.createElement(Text, {color: i === index ? BRAND_HEX : undefined, bold: i === index}, item.label)
        )
      )
    ))
  );
}


