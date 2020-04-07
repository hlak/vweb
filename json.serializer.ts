import { Injectable } from '@angular/core';
import { BigDecimal } from '@BigDecimal';
import { CCRSortedByValueHashMap } from '@ccr/components/base/map/CCRSortedByValueHashMap';
import { CCRBasicDateUtil } from '@ccr/components/base/time/CCRBasicDateUtil';
import { InstanceLoader, ObjecUtil } from '../object.util';
import { ReturnType } from '../rest/ccr.rest.service';
import { CircularInfo, getCircularProperties } from './circular.reference';

@Injectable({
	providedIn: 'root'
})
export class JsonSerialzer {

	constructor(private instanceLoader: InstanceLoader, private objecUtil: ObjecUtil) {

	}
	public deserialize(object: any, returnType?: ReturnType): any {
		if (!object) {
			return object;
		}
		const instance = this.instanceLoader.getInstanceOfCcrObject(object);
		return this.jsonToNewInstance(object, instance, returnType ?? this.getReturnType(object, instance));
	}

	public serialize<T>(object: T, returnType?: ReturnType): T {
		if (!object) {
			return object;
		}
		const instance = this.instanceLoader.getInstanceOfCcrObject(object);
		return this.toJson(object, instance, new Map(), returnType ?? this.getReturnType(object, object));
	}


	// public deserializeff<T>(object: T, clazz: Type<T>): T {
	// 	return this.jsonToNewInstance(object, new clazz);
	// }

	private jsonToNewInstance(object: any, newInstance: any, returnType: ReturnType): any {
		switch (returnType) {
			case 'Boolean':
			case 'Number':
			case 'String':
				return object;
			case 'Date':
				return CCRBasicDateUtil.asDate$java_lang_String(<string>object);
			case 'Timestamp':
				return CCRBasicDateUtil.asTimestamp(object);
			case "SortedMap":
				return this.setSortedMap(object);
			case "SortedSet":
				return this.setSortedSet(object);
			case "Set":
				return this.setSet(object);
			case "Map":
				return this.setMap(object);
			case "List":
			case "Array":
				return this.setList(object);
			case "Object":
				Object.keys(object).forEach(element => {
					const rt = this.getReturnType(object[element], newInstance[element]);
					newInstance[element] = this.deserialize(object[element], rt)
				});
				break;
			case "CCRSortedByValueMap":
				return this.toCCRSortedByValueMap(object);
			case "Bigdecimal":
				return this.setBigDecimal(object);
			case "Other":
				return this.setMap(object);

		}
		return newInstance;
	}

	private getReturnType(json: any, instance: any): ReturnType {
		if (this.objecUtil.isCCRSortedByValueMap(instance)) {
			return 'CCRSortedByValueMap';
		} else if (this.objecUtil.isSortedMap(instance)) {
			return 'SortedMap';
		} else if (this.objecUtil.isSortedSet(instance)) {
			return 'SortedSet';
		} else if (this.objecUtil.isSet(instance)) {
			return 'Set';
		} else if (this.objecUtil.isMap(instance)) {
			return 'Map';
		} else if (this.objecUtil.isList(instance)) {
			return 'List';
		} else if (this.objecUtil.isDate(instance)) {
			return 'Date';
		} else if (this.objecUtil.isTimestamp(instance)) {
			return 'Timestamp';
		} else if (this.objecUtil.isBigdecimal(instance)) {
			return 'Bigdecimal';
		} else if (this.objecUtil.isArray(json)) {
			return 'Array';
		} if (typeof json === 'boolean') {
			return 'Boolean';
		} if (typeof json === 'number') {
			return 'Number';
		} if (typeof json === 'string') {
			return 'String';
		} else if (this.objecUtil.isCcrObject(json) || this.objecUtil.isInstanceCcrObject(instance) ) {
			return 'Object';
		}
		return 'Other';
	}



	toJson(object: any, instance: any, circularProperties: Map<any, CircularInfo[]>, returnType: ReturnType): any {
		if (!object) {
			return object;
		}
		switch (returnType) {
			case 'Boolean':
			case 'Number':
			case 'String':
			case 'Array':
				return object;
			case 'Date':
				return CCRBasicDateUtil.printStringDBM$java_util_Date(object);
			case 'Timestamp':
				return CCRBasicDateUtil.printStringDBM$java_sql_Timestamp(object);
			case "List":
			case "Set":
			case "SortedSet":
				return this.collectionToJson(object, circularProperties);
			case "SortedMap":
			case "Map":
			case 'CCRSortedByValueMap':
				return this.mapToJson(object, circularProperties);
			case "Object":
				let cp = getCircularProperties(object.constructor);
				const fieldsCircular: string[] = [];
				for (const v of cp) {
					if (object[v.sourceFild] && this.exists(object[v.sourceFild].constructor, circularProperties)) {
						instance[v.sourceFild] = object[v.sourceFild][v.targetField];
						fieldsCircular.push(v.sourceFild);
					}
				}

				circularProperties.set(object.constructor, cp);

				Object.keys(object).forEach(element => {
					if (fieldsCircular.findIndex(v => v === element) === -1) {
						const instanceElement = this.instanceLoader.getInstanceOfCcrObject(object[element]);
						const rt = this.getReturnType(object[element], instanceElement);
						instance[element] = this.toJson(object[element], instanceElement, circularProperties, rt);
					}
				});
				break;
			case "Bigdecimal":
				return this.bigDecimalToJson(object);
			case "Other":
				return object; //FIXME HLA

		}
		return instance;
	}
	bigDecimalToJson(object: BigDecimal): number {
		return object ? parseFloat(object.toFixed(2)) : undefined;
	}


