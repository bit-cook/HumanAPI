import { create } from 'zustand'
import { Task, CreateTaskParams } from '@/types'
import { tasksApi } from '@/lib/api'

interface TasksState {
  tasks: Task[]
  currentTask: Task | null
  isLoading: boolean
  error: string | null
  fetchTasks: (params?: any) => Promise<void>
  fetchTask: (id: string) => Promise<void>
  createTask: (data: CreateTaskParams) => Promise<Task>
  updateTask: (id: string, data: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
}

export const useTasks = create<TasksState>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,

  fetchTasks: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const response = await tasksApi.list(params)
      set({ tasks: response.data || [], isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        isLoading: false,
      })
      throw error
    }
  },

  fetchTask: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await tasksApi.get(id)
      set({ currentTask: response.data, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch task',
        isLoading: false,
      })
      throw error
    }
  },

  createTask: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await tasksApi.create(data)
      const newTask = response.data!
      set((state) => ({
        tasks: [newTask, ...state.tasks],
        currentTask: newTask,
        isLoading: false,
      }))
      return newTask
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create task',
        isLoading: false,
      })
      throw error
    }
  },

  updateTask: async (id: string, data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await tasksApi.update(id, data)
      const updatedTask = response.data!
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update task',
        isLoading: false,
      })
      throw error
    }
  },

  deleteTask: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await tasksApi.delete(id)
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        currentTask: state.currentTask?.id === id ? null : state.currentTask,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete task',
        isLoading: false,
      })
      throw error
    }
  },
}))