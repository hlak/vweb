import { Type } from '@angular/core';
import { CcrRestClientApi } from 'src/app/shared/util/rest/ccr.rest.service';

/**
 * Permet de r�cup�rer par un appel statique un service N-Tiers (interface). Selon l'impl�mentation choisie dans le contexte, le service renvoy� peut effectuer des appels Java direct ou des appels
 * REST.
 * Pour fonctionner, une et une seule impl�mentation de l'interface {@link CCRProxyServiceInterface} doit �tre disponible dans le classpath.
 * @class
 */
export class CCRProxyServices {






    public static getService<T>(clazz: Type<T> | string): T {
        if (clazz !== undefined && clazz !== null) {
            if (typeof clazz === 'string') {
                return <T> CcrRestClientApi.getWsApiByName(clazz).proxyInstance;
            } else {
                return CcrRestClientApi.getWsApi(clazz).proxyInstance;
            }
        }
    }
}
CCRProxyServices["__class"] = "ccr.framework.ntiers.shared.utils.CCRProxyServices";