	mapToJson<T>(object: java.util.Map<any, any>, circularProperties: Map<any, CircularInfo[]>): any {
		const res = {};
		if (object?.size() ?? 0 > 0) {
			object.entrySet().forEach(entry => {
				const instance = this.instanceLoader.getInstanceOfCcrObject(entry.getValue());
				res[entry.getKey()] = this.toJson(entry.getValue(), instance, circularProperties, this.getReturnType(entry.getValue(), instance));
			});
		}
		return res;
	}

	collectionToJson<T>(object: java.util.Collection<any>, circularProperties: Map<any, CircularInfo[]>): any[] {
		let anArray: any[] = null;
		if (object?.size() ?? 0 > 0) {
			anArray = []
			object.forEach(element => {
				const instance = this.instanceLoader.getInstanceOfCcrObject(element);
				anArray.push(this.toJson(element, instance, circularProperties, this.getReturnType(element, instance)))
			});
		}
		return anArray;
	}




	private toCCRSortedByValueMap(object: any): CCRSortedByValueHashMap<any, any> {
		const sMap = new CCRSortedByValueHashMap();
		Object.keys(object).forEach(element => sMap.put(this.deserialize(element), this.deserialize(object[element])));
		return sMap;
	}

	setBigDecimal(object: any): BigDecimal {
		return new BigDecimal(object);
	}

	setSortedSet(object: any): java.util.TreeSet<any> {
		const set = new java.util.TreeSet();
		object?.forEach(element => set.add(this.deserialize(element)));
		return set;
	}
	setSortedMap<T>(object: any): java.util.TreeMap<any, any> {
		const set = new java.util.TreeMap();
		Object.keys(object).forEach(element => set.put(this.deserialize(element), this.deserialize(object[element])));
		return set;
	}
	setArray(object: any): any[] {
		return object?.map(element => this.deserialize(element));
	}

	setSet(object: any): java.util.LinkedHashSet<any> {
		const set = new java.util.LinkedHashSet();
		object?.forEach(element => set.add(this.deserialize(element)));
		return set;
	}
	setList(object: any): java.util.ArrayList<any> {
		const list = new java.util.ArrayList();
		object?.forEach(element => list.add(this.deserialize(element)));
		return list;
	}
	setMap(object: any): java.util.HashMap<any, any> {
		const set = new java.util.HashMap();
		Object.keys(object).forEach(element => set.put(this.deserialize(element), this.deserialize(object[element])));
		return set;
	}


	removerCircilarReference(object: any, circularProperties: Map<any, CircularInfo[]>) {
		if (!object) {
			return object;
		}
		const returnType = this.getReturnType(object, object);
		switch (returnType) {
			case 'Boolean':
			case 'Number':
			case 'String':
			case 'Date':
			case 'Timestamp':
			case "Bigdecimal":
			case "Other":
				return object;
			case 'Array':
			case "List":
			case "Set":
			case "SortedSet":
				object?.forEach(element => this.removerCircilarReference(element, circularProperties));
				return object;
			case "SortedMap":
			case "Map":
			case 'CCRSortedByValueMap':
				object?.entrySet().forEach(entry => this.removerCircilarReference(entry.getValue(), circularProperties));
				return object;
			case "Object":

				let cp = getCircularProperties(object.constructor);
				for (const v of cp) {
					if (object[v.sourceFild] && this.exists(object[v.sourceFild].constructor, circularProperties)) {
						object[v.sourceFild] = object[v.sourceFild][v.targetField];
						break;
					}
				}

				circularProperties.set(object.constructor, cp);

				Object.keys(object).forEach(element => {
					object[element] = object[element] ? this.removerCircilarReference(object[element], circularProperties) : undefined;
				});
				return object;

		}

	}
	exists(type: any, circularProperties: Map<any, CircularInfo[]>): boolean {
		if (circularProperties.has(type)) {
			return true;
		} else {
			if (type['__proto_']) {
				return this.exists(type['__proto_'], circularProperties);
			}
		}
		return false;

	}

}


export function classDecorator<T extends { new(...args: any[]): {} }>(constructor: T) {
	return class extends constructor {
		clazz: new () => T = constructor.apply(this).constructor.prototype;
	};
}