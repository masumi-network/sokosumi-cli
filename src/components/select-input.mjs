import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';

const BRAND_HEX = '#7F00FF';

export default function SelectInput({items, onSelect, initialIndex = 0, listen = true}) {
  const [index, setIndex] = useState(initialIndex);

  useInput((input, key) => {
    if (!listen) return;
    if (key.upArrow) setIndex(i => (i - 1 + items.length) % items.length);
    if (key.downArrow) setIndex(i => (i + 1) % items.length);
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


