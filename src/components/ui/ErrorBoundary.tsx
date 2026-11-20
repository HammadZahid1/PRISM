import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, showDetails: false };

  static getDerivedStateFromError(error: Error): State {
    return { error, showDetails: false };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('PRISM encountered a rendering error', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null, showDetails: false });
  };

  render() {
    const { error, showDetails } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex h-full w-full items-center justify-center bg-base p-6">
        <div className="w-full max-w-lg rounded-lg border border-red-400/20 bg-[#101318] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-400/25 bg-red-400/10 text-red-300">
              <AlertTriangle size={17} />
            </span>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-[#e9edf3]">PRISM hit an unexpected error</h1>
              <p className="mt-1 text-[11px] leading-relaxed text-[#8a94a3]">
                The current view could not be rendered. Your datasets remain in local storage; resetting this view is safe.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button size="sm" icon={<RotateCcw size={13} />} onClick={this.reset}>
              Try again
            </Button>
            <Button size="sm" variant="ghost" onClick={() => window.location.reload()}>
              Reload PRISM
            </Button>
            <button
              type="button"
              className="text-[10px] text-[#6c7685] underline decoration-dotted underline-offset-2 hover:text-[#a2acba]"
              onClick={() => this.setState({ showDetails: !showDetails })}
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          </div>

          {showDetails && (
            <pre className="mono mt-4 max-h-48 overflow-auto rounded border border-white/[0.07] bg-[#0b0d10] p-3 text-[10px] leading-relaxed text-[#8a94a3]">
              {error.stack ?? error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
