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
1. **启动服务**。
  `pnpm dev` 或 `npm run dev`。
1. **从主分支拉取一个分支进行开发**。
2. **本地代码检查**。
  提交代码时会自动触发代码检查，也可以自己手动进行代码检查：
    - `pnpm lint` 运行ESLint进行代码检查；
    - `pnpm typecheck` 运行TypeScript类型检查；
    - `pnpm format` 格式化代码。
1. 项目使用Github Actions进行CI/CD，需**检查CI/CD是否通过，并做出相应修改**。
2. 代码提交后**提交PR**，等待审核。
3. 代码审核通过后会被合并到主分支。
4. 主分支代码会自动部署到生产环境。
