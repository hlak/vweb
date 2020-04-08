import { Type } from '@angular/core';
import { Router } from '@angular/router';
import { AppInjector, jsonSerializer, objecUtil } from 'src/app/app.module';
import { AuthenticationService } from 'src/app/authn/service/authentification.service';
import { SyncRequestHeader, SyncRequestService } from 'ts-sync-request';
import { EndPointService } from '../../services/endpoint/EndpointSerice';
import { CCRBasicDateUtil } from '@ccr/components/base/time/CCRBasicDateUtil';
import { CCRBasicCollectionUtil } from '@ccr/components/base/collection/CCRBasicCollectionUtil';
import { CCRSortedByValueHashMap } from '@ccr/components/base/map/CCRSortedByValueHashMap';
import { CCRSortedByValueMap } from '@ccr/components/base/map/CCRSortedByValueMap';

type methodType = 'DELETE' | 'GET' | 'HEAD' | 'POST' | 'PUT';
type WsParamType = 'PATH' | 'QUERY';
export type ReturnType = 'String' | 'Number' | 'Boolean' | 'Void' | 'SortedMap' | 'SortedSet' | 'Set' | 'Map' | 'List' | 'Date' | 'Timestamp' | 'Object' | 'CCRSortedByValueMap' | 'Array' | 'Bigdecimal' | 'Other';


export class WsRest<T> {
    type: Type<T>;
    proxyInstance: T;
    path: string;
    methods: WsMethod[] = [];
}

export class WsMethod {
    name: string;
    parameters: WsParam[] = [];
    type: methodType;
    path: string;
    returnType: ReturnType;
}

export class WsParam {
    name: string;
    index: number;
    type: WsParamType;
    require = true;
}


class CcrProxyHandler<T extends object> implements ProxyHandler<T> {
    constructor(private wsRest: WsRest<T>) {
    }
    get(target: any, propKey: string | number | symbol, receiver: any) {
        const targetValue = Reflect.get(target, propKey, receiver);
        target['__WSAPI__'] = this.wsRest;
        if (typeof targetValue === 'function') {
            return function (...args) {
                const values: Map<string, any> = new Map();
                const wsRest: WsRest<T> = target['__WSAPI__'];
                // const wsMethod: WsMethod = wsRest.methods.find(m => m.name === propKey);
                // args.forEach((arg, index: number) => {
                //     const queryparam: WsParam = wsMethod.queryparams.find(qp => qp.index === index);
                //     values.set(queryparam.name, arg);
                // });
                return CcrRestProxyService.invoke(wsRest, <string>propKey, args);
            }
        } else {
            return targetValue;
        }

    }
    
}

class CcrRestProxyService {
    static invoke<T>(wsRest: WsRest<T>, methodName: string, args: any[]): any {
        let relatifPath = wsRest.path;
        if (!objecUtil.isDefined(wsRest)) {
            throw new Error('Required wsRest was null or undefined.');
        }
        if (!objecUtil.isDefined(wsRest.path)) {
            throw new Error(`Required Path was null or undefined when calling ${wsRest.type}.`);
        }
        const wsMethod = wsRest.methods.find(m => m.name === methodName);
        if (!objecUtil.isDefined(wsMethod)) {
            throw new Error(`Required Method name was null or undefined when calling ${wsRest.type}.`);
        }

        relatifPath = relatifPath + wsMethod.path;
        const parameters = wsMethod.parameters;
        if (objecUtil.isDefined(parameters) && parameters.length > 0) {

            if (!objecUtil.isDefined(args) || args.length === 0) {
                throw new Error(`Required url parameters was null or undefined when calling ${wsRest.type}.${wsMethod.name}.`);
            }
            let newArgs = args;
            if (args.length > parameters.length) {
                newArgs = new Array(parameters.length);
                newArgs.push(args.slice(0, parameters.length - 2));
                newArgs.push(args.slice(parameters.length - 1));
            }
            let queryParameters = '';
            newArgs.forEach((arg, index) => {
                const parameter: WsParam = wsMethod.parameters.find(p => p.index === index);
                if (parameter.require && !objecUtil.isDefined(arg)) {
                    throw new Error(`Required parameter ${parameter.name} was null or undefined when calling ${wsRest.type}.${wsMethod.name}.`);
                }
                switch (parameter.type) {
                    case 'PATH': {
                        relatifPath = relatifPath.replace(`{${parameter.name}}`, arg);
                        break;
                    }
                    case 'QUERY': {
                        queryParameters = queryParameters.concat(`${parameter.name}=${arg}&`);
                        break;
                    }

                }
            });
            queryParameters = queryParameters.substr(0, queryParameters.lastIndexOf('&'));
            relatifPath = `${relatifPath}?${queryParameters}`;
        }
        const baseUrl = EndPointService.getBaseUrl(wsRest.type);
        let url = `${baseUrl}${relatifPath}`;
        if (relatifPath.startsWith('/') && baseUrl.endsWith('/')) {
            url = baseUrl.concat(relatifPath.substring(1));
        } else if (!relatifPath.startsWith('/') && !baseUrl.endsWith('/')) {
            url = `${baseUrl}/${relatifPath}`;
        }
        let headers: SyncRequestHeader[] = [];

        const authenticationService: AuthenticationService = AppInjector.get(AuthenticationService);
        const tokenAcces = authenticationService.getSynchroneTokenAs400();

        if (tokenAcces === '') {
            AppInjector.get(Router).navigateByUrl(`/login`);
        } else {
            // to determine the Accept header
            headers.push(new SyncRequestHeader('Accept', 'application/json'));
            headers.push(new SyncRequestHeader('Authorization', `Bearer ${tokenAcces}`));
            const wsMethod: WsMethod = wsRest.methods.find(m => m.name === methodName);
            let result = null;
            switch (wsMethod.type) {
                case 'DELETE':
                    result = new SyncRequestService().delete(url, headers);
                    break;
                case 'GET':
                    result = new SyncRequestService().get(url, headers);
                    break;
                case 'HEAD':
                    //resul = new SyncRequestService().<R>(url, headers);
                    break;
                case 'POST':
                    const object = jsonSerializer.serialize(args[0]);
                    result = new SyncRequestService().post(url, object, headers);
                    break;
                case 'PUT':
                     const objectPut = args[0];
                    new SyncRequestService().put(url, jsonSerializer.serialize(objectPut), headers);
                    result = args[0];
                    break;
            }
            return jsonSerializer.deserialize(result, wsMethod.returnType); // FXIME
        }
    }
   

