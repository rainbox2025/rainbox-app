import React, { useState, useRef, useEffect } from "react";
import { useMails } from "@/context/mailsContext";
import { ElevenLabsClient } from "elevenlabs";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { stripHtml } from "@/lib/utils";
import { useSenders } from "@/context/sendersContext";
import { SenderIcon } from "../sidebar/sender-icon";
import { SenderType } from "@/types/data";

const TextToAudio = ({
  open,
  onOpenChange,
  containerRef
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}) => {
  const { selectedMail, summarize } = useMails();
  const { senders } = useSenders();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [dialogStyle, setDialogStyle] = useState({});

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Derive the sender from the mail being played for accuracy
  const mailSender: any = selectedMail
    ? senders.find(s => s.id === selectedMail.sender_id) || {
      id: selectedMail.sender_id || 'unknown',
      name: selectedMail.sender || 'Unknown Sender',
      image_url: null,
      domain: '' // Add other required fields with defaults
    }
    : null;

  // Main effect to handle audio generation, playback, and cleanup
  useEffect(() => {
    // This function orchestrates the entire text-to-speech process
    const generateAndPlayAudio = async () => {
      if (!selectedMail) return;

      setIsLoading(true);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      try {
        // 1. Get text content, prioritizing summary over the full body
        const mailSummary = await summarize(selectedMail.id);
        const textToConvert = mailSummary || stripHtml(selectedMail.body);

        if (!textToConvert) {
          console.error("No text available to convert to speech.");
          setIsLoading(false);
          return;
        }

        // 2. Call ElevenLabs API to get audio stream
        const client = new ElevenLabsClient({ apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY! });
        const audioStream = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
          text: textToConvert,
          model_id: "eleven_multilingual_v2",
        });

        // 3. Convert stream to a playable Blob URL
        const chunks: Uint8Array[] = [];
        for await (const chunk of audioStream) {
          chunks.push(chunk);
        }
        const audioBlob = new Blob(chunks, { type: "audio/mpeg" });
        const audioUrl = URL.createObjectURL(audioBlob);

        // 4. Create, configure, and play the audio element
        const audioElement = new Audio(audioUrl);
        audioRef.current = audioElement;
        audioElement.playbackRate = playbackRate;

        audioElement.addEventListener("loadedmetadata", () => {
          setDuration(audioElement.duration);
          setIsLoading(false);
          audioElement.play();
          setIsPlaying(true);
        });

        audioElement.addEventListener("timeupdate", () => {
          setCurrentTime(audioElement.currentTime);
        });

        audioElement.addEventListener("ended", () => {
          setIsPlaying(false);
          setCurrentTime(0);
        });

      } catch (error) {
        console.error("Error converting text to speech:", error);
        setIsLoading(false);
      }
    };

    if (open) {
      generateAndPlayAudio();
    }

    // Cleanup function: runs when the component unmounts or dependencies change
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        const audioUrl = audioRef.current.src;
        // Revoke the object URL to prevent memory leaks
        if (audioUrl && audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl);
        }
        audioRef.current = null;
      }
    };
  }, [open, selectedMail?.id]); // Re-run when opened or a new mail is selected

  // Effect to handle the positioning of the dialog
  useEffect(() => {
    const updatePosition = () => {
      if (!containerRef?.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      setDialogStyle({
        position: 'fixed',
        bottom: '0',
        left: `${containerRect.left}px`,
        width: `${containerRect.width}px`,
        zIndex: 50,
      });
    };

    updatePosition();
    const resizeObserver = new ResizeObserver(updatePosition);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [containerRef]);

  // --- Control Handlers ---

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const togglePlaybackRate = () => {
    if (!audioRef.current) return;
    const rates = [1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const newRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(newRate);
    audioRef.current.playbackRate = newRate;
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (!open) return null;

  return (
    <div style={dialogStyle}>
      <div className="bg-sidebar/1 backdrop-blur-3xl border-t border-border shadow-lg animate-in slide-in-from-bottom duration-300 p-4 max-w-xl rounded-t-md mx-auto relative pb-8">
        <div className="flex justify-end absolute right-0 top-0">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 bg-blue-900/10 dark:bg-blue-900/30 p-2 rounded-lg">
              {mailSender && <SenderIcon sender={mailSender} />}
            </div>
            <div className="overflow-hidden">
              <div className="font-medium truncate w-full">{selectedMail?.subject || "Untitled Email"}</div>
              <div className="text-xs text-muted-foreground truncate">{mailSender?.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-0 flex-shrink-0 ml-2 pr-4">
            <Button variant="ghost" size="sm" onClick={togglePlaybackRate} className="text-xs text-muted-foreground px-2 py-1 w-10">
              {playbackRate}x
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => skip(-10)}>
              <SkipBack className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost" size="icon" onClick={togglePlayPause} disabled={isLoading}
              className="rounded-full bg-accent h-8 w-8 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-t-transparent border-primary rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => skip(10)}>
              <SkipForward className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-8 text-center">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              disabled={isLoading || !duration}
              className="flex-grow"
            />
            <span className="text-xs text-muted-foreground w-8 text-center">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToAudio;