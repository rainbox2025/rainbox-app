import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useMails } from "@/context/mailsContext";
import { ElevenLabsClient } from "elevenlabs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Volume1,
  VolumeX,
} from "lucide-react";
import { stripHtml } from "@/lib/utils";

const TextToAudio = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { selectedMail } = useMails();
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const convertTextToSpeech = async () => {
    if (!selectedMail?.body) return;

    try {
      setIsLoading(true);

      // Strip HTML tags to get plain text
      const plainText = stripHtml(selectedMail.body);
      console.log(plainText);
      console.log(process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!);
      const client = new ElevenLabsClient({
        apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!,
      });
      // Get the audio stream
      const audioStream = await client.textToSpeech.convert(
        "JBFqnCBsd6RMkjVDRZzb",
        {
          text: plainText,
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
    if (selectedMail?.body) {
      convertTextToSpeech();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener("timeupdate", updateProgress);
        setAudio(null);
      }
    };
  }, [selectedMail?.body]);

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
  };

  const changeVolume = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audio) {
      audio.volume = newVolume;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Text to Audio</DialogTitle>
          <DialogDescription>
            {isLoading
              ? "Converting text to speech..."
              : "Listen to the email content"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          {/* Waveform animation */}
          {isPlaying && (
            <div className="flex items-center justify-center h-16 w-full">
              <div className="flex items-end space-x-1">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-primary w-1 animate-pulse rounded-full"
                    style={{
                      height: `${Math.max(15, Math.floor(Math.random() * 45))}px`,
                      animationDuration: `${0.6 + Math.random() * 0.7}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full space-y-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={(value: number[]) => {
                if (audio) {
                  audio.currentTime = value[0];
                }
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={() => skip(-10)}>
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              disabled={!audio || isLoading}
              variant="default"
              size="icon"
              onClick={togglePlayPause}
              className="h-12 w-12 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>

            <Button variant="outline" size="icon" onClick={() => skip(10)}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Volume control */}
          <div className="flex items-center space-x-2 w-full max-w-xs">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeVolume(volume > 0 ? [0] : [1])}
            >
              {volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : volume < 0.5 ? (
                <Volume1 className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={changeVolume}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TextToAudio;
