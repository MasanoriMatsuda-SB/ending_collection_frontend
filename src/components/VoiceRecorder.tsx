// src/components/VoiceRecorder.tsx
"use client";

import { useState, useRef } from "react";
import type { Socket } from "socket.io-client";
import Image from "next/image";

interface VoiceRecorderProps {
  itemId: string;
  currentUserId: number;
  socket: Socket;
  fetchMessages: () => void;
}

export default function VoiceRecorder({ itemId, currentUserId, socket, fetchMessages }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
              }
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            const audioFile = new File([audioBlob], "voice-message.webm", { type: "audio/webm" });

          const threadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/threads/by-item/${itemId}`);
          const thread = await threadRes.json();
          if (!thread.thread_id) return;

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              thread_id: thread.thread_id,
              user_id: currentUserId,
              content: "",
            }),
          });

          const newMessage = await res.json();

          const formData = new FormData();
          formData.append("message_id", String(newMessage.message_id));
          formData.append("file", audioFile);

          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/message_attachments`, {
            method: "POST",
            body: formData,
          });

          socket.emit("send_message", newMessage);
          await fetchMessages();
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("録音開始に失敗しました", err);
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={toggleRecording}
        className={`cursor-pointer ${isRecording ? "animate-pulse" : ""}`}
      >
        {/* <img
          src="/icon-record.png"
          alt="録音"
          className={`w-3 h-6 ${isRecording ? "brightness-50" : ""}`}
        /> */}

        <Image
        src="/icon-record.png"
        alt="録音"
        width={24}
        height={24}
        className="w-3 h-6"
        />
      </button>
      {isRecording && (
        <span className="text-red-500 text-xs font-bold mt-1">REC</span>
      )}
    </div>
  );
}
