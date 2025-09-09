import React, { Component, ReactNode } from 'react';
import { Alert, Box } from '@cloudscape-design/components';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box padding="l">
          <Alert type="error" header="Something went wrong">
            Please refresh the page or contact support if the problem persists.
          </Alert>
        </Box>
      );
    }
    return this.props.children;
  }
}
