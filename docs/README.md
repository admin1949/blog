# 记录一个Vue3中Message组件打包之后不能提前关闭的问题

组件Message.vue;

```vue
<template>
	<transition
    	name="message-fade"
        @before-leave="onClose"
        @after-leave="$emit('destory')"
     >
    	<div :style="{ top: `${top}px` }" v-show="visible" class="message-content">
            <slot>
    			{{ message }}
    		</slot>
        </div>
    </transition>

</template>
<script lang="ts" setup>
	import { ref, onMounted } from 'vue';
    defineProps<{
        message: string;
        onClose: () => void;
        top: number,
    }>();
    defineEmits<{
        (event: 'destory'): void
    }>();
    onMounted(() => {
        visible.value = true;
        setTimeout(() => {
            visible.value = false;
        }, 3000);
    })
    const visible = ref(false);
</script>
<style>
    .message-content{
        position: fixed;
        background-color: #eee;
        min-width: 320px;
        left: 50%;
        transform: translateX(-50%);
        transition: opacity .3s, transform .4s, top .4s;
        box-sizing: border-box;
        padding: 15px;
        border: 1px solid #ccc;
    }
    .message-fade-enter-from,
    .message-fade-leave-to {
        opacity: 0;
        transform: translate(-50%, -100%);
    }
</style>
```

实例方法文件index.ts

```typescript
import Message from './Message.vue';
import { createVNode, render, isVNode, VNode, ComponentPublicInstance } from 'vue';

const instances: { vm: VNode, id: string, close: () => void }[] = [];
const MAX_MSG_INSTANCE_NUM = 1;

let seed = 1;
export const openMessage = (msg: string | VNode) => {
    const id = `message_${seed++}`;

    const top = instances.reduce((num, item) => {
        return num + (item.vm.el?.offsetHeight || 0) + 16;
    }, 20 + 16);

    const options = {
        message: isVNode(msg) ? '' : msg,
        onClose: () => close(id),
        top: top,
    };

    const vm = createVNode(
    	Message,
        options,
        isVNode(msg) ? { default: () => msg } : null,
    );
    const container = document.createElement('div');
    vm.props!.onDestory = () => {
        render(null, container);
    }
    render(vm, container);
    const closeItem = () => {
        (vm.component!.proxy as ComponentPublicInstance<{ visible: boolean }>).visible = false;
    }
    instances.push({
        vm,
        id,
        close: closeItem,
    });

    if (instances.length > MAX_MSG_INSTANCE_NUM) {
        instances[0].close();
    }

    document.body.appendChild(container.firstChild!);

    return { close: closeItem };
}

const close = (id: string) => {
    const index = instances.findIndex((item) => id === item.id);
    if (index < 0) {
        return;
    }
    const { vm } = instances[index];
    const removeHeight = vm.el?.offsetHeight || 0;

    instances.splice(index, 1);
    instances.forEach(({vm}, idx) => {
        if (index > idx) {
            return;
        }
        const post = parseInt(vm.el?.style.top, 10) - removeHeight - 16;
        (vm.component?.props as {top: number}).top = post;
    });
}

```

业务代码Home.vue中

```vue
<template>
	<div>
        <button @click="showMessage">开启对话框</button>
    </div>
</template>
<script setup lang="ts">
	import { openMessage } from './index';
    let idx = 1;
    const showMessage = () => {
        openMessage(`消息${idx++}`);
    }
</script>
```

在开发环境中次代码没有问题，消息能正常显示，但是打包之后发现数量限制没有生效，是按照element-pluse的写法写的，调试之后发现

```javascript
vm.component.proxy // 开发环境下有子组件的值，打包之后没有子组件的属性
```

跟过vue的源码之后发现vue 在**exposeSetupStateOnRenderContext** 函数中将setup函数的返回值代理到ctx上，但是在打包之后并没有此步骤。

