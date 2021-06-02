declare module "@godaddy/terminus" {
  export type HealthCheck = () => Promise<any>;

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
    statusError?: number,
    onSignal?: () => Promise<any>;
    onSendFailureDuringShutdown?: () => Promise<any>;
    onShutdown?: () => Promise<any>;
    beforeShutdown?: () => Promise<any>;
    logger?: (msg: string, err: Error) => void;

    /** Deprecated. */
    onSigterm?: () => Promise<any>;
  }

  export type Terminus = <T>(server: T, options?: TerminusOptions) => T;

  export const createTerminus: Terminus;
}
