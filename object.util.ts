
import { Type, Injectable } from '@angular/core';
//import { readdirSync } from 'fs';
import * as dto from './index';
import { BigDecimal } from '@BigDecimal';
import { CCRClassUtil } from '@ccr/components/base/lang/CCRClassUtil';
import { CCRAbstractEntityDto } from '@ccr/framework/ntiers/shared/dto/CCRAbstractEntityDto';
@Injectable({
    providedIn: 'root'
})
export class ObjecUtil {
	isBigdecimal(obj: any): boolean {
		return  this.isDefined(obj) && obj instanceof BigDecimal ? true : false;
	}

    public isDefined(obj: any): boolean {
        return obj === undefined || obj === null ? false : true;
    }
    public isString(obj: any): boolean {
        return this.isDefined(obj) && typeof obj === 'string' ? true : false;
    }
    public isNumber(obj: any): boolean {
        return this.isDefined(obj) && typeof obj === 'number' && obj.constructor.name === 'Number' ? true : false;
    }
    public isBoolean(obj: any): boolean {
        return this.isDefined(obj) && typeof obj === 'boolean' ? true : false;
    }
    public isFunction(obj: any): boolean {
        return this.isDefined(obj) && typeof obj === 'function' ? true : false;
    }
    public isObject(obj: any): boolean {
        return this.isDefined(obj) && typeof obj === 'object' ? true : false;
    }
    public isTsDate(obj: any): boolean {
        return this.isObject(obj) && obj.constructor.name === 'Date' ? true : false;
    }
    public isArray(obj: any): boolean {
        return this.isObject(obj) && Array.isArray(obj) ? true : false;
    }

    public isMap(obj: any): boolean {
        return this.isObject(obj) && this.isObject(obj.constructor["__interfaces"]) && obj.constructor["__interfaces"].indexOf("java.util.Map") >= 0 ? true : false;
    }

    public isList(obj: any): boolean {
        return this.isObject(obj) && this.isObject(obj.constructor['__interfaces']) && obj.constructor["__interfaces"].indexOf("java.util.List")>= 0 ? true : false;
    }

    public isCollection(obj: any): boolean {
        return this.isObject(obj) && this.isObject(obj.constructor["__interfaces"]) && obj.constructor["__interfaces"].indexOf("java.util.Collection")>= 0 ? true : false;
    }

    public isSet(obj: any): boolean {
        return this.isObject(obj) && this.isObject(obj.constructor["__interfaces"]) && obj.constructor["__interfaces"].indexOf("java.util.Set")>= 0 ? true : false;
    }

    public isSortedMap(obj: any): boolean {
        return this.isObject(obj) && this.isObject(obj.constructor["__interfaces"]) && obj.constructor["__interfaces"].indexOf("java.util.SortedMap")>= 0 ? true : false;
    }
    public isCCRSortedByValueMap(obj: any): boolean {
        return this.isObject(obj) && CCRClassUtil.isInstanceOfInterface(obj, 'ccr.components.base.map.CCRSortedByValueMap');
    }
    

    public isSortedSet(obj: any): boolean {
        return this.isObject(obj) && this.isObject(obj.constructor["__interfaces"]) && obj.constructor["__interfaces"].indexOf("java.util.SortedSet")>= 0 ? true : false;
    }

    public isDate(obj: any): boolean {
        return this.isObject(obj) && this.isDefined(obj.constructor["__class"]) && obj.constructor["__class"] === "java.util.Date" ? true : false;
    }
    public isTimestamp(obj: any): boolean {
        return this.isObject(obj) && this.isDefined(obj.constructor["__class"]) && obj.constructor["__class"] === " java.sql.Timestamp" ? true : false;
    }
   

    public isCcrObject(json: any): boolean {
        // if (this.isObject(obj)) {
        // if (Array.isArray(obj)) {
        // if (this.isDefined(obj[0])) {
        // return this.isCcrObject(obj[0]);
        // }
        // } else if (this.hasClassAttribute(obj)) {
        // return true;
        // }
        // }
        if (this.isObject(json) && this.hasClassAttribute(json)) {
            return true;
        }
        return false;
    }
    public isInstanceCcrObject(object: any): boolean {
        // if (this.isObject(obj)) {
        // if (Array.isArray(obj)) {
        // if (this.isDefined(obj[0])) {
        // return this.isCcrObject(obj[0]);
        // }
        // } else if (this.hasClassAttribute(obj)) {
        // return true;
        // }
        // }
        if (this.isObject(object) && CCRClassUtil.isInstanceOfInterface(object, 'ccr.framework.ntiers.shared.dto.CCRDto')) {
            return true;
        }
        return false;
    }

    private hasClassAttribute(obj: any): boolean {
        return this.hasAttribute(obj, '@class');
    }

    private hasAttribute(obj: any, attribute: string): boolean {
        return obj[attribute] === undefined ? false : true;
    }

}

@Injectable({
    providedIn: 'root'
})
export class InstanceLoader {

    classesChache: Map<string, Type<any>> = new Map();

    constructor(private objecUtil: ObjecUtil) {

    }
    public getInstanceOfCcrObject(json: any): any {
        if (this.objecUtil.isCcrObject(json)) {
            return this.getInstance(json['@class']);
        }else if (this.objecUtil.isInstanceCcrObject(json)){
            let type: Type<any> = this.classesChache.get(json.constructor['__class']);
            if (type) {
                return new type;
            }
            type = new json.constructor;
            this.classesChache.set(name, type);
        }
        return json;
    }

    private getInstance(name: string): any {
        let type: Type<any> = this.classesChache.get(name);
        if (type) {
            return new type;
        }
        const className = name.substr(name.lastIndexOf('.') + 1);
        //const packageName: string = name.substr(0, name.lastIndexOf('.')).split('.').join('_');
        const packageName: string = name.split('_').join('__').split('.').join('_');
        type = dto[packageName][className];
        this.classesChache.set(name, type);
        return new type;
    }
}
