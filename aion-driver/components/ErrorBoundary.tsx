import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import * as Sentry from "@sentry/react-native";
import { isSentryEnabled } from "../lib/sentry";

type Props = { children: ReactNode; fallbackTitle?: string };

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.warn("[ErrorBoundary]", error.message, info.componentStack);
    }
    if (isSentryEnabled()) {
      Sentry.captureException(error, {
        contexts: { react: { componentStack: info.componentStack } },
      });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center bg-slate-950 px-6">
          <Text className="mb-2 text-center text-lg font-semibold text-white">
            {this.props.fallbackTitle ?? "Что-то пошло не так"}
          </Text>
          <Text className="mb-6 text-center text-sm text-slate-400">
            {this.state.error.message}
          </Text>
          <Pressable
            onPress={() => this.setState({ error: null })}
            className="rounded-2xl bg-cyan-500/20 px-5 py-3"
          >
            <Text className="font-semibold text-cyan-200">Повторить</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
