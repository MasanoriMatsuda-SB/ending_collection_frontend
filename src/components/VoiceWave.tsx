// components/VoiceWave.tsx
import React from "react";

interface VoiceWaveProps {
  isPlaying: boolean;
}

export default function VoiceWave({ isPlaying }: VoiceWaveProps) {
  return (
    <div className="flex space-x-1 items-end h-4">
      {[1, 2, 3, 4, 5].map((bar, index) => (
        <div
          key={index}
          className={`w-1 rounded bg-blue-500 ${
            isPlaying
              ? `animate-bounce delay-${index * 100}`
              : "h-1 bg-gray-300"
          }`}
          style={{ height: isPlaying ? `${6 + index * 4}px` : "4px" }}
        />
      ))}
    </div>
  );
}
