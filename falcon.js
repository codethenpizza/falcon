export function Falcon(config) {
    let signals = {};

    let Dep = {
        target: null,
        subs: {},

        depend(deps, dep) {
            if (!deps.includes(this.target)) {
                deps.push(this.target)
            }

            if (!Dep.subs[this.target].includes(dep)) {
                Dep.subs[this.target].push(dep)
            }
        },
        getValidDeps(deps, key) {
            // removing dead dependencies that were not used during last computation
            return deps.filter(dep => this.subs[dep].includes(key))
        },
        notifyDeps (deps) {
            deps.forEach(notify)
        }

    }

    observeData(config.data)
    subscribeWatchers(config.watch, config.data)

    return {
        data: config.data,
        observe,
        notify
    }

    function makeReactive(obj, key) {
        let deps = []
        let val = obj[key]

        Object.defineProperty(obj, key, {
            get() {
                if (Dep.target) {
                    Dep.depend(deps, key)
                }
                return val
            },
            set(newVal) {
                val = newVal
                deps = Dep.getValidDeps(deps, key)
                Dep.notifyDeps(deps, key)
                notify(key)
            }
        })
    }

    function makeComputed(obj, key, computeFunc) {
        let cache = null
        let deps = []

        observe(key, () => {
            cache = null

            deps = Dep.getValidDeps(deps, key)
            Dep.notifyDeps(deps, key)
        })

        Object.defineProperty(obj, key, {
            get() {
                if (Dep.target) {
                    Dep.depend(deps, key)
                }
                Dep.target = key

                if (!cache) {
                    Dep.subs[key] = [];
                    cache = computeFunc.call(obj)
                }

                Dep.target = null
                return cache
            },
            set() {
                // Do nothing
            }
        })
    }

    function observe(property, signalHandler) {
        if (!signals[property]) {
            signals[property] = [];
        }

        signals[property].push(signalHandler);
    }

    function observeData(data) {
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                if (typeof data[key] === 'function') {
                    makeComputed(data, key, data[key])
                } else {
                    makeReactive(data, key)
                }
            }
        }
        parseDom(document.body, data)
    }

    function notify(signal) {
        if (!signals[signal] || signals[signal].length < 1) {
            return;
        }
        signals[signal].forEach((signalHandler) => signalHandler());
    }

    function parseDom(node, observable) {
        const nodes = document.querySelectorAll('[f-text]');
        const inputs = document.querySelectorAll('[f-model]')

        nodes.forEach(node => {
            sync('textContent', node, observable, node.attributes['f-text'].value)
        })

        inputs.forEach(input => {
            sync('value', input, observable, input.attributes['f-model'].value)
        })
    }

    function sync(attr, node, observable, property) {
        node[attr] = observable[property]
        observe(property, () => node[attr] = observable[property])
    }

    function subscribeWatchers(watchers, context) {
        for (let key in watchers) {
            if (watchers.hasOwnProperty(key)) {
                observe(key, watchers[key].bind(context))
            }
        }
    }
}