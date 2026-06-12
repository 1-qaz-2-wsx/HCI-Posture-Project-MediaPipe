// src/renderer/src/types.ts
// 专门放全局契约和数据结构

export interface Task {
  id: string
  text: string
  completed: boolean
  timestamp: string
}

export interface PostureData {
  hasUser: boolean
  isCalibrated: boolean // 新增是否已校准状态
  score: number
  angleDeviation: number
  zDeviation: number
  statusText: string
  statusColor: 'green' | 'orange' | 'red' // 补上颜色状态
}

//统一的子页面通用接口规范
export interface SharedTodoProps {
  tasks: Task[]
  setTasks: any // 用 any 暴力兼容 React 底层复杂的 Dispatch 状态机
  activeTaskId: string | null
  setActiveTaskId: any
}