```javascript
  // dev only
  function exposeSetupStateOnRenderContext(instance) {
      const { ctx, setupState } = instance;
      Object.keys(toRaw(setupState)).forEach(key => {
          if (!setupState.__isScriptSetup) {
              if (key[0] === '$' || key[0] === '_') {
                  warn$1(`setup() return property ${JSON.stringify(key)} should not start with "$" or "_" ` +
                      `which are reserved prefixes for Vue internals.`);
                  return;
              }
              Object.defineProperty(ctx, key, {
                  enumerable: true,
                  configurable: true,
                  get: () => setupState[key],
                  set: NOOP
              });
          }
      });
  }

```

经过改造,使用defineExpose将关闭消息的能力提供给外部

```typescript
defineExpose({
    close: () => visible.value = false,
})
```

最终Message.vue

```vue
<template>
	<transition
    	name="message-fade"
        @before-leave="onClose"
        @after-leave="$emit('destory')"
     >
    	<div :style="{ top: `${top}px` }" v-show="visible" class="message-content">
            <slot>
    			{{ message }}
    		</slot>
        </div>
    </transition>

</template>
<script lang="ts" setup>
	import { ref, onMounted } from 'vue';
    defineProps<{
        message: string;
        onClose: () => void;
        top: number,
    }>();
    defineEmits<{
        (event: 'destory'): void
    }>();
    onMounted(() => {
        visible.value = true;
        setTimeout(() => {
            visible.value = false;
        }, 3000);
    });
    defineExpose({
        close: () => visible.value = false,
    });
    const visible = ref(false);
</script>
<style>
    .message-content{
        position: fixed;
        background-color: #eee;
        min-width: 320px;
        left: 50%;
        transform: translateX(-50%);
        transition: opacity .3s, transform .4s, top .4s;
        box-sizing: border-box;
        padding: 15px;
        border: 1px solid #ccc;
    }
    .message-fade-enter-from,
    .message-fade-leave-to {
        opacity: 0;
        transform: translate(-50%, -100%);
    }
</style>
```

实例方法文件

```typescript
import Message from './Message.vue';
import { createVNode, render, isVNode, VNode, ComponentPublicInstance } from 'vue';

const instances: { vm: VNode, id: string, close: () => void }[] = [];
const MAX_MSG_INSTANCE_NUM = 3;

let seed = 1;
export const openMessage = (msg: string | VNode) => {
    const id = `message_${seed++}`;

    const top = instances.reduce((num, item) => {
        return num + (item.vm.el?.offsetHeight || 0) + 16;
    }, 20 + 16);

    const options = {
        message: isVNode(msg) ? '' : msg,
        onClose: () => close(id),
        top: top,
    };

    const vm = createVNode(
    	Message,
        options,
        isVNode(msg) ? { default: () => msg } : null,
    );
    const container = document.createElement('div');
    vm.props!.onDestory = () => {
        render(null, container);
    }
    render(vm, container);
    const closeItem = () => {
        (vm.component!.exposed as ComponentPublicInstance<{ close: () => void }>).close();
    }
    instances.push({
        vm,
        id,
        close: closeItem,
    });

    if (instances.length > MAX_MSG_INSTANCE_NUM) {
        instances[0].close();
    }

    document.body.appendChild(container.firstChild!);

    return { close: closeItem };
}

const close = (id: string) => {
    const index = instances.findIndex((item) => id === item.id);
    if (index < 0) {
        return;
    }
    const { vm } = instances[index];
    const removeHeight = vm.el?.offsetHeight || 0;

    instances.splice(index, 1);
    instances.forEach(({vm}, idx) => {
        if (index > idx) {
            return;
        }
        const post = parseInt(vm.el?.style.top, 10) - removeHeight - 16;
        (vm.component?.props as {top: number}).top = post;
    });
}

```

最终打包之后也能正常运行，超过我们限制的数量之后就会自动关闭最先打开消息框

