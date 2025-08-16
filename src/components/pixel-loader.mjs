import React, {useEffect, useMemo, useState} from 'react';
import {Box, Text} from 'ink';

const BRAND_HEX = '#7F00FF';

// Compact animated 1x1 pixel pulse in brand color
export default function PixelLoader({color = BRAND_HEX, label = 'Loading...', intervalMs = 120}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const shades = useMemo(() => ['░', '▒', '▓', '█', '▓', '▒'], []);
  const ch = shades[tick % shades.length];

  return React.createElement(
    Box,
    {flexDirection: 'row', alignItems: 'center'},
    React.createElement(Text, {color}, ch),
    label && React.createElement(Text, {color, dimColor: false}, ` ${label}`)
  );
}


