/// <reference path="../Shadowrun.ts" />

declare namespace Shadowrun {
    export interface HostData extends
        DevicePartData,
        DescriptionPartData {
            rating: number,
            ic: SourceEntityField[]
    }
}