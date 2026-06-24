import { useCallback, useEffect, useRef, useState } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { parseVoiceCommand, type VoiceCommand } from "./parseVoiceCommand";

function humanError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Нет доступа к микрофону или распознаванию речи";
    case "no-speech":
    case "speech-timeout":
      return "Не расслышал — попробуйте ещё раз";
    case "network":
      return "Для распознавания нужен интернет";
    case "language-not-supported":
      return "Русское распознавание недоступно на этом устройстве";
    case "audio-capture":
      return "Микрофон недоступен";
    default:
      return "Не удалось распознать речь";
  }
}

/**
 * Голосовой ввод команд водителя. Тонкая обёртка над expo-speech-recognition:
 * слушает один результат, парсит его в команду и отдаёт через onCommand.
 */
export function useVoiceCapture(
  onCommand: (cmd: VoiceCommand, transcript: string) => void,
) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onCommandRef = useRef(onCommand);
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useSpeechRecognitionEvent("result", (e) => {
    if (!e.isFinal) return;
    const transcript = e.results?.[0]?.transcript?.trim() ?? "";
    const cmd = parseVoiceCommand(transcript);
    if (cmd) {
      onCommandRef.current(cmd, transcript);
    } else {
      setError(
        transcript ? `Не понял: «${transcript}»` : "Не расслышал команду",
      );
    }
  });
  useSpeechRecognitionEvent("error", (e) => {
    setError(humanError(e.error));
    setListening(false);
  });
  useSpeechRecognitionEvent("end", () => setListening(false));

  const start = useCallback(async () => {
    setError(null);
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setError("Нет доступа к микрофону");
        return;
      }
      setListening(true);
      ExpoSpeechRecognitionModule.start({
        lang: "ru-RU",
        interimResults: false,
        continuous: false,
        contextualStrings: [
          "доход",
          "заправка",
          "литров",
          "смену",
          "пауза",
          "продолжить",
        ],
      });
    } catch {
      setError("Не удалось запустить распознавание");
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { listening, error, start, stop, clearError };
}
