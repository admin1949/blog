## vue的双向绑定机制

1. vue2中使用Object.defineProperty来劫持数据，使用观察者模式来依赖收集和自动更新，简单原理如下

    ```javascript
    function walk(data) {
        for(const key in data) {
            defineProperty(data, key);
        }
    }
    function defineProperty(data, key) {
        let value = data[key];
        const dep = new Dep();
        Object.defineProperty(data, key, {
            get() {
                dep.depend();
                return value; 
            },
            set(newValue) {
                if (value === newValue) {
                    return;
                }
                value = newValue;
                dep.notify();
            }
        })
    }
    class Dep {
        static target = null;
    deps = [];
    depend() {
            if (Dep.target) {
                Dep.target.addDeps(this);
            }
        }
    notify() {
            this.deps.forEach(vm => vm.update());
        }
    }
    class Watcher {
        constructor(vm, update) {
            this.vm = vm;
            this._update = update;
            this.run();
        }
        addDeps(dep) {
            dep.deps.push(this);
        }
        update() {
            this._update();
        }
        run() {
            Dep.target = this;
            this.update();
            Dep.target = null;
        }
    }
    
    class Vue {
        constructor(options) {
            if (typeof options?.data === 'function') {
            this._data = options.data.call(this);    
            } else {
                this._data = options?.data || {};
            }
        walk(this._data);
        }
    mount() {
            new Watcher(this, () => this.render());
        }
    render() {
            console.log('render');
            document.body.innerText = `hellow the text is: ${this._data.text}`
        }
    }
    
    var vue = new Vue({
        data() {
            return {
                text: 23,
                text1: 12,
            }
        }
    });
    vue.mount();
    vue._data.text = 23334; // 界面更新
    vue._data.text1 = 21; // 界面不更新
    ```

    引入computed计算属性

    ```javascript
    function resolveComputed(data, computed, vm) {
        const dep = new Dep();
        for(const key in computed) {
            const handel = computed[key];
            Object.defineProperty(data, key, {
                get() {
                    dep.depend();
                    if (typeof handel === 'function') {
                        return handel.call(vm);
                    }
                    if (typeof handel.get === 'function') {
                        return handel.get.call(vm);
                    }
                },
                set(newValue) {
                    if (typeof handel?.set !== 'function') {
                        return;
                    }
                    handel.set.call(vm, newValue);
                    dep.notify();
                }
            })
        }
    }
    
    class Vue {
        constructor(options) {
            if (typeof options?.data === 'function') {
            this._data = options.data.call(this);    
            } else {
                this._data = options?.data || {};
            }
        walk(this._data);
        resolveComputed(this._data, options?.computed || {}, this);
        }
    mount() {
            new Watcher(this, () => this.render());
        }
    render() {
            console.log('render');
            document.body.innerText = `hellow the text is: ${this._data.text1}
    the computed value is: ${this._data.text3}`;
        }
    }
    var a = new Vue({
        data() {
            return {
                text1: 1,
                text2: 2,
            }
        },
        computed: {
        text3: {
            get() {
                return `${this._data.text1} join ${this._data.text2}`
            },
                set(val) {
                    this._data.text2 = val;
                }
        }
    }
    });
    a.mount();
    ```

    当我们尝试修改a._data.text3的值的时候，泛函render打印了2次，这是因为依赖收集了2次，所以我们需要改造watcher中的update函数，使其将当前更新函数推入一个更新队列去重，在不是直接调用函数

    ```javascript
    const queue = new Set;
    let isWaiting = false;
    
    function nextTick(cb) {
        queueMicrotask(cb);
    }
    
    function flushSchedulerQueue() {
        queue.forEach(cb => cb());
        queue.clear();
        isWaiting = false;
    }
    
    function queuUpdate(update) {
        queue.add(update);
        if (!isWaiting) {
            isWaiting = true;
            nextTick(flushSchedulerQueue);
        }
    }
    class Watcher {
        constructor(vm, update) {
            this.vm = vm;
            this._update = update;
            this.run();
        }
        addDeps(dep) {
            dep.deps.push(this);
        }
        update() {
            queuUpdate(this._update)
        }
        run() {
            Dep.target = this;
            this.update();
            Dep.target = null;
        }
    }
    ```

    添加watch属性

    ```javascript
    function resolveWatch(watchs, vm) {
        for(const key in watchs) {
            vm.$watch(key, watchs[key], {
                deep: false,
                immediate: false,
            })
        }
    }
    
    class Vue {
        constructor(options) {
            if (typeof options?.data === 'function') {
                this._data = options.data.call(this);    
        } else {
                this._data = options?.data || {};
            }
        walk(this._data);
        resolveWatch(options?.watch || {}, this);
            resolveComputed(this._data, options?.computed || {}, this);
        options?.created.call(this);
        }
        mount() {
            new Watcher(this, () => this.render());
        }
        render() {
            console.log('render');
            document.body.innerText = `hellow the text is: ${this._data.text1}
        the computed value is: ${this._data.text3}`;
        }
        $watch(expOrFn, callBack, options) {
            const self = this;
            const getValue = () => {
                if (typeof expOrFn === 'string') {
                    return this._data[expOrFn]
                } else if (typeof expOrFn === 'function') {
                    return expOrFn.call(self);
                }
            }
            let oldValue = getValue();
            new Watcher(this, () => {
                const newValue = getValue();
                if (!Object.is(newValue, oldValue)) {
                    callBack.call(this, newValue, oldValue);
                    oldValue = newValue;
                }
            })
        }
    }
    
    var a = new Vue({
        data() {
            return {
                text1: 1,
                text2: 2,
            }
        },
        computed: {
        text3: {
            get() {
                return `${this._data.text1} join ${this._data.text2}`
            },
                set(val) {
                    this._data.text2 = val;
                }
        }
    },
        watch: {
            text2(newValue, oldValue) {
                console.log(`text2 has changed from ${oldValue} to ${newValue}`);
            },
        },
        created() {
            this.$watch(function() {
                return this._data.text3;
            }, function (newValue, oldValue) {
                console.log(`text3 has changed from ${oldValue} to ${newValue}`);
            }, {
                deep: false,
                immediate: false,
            })
        }
    });
    a.mount();
    a._data.text2 = 1231;
    // text2 has changed from 2 to 1231
    // text3 has changed from 1 join 2 to 1 join 1231
    ```

    整理一下最终代码如下

    ```javascript
    function walk(data) {
        for(const key in data) {
            defineProperty(data, key);
        }
    }
    function defineProperty(data, key) {
        let value = data[key];
        const dep = new Dep();
        Object.defineProperty(data, key, {
            get() {
                dep.depend();
                return value; 
            },
            set(newValue) {
                if (value === newValue) {
                    return;
                }
                value = newValue;
                dep.notify();
            }
        })
    }
    class Dep {
        static target = null;
    deps = [];
    depend() {
            if (Dep.target) {
                Dep.target.addDeps(this);
            }
        }
    notify() {
            this.deps.forEach(vm => vm.update());
        }
    }
    
    var queue = new Set;
    var isWaiting = false;
    
    function nextTick(cb) {
        queueMicrotask(cb);
    }
    
    function flushSchedulerQueue() {
        queue.forEach(watcher => {
            watcher.run();
        });
        queue.clear();
        isWaiting = false;
    }
    
    function queuUpdate(update) {
        queue.add(update);
        if (!isWaiting) {
            isWaiting = true;
            nextTick(flushSchedulerQueue);
        }
    }
    class Watcher {
        constructor(vm, update) {
            this.vm = vm;
            this._update = update;
            this.update();
        }
        addDeps(dep) {
            dep.deps.push(this);
        }
        update() {
            queuUpdate(this);
        }
        run() {
            Dep.target = this;
            this._update();
            Dep.target = null;
        }
    }
    
    
    function resolveWatch(watchs, vm) {
        for(const key in watchs) {
            vm.$watch(key, watchs[key], {
                deep: false,
                immediate: false,
            })
        }
    }
    
    function resolveComputed(data, computed, vm) {
        const dep = new Dep();
        for(const key in computed) {
            const handel = computed[key];
            Object.defineProperty(data, key, {
                get() {
                    dep.depend();
                    if (typeof handel === 'function') {
                        return handel.call(vm);
                    }
                    if (typeof handel.get === 'function') {
                        return handel.get.call(vm);
                    }
                },
                set(newValue) {
                    if (typeof handel?.set !== 'function') {
                        return;
                    }
                    handel.set.call(vm, newValue);
                    dep.notify();
                }
            })
        }
    }
    
    class Vue {
        constructor(options) {
            if (typeof options?.data === 'function') {
                this._data = options.data.call(this);    
        } else {
                this._data = options?.data || {};
            }
        walk(this._data);
        resolveWatch(options?.watch || {}, this);
            resolveComputed(this._data, options?.computed || {}, this);
        options?.created.call(this);
        }
        mount() {
            new Watcher(this, () => this.render());
        }
        render() {
            console.log('render');
            document.body.innerText = `hellow the text is: ${this._data.text1}
        the computed value is: ${this._data.text3}`;
        }
        $watch(expOrFn, callBack, options) {
            const self = this;
            const getValue = () => {
                if (typeof expOrFn === 'string') {
                    return this._data[expOrFn]
                } else if (typeof expOrFn === 'function') {
                    return expOrFn.call(self);
                }
            }
            let oldValue = getValue();
            new Watcher(this, () => {
                const newValue = getValue();
                if (!Object.is(newValue, oldValue)) {
                    callBack.call(this, newValue, oldValue);
                    oldValue = newValue;
                }
            })
        }
    }
    
    var a = new Vue({
        data() {
            return {
                text1: 1,
                text2: 2,
            }
        },
        computed: {
        text3: {
            get() {
                return `${this._data.text1} join ${this._data.text2}`
            },
                set(val) {
                    this._data.text2 = val;
                }
        }
    },
        watch: {
            text2(newValue, oldValue) {
                console.log(`text2 has changed from ${oldValue} to ${newValue}`);
            },
        },
        created() {
            this.$watch(function() {
                return this._data.text3;
            }, function (newValue, oldValue) {
                console.log(`text3 has changed from ${oldValue} to ${newValue}`);
            }, {
                deep: false,
                immediate: false,
            })
        }
    });
    a.mount();
    a._data.text2 = 1231;
    // render
    // text2 has changed from 2 to 1231
    // text3 has changed from 1 join 2 to 1 join 1231
    ```