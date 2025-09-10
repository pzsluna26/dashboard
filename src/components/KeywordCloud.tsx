'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface KeywordCloudProps {
  keywords: string[];
  onKeywordClick?(keyword: string): void;
  selectedDate: string;
}

const COLORS = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'];

function formatDateToKey(dateStr: string): string {
  // Example: convert '2024-06-10' to '20240610'
  return dateStr.replace(/-/g, '');
}

export default function KeywordCloud({ keywords, selectedDate, onKeywordClick }: KeywordCloudProps) {
  const router = useRouter();
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 300, height: 300 });

  // 콘솔로 keywords와 selectedDate 출력해 확인하기
  console.log('KeywordCloud keywords:', keywords);
  console.log('KeywordCloud selectedDate:', selectedDate);

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setSize({ width: rect.width, height: rect.height });
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const fontSizes = [14, 16, 18, 20, 22, 26];

  const bubbles = keywords.map((word, i) => {
    const fontSize = fontSizes[i % fontSizes.length];
    const approxWidth = word.length * (fontSize * 0.6);
    const approxHeight = fontSize * 1.2;

    const left = Math.random() * (size.width - approxWidth - 10) + 5;
    const top = Math.random() * (size.height - approxHeight - 10) + 5;

    return {
      word,
      color: COLORS[i % COLORS.length],
      fontSize,
      left,
      top,
      fontWeight: i % 4 === 0 ? 700 : 500,
    };
  });

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setScale((prev) => {
      let nextScale = prev + delta;
      if (nextScale < 0.5) nextScale = 0.5;
      if (nextScale > 3) nextScale = 3;
      return nextScale;
    });
  };

  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      style={{
        width: '500px',
        height: '250px',
        borderRadius: 20,
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        overflow: 'auto',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: size.width,
          height: size.height,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease-out',
        }}
      >
        {bubbles.map(({ word, color, fontSize, left, top, fontWeight }, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left,
              top,
              fontSize,
              fontWeight,
              color,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'transform 0.3s ease',
              padding: '2px 4px',
              borderRadius: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
            }}
            onClick={() => {
              if (onKeywordClick) onKeywordClick(word);
              const dateKey = formatDateToKey(selectedDate);
              router.push(`/detail/${dateKey}/${encodeURIComponent(word)}`);
              console.log('Clicked keyword:', word);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.3)';
              e.currentTarget.style.zIndex = '10';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.zIndex = '1';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
            }}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
