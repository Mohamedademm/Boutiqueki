import { Component } from 'react';

/**
 * Catches render/runtime errors anywhere in the tree and shows a friendly
 * fallback instead of a blank white screen.
 *
 * Sentry-ready: if a Sentry client is loaded (window.Sentry, enabled when
 * VITE_SENTRY_DSN is set and the SDK is wired), the error is forwarded.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
    if (typeof window !== 'undefined' && window.Sentry?.captureException) {
      window.Sentry.captureException(error, { extra: info });
    }
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center text-4xl">
            😕
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Une erreur est survenue</h1>
          <p className="text-slate-500 mb-8">
            Désolé, quelque chose s'est mal passé. Vous pouvez recharger la page pour continuer.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Recharger
            </button>
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
