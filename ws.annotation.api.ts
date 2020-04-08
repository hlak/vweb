import { CcrRestClientApi, ReturnType } from '../rest/ccr.rest.service';

export function Path(value: string) {
    return function (target: any | Function, propertyKey?: string, descriptor?: PropertyDescriptor) {
        if (typeof target === 'function') {
            CcrRestClientApi.addPathToWs(target.prototype.constructor, value);
        } else {
            CcrRestClientApi.addPathToWsMethod(target.constructor, propertyKey, value);
        }
    };
}


export function PathParam(value: string) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        CcrRestClientApi.addParamToWsMethod(target.constructor, propertyKey, value, parameterIndex, 'PATH');
    };
}

export function ReturnType(value: ReturnType) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        CcrRestClientApi.addReturnTypeToWsMethod(target.constructor, propertyKey, value);
    };
}

export function GET() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        CcrRestClientApi.addTypeToWsMethod(target.constructor, propertyKey, 'GET');
    };
}

export function POST() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        CcrRestClientApi.addTypeToWsMethod(target.constructor, propertyKey, 'POST');
    };
}
export function HEAD() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        CcrRestClientApi.addTypeToWsMethod(target.constructor, propertyKey, 'HEAD');
    };
}
export function DELETE() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        CcrRestClientApi.addTypeToWsMethod(target.constructor, propertyKey, 'DELETE');
    };
}

export function PUT() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        CcrRestClientApi.addTypeToWsMethod(target.constructor, propertyKey, 'PUT');
    };
}
export function QueryParam(value: string) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        CcrRestClientApi.addParamToWsMethod(target.constructor, <any>propertyKey, value, parameterIndex, 'QUERY');
    };
}



var STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func) {
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null)
        result = [];
    return result;
}