    static get<T, R>(wsRest: WsRest<T>, methodName: string, urlValueParameters: Map<string, any>): R {
        if (!objecUtil.isDefined(wsRest)) {
            throw new Error('Required wsRest was null or undefined.');
        }
        if (!objecUtil.isDefined(wsRest.path)) {
            throw new Error(`Required Path was null or undefined when calling ${wsRest.type}.`);
        }
        const wsMethod = wsRest.methods.find(m => m.name === methodName);
        if (!objecUtil.isDefined(wsMethod)) {
            throw new Error(`Required Method name was null or undefined when calling ${wsRest.type}.`);
        }
        let queryParameters = '';
        if (objecUtil.isDefined(wsMethod.parameters) && !objecUtil.isDefined(urlValueParameters)) {
            throw new Error(`Required parameter url parameters was null or undefined when calling ${wsRest.type}.${wsMethod.name}.`);
        }
        urlValueParameters.forEach((v, k) => {
            if (!objecUtil.isDefined(v)) {
                throw new Error(`Required parameter ${k} was null or undefined when calling ${wsRest.type}.${wsMethod.name}.`);
            }
            queryParameters = queryParameters.concat(`${k}=${v}&`);
        });
        queryParameters = queryParameters.substr(0, queryParameters.lastIndexOf('&'))
        let headers: SyncRequestHeader[] = [];

        const authenticationService: AuthenticationService = AppInjector.get(AuthenticationService);
        const tokenAcces = authenticationService.getSynchroneTokenAs400();
        if (tokenAcces === '') {
            AppInjector.get(Router).navigateByUrl(`/login`);
        } else {
            // to determine the Accept header
            headers.push(new SyncRequestHeader('Accept', 'application/json'));
            headers.push(new SyncRequestHeader('Authorization', `Bearer ${tokenAcces}`));
            return new SyncRequestService().get<R>(`${wsRest.path}?${queryParameters.toString()}`, headers);
        }
    }

}


export class CcrRestClientApi {

    static addParamToWsMethod<T extends object>(wsType: Type<T>, methodName: string, queryParamName: string, parameterIndex: number, type: WsParamType) {
        const quryParam: WsParam = new WsParam();
        quryParam.name = queryParamName;
        quryParam.index = parameterIndex;
        quryParam.type = type;
        this.getMethod(wsType, methodName).parameters.push(quryParam);
    }
    private static WS: Map<Type<any>, WsRest<any>> = new Map();

    private static WS_BY_NAME: Map<string, WsRest<any>> = null;

    public static addPathToWs<T>(wsType: Type<T>, path: string) {
        this.WS.get(wsType).path = path;
    }
    public static addPathToWsMethod<T extends object>(wsType: Type<T>, name: string, path: string) {
        const wsMethod: WsMethod = this.getMethod(wsType, name);
        wsMethod.path = path;
    }
    public static addTypeToWsMethod<T extends object>(wsType: Type<T>, name: string, type: methodType) {
        const wsMethod: WsMethod = this.getMethod(wsType, name);
        wsMethod.type = type;
    }
    static addReturnTypeToWsMethod<T extends object>(wsType: Type<T>, name: string, value: ReturnType) {
        const wsMethod: WsMethod = this.getMethod(wsType, name);
        wsMethod.returnType = value;
    }

    public static getWsApi<T>(wsType: Type<T>): WsRest<T> {
        return this.WS.get(wsType);
    }

    public static getWsApiByName<T>(wsType: string): WsRest<T> {
        if (this.WS_BY_NAME === null) {
            this.WS_BY_NAME = new Map();
            this.WS.forEach((v, k) => {
                if (k['__class'] !== undefined) {
                    this.WS_BY_NAME.set(k['__class'], v);
                } else {
                    console.warn('This service [' + k + '] doesn\'t __class attribut');
                }
            })
        }
        return this.WS_BY_NAME.get(wsType);
    }
    private static getWs<T extends object>(wsType: Type<T>): WsRest<T> {
        let wsRest: WsRest<T> = this.WS.get(wsType);
        if (wsRest === undefined) {
            wsRest = new WsRest();
            wsRest.type = wsType;
            this.WS.set(wsType, wsRest);
            wsRest.proxyInstance = new Proxy(new wsType, new CcrProxyHandler(wsRest));
        }
        return wsRest;
    }
    private static getMethod<T extends object>(wsType: Type<T>, methodName: string): WsMethod {
        const wsRest: WsRest<T> = this.getWs(wsType);
        let wsMethod: WsMethod = wsRest.methods.find(m => m.name === methodName);
        if (wsMethod === undefined) {
            wsMethod = new WsMethod();
            wsRest.methods.push(wsMethod);
            wsMethod.name = methodName;
        }
        return wsMethod;
    }
}