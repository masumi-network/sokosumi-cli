import React, {useEffect, useState} from 'react';
import {Box, Text} from 'ink';
import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';

const BRAND_HEX = '#7F00FF';

function resolveLogoPath() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // logo file is at project root
  return path.resolve(__dirname, '../../logo_sokosumi_pixelart.txt');
}

export default function AnimatedLogo({onDone}) {
  const [lines, setLines] = useState([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const logoPath = resolveLogoPath();
        const content = await fs.readFile(logoPath, 'utf8');
        const split = content.replace(/\r\n/g, '\n').split('\n');
        setLines(split);
        setLoaded(true);
      } catch (e) {
        setLines(['Sokosumi']);
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (visibleCount >= lines.length) {
      const timer = setTimeout(() => onDone && onDone(), 400);
      return () => clearTimeout(timer);
    }
    const interval = setInterval(() => {
      setVisibleCount(c => c + 1);
    }, 60);
    return () => clearInterval(interval);
  }, [loaded, visibleCount, lines, onDone]);

  return React.createElement(
    Box,
    {flexDirection: 'column'},
    ...lines.slice(0, visibleCount).map((line, idx) =>
      React.createElement(Text, {key: idx}, line)
    ),
    visibleCount < lines.length &&
      React.createElement(Text, {color: BRAND_HEX}, 'SOKOSUMI CLI')
  );
}


