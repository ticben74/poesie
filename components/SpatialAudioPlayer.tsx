
import React, { useEffect, useRef, useState } from 'react';

interface SpatialAudioPlayerProps {
  url: string;
  isActive: boolean;
  volume: number;
}

export const SpatialAudioPlayer: React.FC<SpatialAudioPlayerProps> = ({ url, isActive, volume }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isActive) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isActive, volume]);

  return <audio ref={audioRef} src={url} loop />;
};
