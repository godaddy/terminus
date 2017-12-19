declare module "@godaddy/terminus" {

   type HealthCheck = () => Promise<any>;

  interface HealthCheckMap {
    [key: string]: HealthCheck;
  }

  interface TerminusOptions {
    healthChecks?: HealthCheckMap;
    timeout?: number;
    signal?: string;
    onSignal?: () => Promise<any>;
    onShutdown?: () => Promise<any>;
    logger?: (msg: string, err: Error) => void;

    /** Deprecated. */
    onSigterm?: () => Promise<any>;
  }

  type Terminus = <T>(server: T, options?: TerminusOptions) => T;

  const terminus: Terminus;

  export = terminus;
}
