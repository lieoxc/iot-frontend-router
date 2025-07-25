## 前端开发者指南
1. 推荐开发IDE：**VSCode**。安装以下插件以增强开发体验：
     - Vetur：Vue.js 的语法高亮和智能提示插件
     - ESLint： JavaScript 和 TypeScript 代码检查插件
     - Prettier：代码格式化工具
     - Volar：Vue3 支持的增强插件
     - Vite：Vite 工具链的相关支持插件
2. **克隆本项目**。
3. **安装依赖**。
  安装node和pnpm：
  `npm install -g pnpm`；
  安装项目依赖：
  `pnpm install`。
1. **启动服务(开发调试使用)**。
  `pnpm dev` 或 `npm run dev`。
2. **编译部署**
  `pnpm build` ,执行结束后，会在当前文件夹生成一个dist目录。
    
    1. 把dist目录压缩为dist.zip 
    2. 把压缩包替换到：openwrt-package\iot\files\etc\iot\configs  目录下，替换原来的dist.zip （openwrt-package 来源于：https://github.com/lieoxc/openwrt-package）