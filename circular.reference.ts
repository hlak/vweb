import { objecUtil } from 'src/app/app.module';
export const CIRCULAR_PROPERTY_NMAE = '__CIRCULAR_PROPERTY__'

// export interface CircularInfo {
//     target: Function,
//     field: string,
//     source: Function
// }

export interface CircularInfo {
    sourceFild: string,
    targetField: string,
    target?: any
}

export function Circular(circularInfo: CircularInfo | CircularInfo[]) {
    return function (target: any) {
        registerCircular(target, circularInfo);
    }
}

function registerCircular<T>(target: any, circularInfo: CircularInfo | CircularInfo[]) {
    Object.defineProperty(target, CIRCULAR_PROPERTY_NMAE, {
        value: circularInfo
    });
}

export function getCircularProperties(target: any): CircularInfo[] {
    const circularProperties: CircularInfo[] = [];

    if (target[CIRCULAR_PROPERTY_NMAE]) {
        if (Array.isArray(target[CIRCULAR_PROPERTY_NMAE])) {
            circularProperties.push(...target[CIRCULAR_PROPERTY_NMAE]);
        } else {
            circularProperties.push(target[CIRCULAR_PROPERTY_NMAE]);
        };
    }
    if (target.__proto__) {
        circularProperties.push(...getCircularProperties(target.__proto__));
    }

    return circularProperties;
}