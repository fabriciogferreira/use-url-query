type ConfigBase = {
    withEmpty?: boolean;
    isOrderMatter?: boolean;
};
type ConfigGrouped = ConfigBase & {
    group: true;
};
type ConfigUngrouped = ConfigBase & {
    group?: false;
};
export declare function combinations<F, S>(arry: [F[], S[]], config: ConfigGrouped): (F | S)[][][];
export declare function combinations<F, S>(arry: [F[], S[]], config?: ConfigUngrouped): (F | S)[][];
type configPowerSet = {
    removeEmpty?: boolean;
    withSizes?: number | Array<number> | {
        min: number;
        max: number;
    } | {
        min: number;
    } | {
        max: number;
    };
    isOrderMatter?: boolean;
};
export declare function powerSet<T>(array: T[], config?: configPowerSet): T[][];
export {};
