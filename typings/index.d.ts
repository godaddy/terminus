declare module "@godaddy/terminus" {
  export interface TerminusState {
    isShuttingDown: boolean;
  }

  export type HealthCheck = ({ state }: { state: TerminusState }) => Promise<any>;

  export class HealthCheckError extends Error {
    constructor(message: string, causes: any);
    public causes: any;
  }

  export type HealthCheckMap = {
    verbatim?: boolean;
    __unsafeExposeStackTraces?: boolean;
    [key: string]: HealthCheck | boolean | undefined;
  };

  export interface TerminusOptions {
    healthChecks?: HealthCheckMap;
    caseInsensitive?: boolean;
    timeout?: number;
    signal?: string;
    signals?: string[];
    sendFailuresDuringShutdown?: boolean;
    statusOk?: number,
    statusOkResponse?: Record<string, unknown>,
    statusError?: number,
    statusErrorResponse?: Record<string, unknown>,
    useExit0?: boolean,
    onSignal?: (signal: string) => Promise<any>;
    onSendFailureDuringShutdown?: () => Promise<any>;
    onShutdown?: () => Promise<any>;
    beforeShutdown?: () => Promise<any>;
    logger?: (msg: string, err: Error) => void;
    headers?:{ [key: string]: string };

    /** Deprecated. */
    onSigterm?: () => Promise<any>;
  }

  export type Terminus = <T>(server: T, options?: TerminusOptions) => T;

  export const createTerminus: Terminus;
}
