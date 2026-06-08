# 智慧停车包月续费与发票平台

## 原始需求

> 围绕智慧停车包月续费与发票平台设计一条可执行路径：录入车主档案，推进车位套餐，处理续费，最后检查发票抬头。智慧停车包月续费与发票平台的优惠券不能只作为备注，欠费拦截也要参与一次状态判断或结果汇总。运行步骤从车主档案开始，到续费分支结束，再用欠费拦截验证最终口径。技术栈：react、fastapi、PostgreSQL

## 项目简介

本项目实现了一条完整的智慧停车包月续费与发票管理业务闭环，共包含以下核心流程：

1. **车主档案录入**：录入车主姓名、手机号、车牌号、身份证等信息
2. **车位套餐选择**：选择月度/季度/年度套餐
3. **续费处理**：优惠券参与实际金额计算（非仅作为备注字段），系统自动计算抵扣金额并记录原价、优惠金额、实付金额
4. **发票抬头检查**：录入个人或企业发票抬头信息
5. **欠费拦截验证**：汇总所有信息，输出最终口径（正常/欠费/待支付/无记录），并汇总优惠券使用详情

## 技术栈

- **前端**：React 18 + Vite + Ant Design 5 + Axios
- **后端**：FastAPI + SQLAlchemy + Pydantic
- **数据库**：PostgreSQL 16
- **容器化**：Docker + Docker Compose

## 目录结构

```
wmy-35/
├── backend/              # FastAPI 后端服务
│   ├── app/
│   │   ├── routers/     # API 路由
│   │   ├── models.py   # 数据模型
│   │   ├── schemas.py  # Pydantic 模式
│   │   ├── database.py # 数据库连接
│   │   ├── config.py   # 配置
│   │   └── main.py   # 入口
│   ├── Dockerfile
│   ├── .dockerignore
│   └── requirements.txt
├── frontend/             # React 前端应用
│   ├── src/
│   │   ├── components/  # 业务组件
│   │   ├── api/         # API 封装
│   │   ├── App.jsx      # 主应用（5步向导）
│   │   └── main.jsx    # 入口
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .dockerignore
│   └── package.json
├── Dockerfile            # 根目录 Dockerfile（后端）
├── docker-compose.yml  # 一键编排
├── .dockerignore
├── .done             # 过程记录
└── README.md         # 本文档
```

## 启动方式

### 前置要求

- Docker 20.10+
- Docker Compose v2+

---

### Docker 一键启动（推荐）

#### 1. 启动所有服务（前端 + 后端 + 数据库

```bash
docker compose up --build
```

后台运行：

```bash
docker compose up --build -d
```

#### 2. 停止并清理

```bash
docker compose down
```

#### 3. 访问地址

- 前端页面：http://localhost:5173
- 后端 API：http://localhost:8000
- API 文档（Swagger）：http://localhost:8000/docs
- PostgreSQL：postgresql://postgres:postgres@localhost:5432/parking

---

### 本地开发启动（不使用 Docker）

#### 前置要求

- Python 3.11+
- Node.js 20+
- PostgreSQL 16+

#### 1. 启动数据库

确保本地 PostgreSQL 已运行，并创建数据库：

```bash
psql -U postgres
CREATE DATABASE parking;
```

#### 2. 启动后端

```bash
cd backend
pip install -r requirements.txt
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/parking"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

#### 4. 访问地址

- 前端：http://localhost:5173
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

---

## 预置数据

系统首次启动时会自动初始化以下种子数据：

### 车位套餐：
- 月度套餐：300 元 / 1 个月
- 季度套餐：800 元 / 3 个月
- 年度套餐：3000 元 / 12 个月

### 优惠券：
- NEW50：新人立减 50 元（满 200 元可用）
- VIP10：VIP 9 折券（最高优惠 200 元）
- ANNUAL200：年卡立减 200 元（满 2500 元可用）

---

## 核心业务流程

### 优惠券设计要点

1. **优惠券非仅备注**：
   - 独立表 `coupons`，支持固定金额和百分比折扣两种类型
   - 续费接口 `/api/coupons/calculate` 实时计算抵扣金额
   - 订单表 `renewals` 同时记录 `original_amount`（原价）、`discount_amount`（优惠金额）、`final_amount`（实付金额）
   - 欠费拦截结果中汇总优惠券使用详情

2. **欠费拦截参与状态判断**：
   - 接口 `/api/arrears/check/{owner_id}` 汇总：
     - 是否存在欠费
     - 欠费总金额及明细
     - 最近续费订单状态
     - 优惠券使用详情
     - 最终口径：`normal`（正常）、`arrears_exists`（欠费）、`pending_payment`（待支付）、`no_record`（无记录）
   - 输出完整文字摘要，可用于最终口径说明

---

## API 一览

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 车主档案 | POST | `/api/owners` | 录入车主档案 |
| 车主档案 | GET | `/api/owners` | 查询车主列表 |
| 车位套餐 | GET | `/api/packages` | 查询可用套餐 |
| 优惠券 | GET | `/api/coupons` | 查询可用优惠券 |
| 优惠券 | POST | `/api/coupons/calculate` | 计算优惠券抵扣金额 |
| 续费处理 | POST | `/api/renewals` | 创建续费订单（优惠券参与计算 |
| 发票管理 | POST | `/api/invoices` | 录入发票抬头 |
| 欠费拦截 | GET | `/api/arrears/check/{owner_id}` | 欠费拦截验证（最终口径） |
