declare module "@godaddy/terminus" {

  export type HealthCheck = () => Promise<any>;

  export class TerminusError extends Error { }

  export class HealthCheckError extends TerminusError {
    constructor(message: string, causes: any);
    public causes: string;
  }

  export class HealthCheckNotFoundError extends TerminusError { }

  export interface HealthCheckMap {
    [key: string]: HealthCheck;
  }

  export interface HealthStatus {
    status: 'ok' | 'error';
    error: string[];
  }

  export interface TerminusOptions {
    healthChecks?: HealthCheckMap;
    timeout?: number;
    signal?: string;
    signals?: string[];
    onSignal?: () => Promise<any>;
    onShutdown?: () => Promise<any>;
    beforeShutdown?: () => Promise<any>;
    onSendFailureDuringShutdown?: () => Promise<any>;
    logger?: (msg: string, err: Error) => void;

    /** Deprecated. */
    onSigterm?: () => Promise<any>;
  }

  export class Terminus<T> {
    constructor(server: T, options?: TerminusOptions);
    getHealthStatus(url: string): Promise<HealthStatus>;
    server: T;
  }


}
