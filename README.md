# 页面搭建平台脚手架

## 简介

在基于 `lowcode-engine` 拓展编辑器功能。脚手架将会从 仓库中拉取组件/插件/设置器相关模板到本地

## 安装



## 使用

```
create-element
```

选择对应的元素类型，即可完成创建

- 组件/物料（component）
- 设置器（setter）
- 插件（plugin）
- 编辑器（editor）

## 本地环境调试

```
cd your-element-name
npm install
npm start
```

## 脚手架本地开发

```
npm install
npm link

cd your-element-name
create-element
```

## 脚手架构建

```
npm run build
```

## 在页面搭建平台中调试组件/插件/设置器

> 在启动组件/插件/设置器项目后，直接在已有的页面搭建平台就可以调试，不需要`npm link` 或者修改`npm main`入口等传统方式

### component/plugin/setter

1. plugin/setter 类型在 build.json 需要指定 openUrl

```
// build.json 中
{
  "plugins": [
    [
      "@alilc/build-plugin-alt",
      {
        // type 对应模板类型 component|setter|plugin
        "type": "plugin",
        "inject": true, // 开启注入调试
        // 配置要打开的页面，在注入调试模式下，不配置此项的话不会打开浏览器
        // 可以填写 CMS-Lowcode 本地启动地址http://127.0.0.1:5557或者线上地址
        "openUrl": "http://127.0.0.1:5557?debug"
      }
    ],
  ]
}
```

2. component 类型在 build.lowcode.js 需要指定 openUrl

```
const { library } = require('./build.json');

module.exports = {
  alias: {
    '@': './src',
  },
  plugins: [
    [
      // lowcode 的配置保持不变，这里仅为示意。
      '@alifd/build-plugin-lowcode',
      {
        library,
        engineScope: "@alilc"
      },
    ],
    [
      '@alilc/build-plugin-alt',
      {
        // type 对应模板类型 component|setter|plugin
        type: 'component',
        inject: true,
        library,
        // 配置要打开的页面，在注入调试模式下，不配置此项的话不会打开浏览器
        // 可以填写 CMS-Lowcode 本地启动地址http://127.0.0.1:5557或者线上地址
        openUrl: "http://127.0.0.1:5557?debug"
      }
    ]],
};
```

3. 本地 component/plugin/setter 正常启动调试，在项目的访问地址增加 debug，即可开启注入调试。

```
http://127.0.0.1:5557?debug
```
