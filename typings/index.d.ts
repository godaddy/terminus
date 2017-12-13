declare module "@godaddy/terminus" {

    type HealthCheck = () => Promise<any>;

    interface HealthCheckMap {
        [key: string]: HealthCheck;
    }

    interface TerminusOptions {
        healthChecks?: HealthCheckMap;
        onHealthCheck?: HealthCheck;
        timeout?: number;
        onSigterm?: () => Promise<any>;
        onShutdown?: () => Promise<any>;
        logger?: (msg: string, err: Error) => void;
    }

    type Terminus = <T>(server: T, options?: TerminusOptions) => T;

    const terminus: Terminus;

    export = terminus;
}
