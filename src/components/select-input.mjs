import React, {useEffect, useState} from 'react';
import {Box, Text, useInput} from 'ink';

const BRAND_HEX = '#7F00FF';

function clampIndex(nextIndex, itemCount) {
  return Math.max(0, Math.min(nextIndex, Math.max(0, itemCount - 1)));
}

function clampWindowStart(nextStart, itemCount, visibleCount) {
  return Math.max(0, Math.min(nextStart, Math.max(0, itemCount - visibleCount)));
}

export default function SelectInput({
  items,
  onSelect,
  onHighlight,
  initialIndex = 0,
  listen = true,
  maxVisibleItems = null
}) {
  const [index, setIndex] = useState(() => clampIndex(initialIndex, items.length));
  const [windowStart, setWindowStart] = useState(0);
  const hasItems = items.length > 0;
  const visibleCount = Number.isFinite(maxVisibleItems) && maxVisibleItems > 0
    ? Math.min(items.length, Math.max(1, Math.floor(maxVisibleItems)))
    : items.length;
  const startIndex = clampWindowStart(windowStart, items.length, visibleCount);
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const visibleItems = hasItems ? items.slice(startIndex, endIndex) : [];

  // Keep the controlled initial index in sync when parents intentionally reset the cursor.
  useEffect(() => {
    if (!Number.isFinite(initialIndex)) return;
    const nextIndex = clampIndex(initialIndex, items.length);
    setIndex(nextIndex);
  }, [initialIndex, items.length]);

  // Reset index if it's out of bounds when items change.
  useEffect(() => {
    if (index >= items.length) {
      setIndex(clampIndex(index, items.length));
    }
  }, [items.length, index]);

  useEffect(() => {
    setWindowStart(currentStart => {
      if (visibleCount <= 0) return 0;
      if (index < currentStart) {
        return clampWindowStart(index, items.length, visibleCount);
      }
      if (index >= currentStart + visibleCount) {
        return clampWindowStart(index - visibleCount + 1, items.length, visibleCount);
      }
      return clampWindowStart(currentStart, items.length, visibleCount);
    });
  }, [index, items.length, visibleCount]);

  useEffect(() => {
    if (!onHighlight) return;
    onHighlight(items[index] || null, index);
  }, [index, items, onHighlight]);

  useInput((input, key) => {
    if (!listen) return;
    if (items.length === 0) return;
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
    if (key.return && items[index]) onSelect && onSelect(items[index]);
  });

  return React.createElement(
    Box,
    {flexDirection: 'column', width: '100%'},
    startIndex > 0 && React.createElement(
      Box,
      {key: '__select-input-top-hint'},
      React.createElement(Text, {dimColor: true}, `↑ ${startIndex} more`)
    ),
    ...visibleItems.map((item, visibleIndex) => {
      const absoluteIndex = startIndex + visibleIndex;
      return React.createElement(
        Box,
        {key: item.value, width: '100%'},
        React.createElement(Text, {color: absoluteIndex === index ? BRAND_HEX : undefined}, absoluteIndex === index ? '› ' : '  '),
        React.createElement(Box, {flexGrow: 1, width: '100%'},
          item.render
            ? React.createElement(Box, {width: '100%'}, item.render())
            : React.createElement(Text, {color: absoluteIndex === index ? BRAND_HEX : undefined, bold: absoluteIndex === index}, item.label)
        )
      );
    }),
    endIndex < items.length && React.createElement(
      Box,
      {key: '__select-input-bottom-hint'},
      React.createElement(Text, {dimColor: true}, `↓ ${items.length - endIndex} more`)
    )
  );
}
