"use client";

import { Component, type ReactNode } from "react";

/**
 * A slide that throws must not take the webinar with it. The boundary swaps in
 * a plain title card that looks deliberate on a shared screen, and navigation
 * keeps working.
 */
export class SlideBoundary extends Component<
  { children: ReactNode; title: string; dark?: boolean; onError?: (e: Error) => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("[deck] slide failed:", error);
    this.props.onError?.(error);
  }

  componentDidUpdate(prev: { children: ReactNode }) {
    if (this.state.failed && prev.children !== this.props.children) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;

    const dark = this.props.dark;
    return (
      <div
        className="absolute inset-0 grid place-items-center"
        style={{ background: dark ? "#2b2a28" : "#f4f1ea" }}
      >
        <h1
          className="font-display px-[220px] text-center leading-[1.05]"
          style={{ fontSize: 104, color: dark ? "#f4f1ea" : "#2b2a28" }}
        >
          {this.props.title}
        </h1>
      </div>
    );
  }
}
