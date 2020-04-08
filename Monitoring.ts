export function Monitoring(target: any) {
    // save a reference to the original constructor
    const original = target;

    // a utility function to generate instances of a class
    function construct(constructor, __args) {
        const c: any = function () {
            return constructor.apply(__args);
        }
        c.prototype = constructor.prototype;

        return new Proxy(new constructor(...__args), {
            get(target, propKey, receiver) {
                const origMethod = target[propKey];
                if (typeof origMethod === 'function') {
                    return function (...args) {
                        try {
                            let result = origMethod.apply(this, args);
                            return result;
                        } catch (e) {
                            console.error(this.cCRAbstractViewController.constructor.name, args);
                           // throw new Error(e);
                        }
                    };
                } else {
                    return origMethod;
                }
            }
        });
    }

    // the new constructor behaviour
    const f: any = function (...args) {
        console.log("Monitor of: " + original.name);
        return construct(original, args);
    }

    // copy prototype so intanceof operator still works
    f.prototype = original.prototype;

    // return new constructor (will override original)
    return f;
} 
