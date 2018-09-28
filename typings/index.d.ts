declare module "@godaddy/terminus" {

  export type HealthCheck = () => Promise<any>;

  export class HealthCheckError extends Error {
    constructor(message: string, causes: any);
    public causes: string;
  }

  export interface HealthCheckMap {
    [key: string]: HealthCheck;
  }

  export interface TerminusOptions {
    healthChecks?: HealthCheckMap;
    timeout?: number;
    signal?: string;
    signals?: string[];
    onSignal?: () => Promise<any>;
    onShutdown?: () => Promise<any>;
    beforeShutdown?: () => Promise<any>;
    logger?: (msg: string, err: Error) => void;

    /** Deprecated. */
    onSigterm?: () => Promise<any>;
  }

  export type Terminus = <T>(server: T, options?: TerminusOptions) => T;

  export const createTerminus: Terminus;

}
