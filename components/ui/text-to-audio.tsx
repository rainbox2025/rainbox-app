import React, { useState, useRef, useEffect } from "react";
import { useMails } from "@/context/mailsContext";
import { ElevenLabsClient } from "elevenlabs";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Volume1,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { stripHtml } from "@/lib/utils";
import { useSenders } from "@/context/sendersContext";
import { SenderIcon } from "../sidebar/sender-icon";

const TextToAudio = ({
  open,
  onOpenChange,
  containerRef
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  containerRef: any;
}) => {
  const { selectedMail, summarize, summarizeLoading } = useMails();
  const [summary, setSummary] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [dialogStyle, setDialogStyle] = useState({});
  const { selectedSender } = useSenders();



  // Get summary when component opens or selected mail changes
  useEffect(() => {
    const summarizeMail = async () => {
      if (open && selectedMail?.id) {
        const mailSummary = await summarize(selectedMail.id);
        setSummary(mailSummary);
      }
    };
    // summarizeMail();
  }, [open, selectedMail?.id, summarize]);

  const convertTextToSpeech = async () => {
    // Use summary if available, otherwise fall back to body
    const textToConvert = summary || (selectedMail?.body ? stripHtml(selectedMail.body) : null);

    if (!textToConvert) return;

    try {
      setIsLoading(true);

      const client = new ElevenLabsClient({
        apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!,
      });

      // Get the audio stream
      const audioStream = await client.textToSpeech.convert(
        "JBFqnCBsd6RMkjVDRZzb",
        {
          text: textToConvert,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",
        }
      );

      // Convert the stream to an ArrayBuffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk);
      }

      // Concatenate chunks into a single Uint8Array
      const totalLength = chunks.reduce((acc, val) => acc + val.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      // Create audio URL from blob
      const audioBlob = new Blob([result.buffer], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and configure audio element
      const audioElement = new Audio(audioUrl);
      audioElement.volume = volume;
      audioElement.playbackRate = playbackRate;
      audioRef.current = audioElement;
      setAudio(audioElement);

      // Add event listeners
      audioElement.addEventListener("timeupdate", updateProgress);
      audioElement.addEventListener("loadedmetadata", () => {
        setDuration(audioElement.duration);
      });
      audioElement.addEventListener("ended", () => {
        setIsPlaying(false);
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error converting text to speech:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && (summary || selectedMail?.body)) {
      convertTextToSpeech();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener("timeupdate", updateProgress);
        setAudio(null);
      }
    };
  }, [summary, open]);

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const togglePlayPause = () => {
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (seconds: number) => {
    if (!audio) return;
    audio.currentTime += seconds;
    setCurrentTime(audio.currentTime);
  };

  const changeVolume = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audio) {
      audio.volume = newVolume;
    }
  };

  const togglePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];

    setPlaybackRate(newRate);
    if (audio) {
      audio.playbackRate = newRate;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  useEffect(() => {
    const updatePosition = () => {
      if (!containerRef?.current) return;

      // Get container width for proper sizing
      const containerWidth = containerRef.current.getBoundingClientRect().width;

      setDialogStyle({
        position: 'fixed',
        bottom: '0',
        left: containerRef.current.getBoundingClientRect().left,
        width: `${containerWidth}px`,
        zIndex: 50
      });
    };

    // Initial position calculation
    updatePosition();

    // Only update on resize, not on scroll
    window.addEventListener('resize', updatePosition);

    // Create a ResizeObserver to detect container width changes
    const resizeObserver = new ResizeObserver(updatePosition);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      resizeObserver.disconnect();
    };
  }, [containerRef]);



  if (!open) return null;

  return (
    <div
      style={{
        ...dialogStyle,
        borderRadius: '8px 8px 0 0',
      }}
    >
      <div className="bg-sidebar/1 backdrop-blur-3xl border-t border-gray-200 dark:border-gray-800 shadow-lg animate-in slide-in-from-bottom duration-300 p-4 max-w-xl rounded-t-md mx-auto relative pb-8">
        {/* Close button at top right corner */}
        <div className="flex justify-end absolute right-0 top-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 bg-blue-900/10 dark:bg-blue-900/30 p-2 rounded-lg">
              {selectedSender && <SenderIcon sender={selectedSender} />}
            </div>
            <div className="overflow-hidden">
              <div className="font-medium truncate w-full">{selectedMail?.subject || "Untitled Email"}</div>
              <div className="text-xs text-gray-500 truncate">{selectedSender?.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-0 flex-shrink-0 ml-2 pr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlaybackRate}
              className="text-xs text-gray-500 px-2 py-1"
            >
              {playbackRate}x
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => skip(-10)}
            >
              <SkipBack className="h-4 w-4 text-gray-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              disabled={isLoading}
              className="rounded-full bg-gray-100 dark:bg-gray-800 h-8 w-8 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => skip(10)}
            >
              <SkipForward className="h-4 w-4 text-gray-500" />
            </Button>
            {/* Removed the close button from here */}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-2">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={(value: number[]) => {
                if (audio) {
                  audio.currentTime = value[0];
                }
              }}
              className="flex-grow"
            />
            <span className="text-xs text-gray-500 ml-2">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToAudio;