"use client";
import { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react"; 
import VoiceWave from "./VoiceWave";

interface VoiceMessageProps {
  src: string;
}

export default function VoiceMessage({ src }: VoiceMessageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const formatTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(Math.floor(seconds % 60)).padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
  
    const handleLoaded = () => {
      const waitForDuration = () => {
        if (audio.duration && isFinite(audio.duration)) {
          setDuration(audio.duration);
        } else {
          setTimeout(waitForDuration, 200);
        }
      };
      waitForDuration();
    };

    const handleTimeUpdate = () => {
        setRemainingTime(audio.duration - audio.currentTime);
      };
  
      const handleEnded = () => {
        setIsPlaying(false);
        setRemainingTime(duration); // 初期値に戻す
      };
  
      audio.addEventListener("loadedmetadata", handleLoaded);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("ended", handleEnded);
  
      return () => {
        audio.removeEventListener("loadedmetadata", handleLoaded);
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("ended", handleEnded);
      };
    }, [duration]);

  return (
    <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-2 max-w-xs shadow">
      <button onClick={togglePlay}>
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

        <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
            setIsPlaying(false);
            setRemainingTime(duration); // 再生後リセット
        }}
        hidden
        />
        
    {/* テキスト＋波形をまとめて表示 */}
    <div className="flex flex-col items-start">
        <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
            {isPlaying ? "再生中..." : "音声メッセージ"}
            </span>
            <VoiceWave isPlaying={isPlaying} /> {/* ← ここで波形を表示 */}
        </div>
        {remainingTime !== null && isFinite(remainingTime) && (
            <span className="text-xs text-gray-400">{formatTime(remainingTime)}</span>
        )}
        </div>
    </div>
    );
}
