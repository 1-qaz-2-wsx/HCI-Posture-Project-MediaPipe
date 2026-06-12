## 🛠️ 本地开发环境配置

本项目是一个由 Electron + React (Vite) 前端与 Python 后端组成的混合应用。拉取代码到本地后，请按照以下步骤分别配置前端和后端环境。

### 1. 前端环境配置 (Electron + React)

在项目**根目录**下，执行以下命令安装前端依赖并启动开发服务器：

```bash
# 进入项目根目录（如果是刚克隆下来，默认就在根目录）
npm install

# 启动前端开发服务器与 Electron 客户端
npm run dev
```

### 2. 后端环境配置 (Python)

项目的 Python 核心服务及依赖清单位于 `/core` 目录中。为了不污染全局环境，建议创建 Python 虚拟环境运行。

#### 步骤 A：创建并激活虚拟环境

根据你的操作系统，选择对应的命令行：

+ Windows (PowerShell - VS Code ):

```bash
# 创建虚拟环境
python -m venv core/.venv

# 激活虚拟环境
.\core\.venv\Scripts\Activate.ps1
```

+ Windows (CMD 传统命令行):

```bash
python -m venv core/.venv

.\core\.venv\Scripts\activate.bat
```

+ macOS / Linux:

```bash
python3 -m venv core/.venv

source core/.venv/bin/activate
```

#### 步骤 B：安装 Python 依赖

虚拟环境激活成功后（命令行前方会出现 `(.venv)` 标志），执行以下命令安装 `core` 目录下的依赖清单：

```bash
# 核心命令：指定路径安装 core 文件夹下的依赖

pip install -r core/requirements.txt
```

## 🚀 启动应用

当前后端依赖全部安装完成后：

1. 确保 Python 虚拟环境处于激活状态
2. 在项目根目录下，运行 `npm run dev` 启动 Electron 客户端交互。
