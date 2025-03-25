import { serverLogger } from "@/lib/logger/server-logger";
import {
    countJobsByStatus,
    getPaginatedQueueJobs,
    getQueueStats
} from "@/lib/utils/queueJob/queueJob-utils";
import {
    stringifyQueueJobData,
    stringifyQueueJobMetadata,
    transformQueueJob
} from "@/transformers/queueJob/queueJob-transformers";
import {
    CreateQueueJobInput,
    QueueJobExtended,
    QueueJobFilters,
    QueueJobPaginationOptions,
    QueueJobStatus,
    UpdateQueueJobInput
} from "@/types/entities/queueJob/queueJob-types";
import { create } from "zustand";

// Logger específico para el store
const queueJobLogger = serverLogger.withContext("queueJob-store");

// Interfaz para el estado del store
interface QueueJobState {
  // Datos
  items: QueueJobExtended[];
  selectedItem: QueueJobExtended | null;
  selectedItems: QueueJobExtended[];

  // Estado de carga
  loading: boolean;
  error: Error | null;

  // Paginación
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Filtros
  filters: QueueJobFilters;

  // Estadísticas
  stats: Record<string, number> | null;
  queueStats: Array<{ queue: string; counts: Record<string, number> }> | null;

  // Acciones - CRUD
  loadJobs: (filters?: QueueJobFilters, pagination?: QueueJobPaginationOptions) => Promise<void>;
  getJob: (id: string) => Promise<QueueJobExtended | null>;
  createJob: (data: CreateQueueJobInput) => Promise<QueueJobExtended | null>;
  updateJob: (id: string, data: UpdateQueueJobInput) => Promise<QueueJobExtended | null>;
  deleteJob: (id: string) => Promise<boolean>;

  // Acciones - Selección
  selectJob: (job: QueueJobExtended) => void;
  deselectJob: (id: string) => void;
  toggleJobSelection: (job: QueueJobExtended, isMultiSelect?: boolean) => void;
  clearSelection: () => void;

  // Acciones - Paginación
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  setLimit: (limit: number) => Promise<void>;

  // Acciones - Filtros
  setFilters: (filters: QueueJobFilters) => Promise<void>;
  clearFilters: () => Promise<void>;

  // Acciones - Estadísticas
  loadStats: () => Promise<void>;
  loadQueueStats: () => Promise<void>;

  // Acciones - Operaciones especiales
  retryJob: (id: string) => Promise<QueueJobExtended | null>;
  cancelJob: (id: string) => Promise<QueueJobExtended | null>;
  resetJob: (id: string) => Promise<QueueJobExtended | null>;

  // Acciones - Control de cola
  pauseQueue: (queue: string) => Promise<boolean>;
  resumeQueue: (queue: string) => Promise<boolean>;
  clearQueue: (queue: string) => Promise<number>;
}

// Crear el store con Zustand
export const useQueueJobStore = create<QueueJobState>((set, get) => ({
  // Estado inicial
  items: [],
  selectedItem: null,
  selectedItems: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  filters: {},
  stats: null,
  queueStats: null,

  // Acciones - CRUD
  loadJobs: async (filters = {}, pagination = {}) => {
    try {
      set({ loading: true, error: null });

      const result = await getPaginatedQueueJobs(
        { ...get().filters, ...filters },
        {
          page: pagination.page || get().pagination.page,
          limit: pagination.limit || get().pagination.limit,
          ...pagination
        }
      );

      set({
        items: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        loading: false,
      });

      queueJobLogger.info(`📥 Trabajos cargados: ${result.items.length} de ${result.total}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      queueJobLogger.error(`❌ Error al cargar trabajos:`, { error });
    }
  },

  getJob: async (id: string) => {
    try {
      set({ loading: true, error: null });

      // Primero buscamos en el estado actual
      let job = get().items.find(job => job.id === id);

      // Si no lo encontramos, consultamos a la base de datos
      if (!job) {
        const jobFromDb = await prisma.queueJob.findUnique({
          where: { id },
        });

        if (jobFromDb) {
          job = transformQueueJob(jobFromDb);
        }
      }

      set({ loading: false });
      return job || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      queueJobLogger.error(`❌ Error al obtener trabajo:`, { id, error });
      return null;
    }
  },

  createJob: async (data: CreateQueueJobInput) => {
    try {
      set({ loading: true, error: null });

      // Preparar datos para la base de datos
      const jobData = typeof data.data === 'string'
        ? data.data
        : stringifyQueueJobData(data.data);

      const jobMetadata = data.metadata
        ? stringifyQueueJobMetadata(data.metadata)
        : null;

      // Crear el trabajo en la base de datos
      const job = await prisma.queueJob.create({
        data: {
          queue: data.queue,
          data: jobData,
          status: QueueJobStatus.PENDING,
          attempts: 0,
          maxAttempts: data.maxAttempts || 3,
          priority: data.priority || 0,
          metadata: jobMetadata,
        },
      });

      // Transformar el trabajo para la UI
      const transformedJob = transformQueueJob(job);

      // Actualizar el estado
      set(state => ({
        items: [transformedJob, ...state.items],
        loading: false,
      }));

      queueJobLogger.info(`✨ Trabajo creado:`, { id: job.id, queue: job.queue });
      return transformedJob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      queueJobLogger.error(`❌ Error al crear trabajo:`, { error });
      return null;
    }
  },

  updateJob: async (id: string, data: UpdateQueueJobInput) => {
    try {
      set({ loading: true, error: null });

      // Preparar los datos para actualizar
      const updateData: Record<string, unknown> = {};

      if (data.status !== undefined) {
        updateData.status = data.status;
      }

      if (data.progress !== undefined) {
        updateData.progress = data.progress;
      }

      if (data.error !== undefined) {
        updateData.error = data.error;
      }

      if (data.data !== undefined) {
        updateData.data = typeof data.data === 'string'
          ? data.data
          : stringifyQueueJobData(data.data);
      }

      if (data.priority !== undefined) {
        updateData.priority = data.priority;
      }

      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata
          ? stringifyQueueJobMetadata(data.metadata)
          : null;
      }

      if (data.maxAttempts !== undefined) {
        updateData.maxAttempts = data.maxAttempts;
      }

      // Actualizar el trabajo en la base de datos
      const job = await prisma.queueJob.update({
        where: { id },
        data: updateData,
      });

      // Transformar el trabajo para la UI
      const transformedJob = transformQueueJob(job);

      // Actualizar el estado
      set(state => ({
        items: state.items.map(item => item.id === id ? transformedJob : item),
        selectedItem: state.selectedItem?.id === id ? transformedJob : state.selectedItem,
        selectedItems: state.selectedItems.map(item => item.id === id ? transformedJob : item),
        loading: false,
      }));

      queueJobLogger.info(`📝 Trabajo actualizado:`, { id });
      return transformedJob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      queueJobLogger.error(`❌ Error al actualizar trabajo:`, { id, error });
      return null;
    }
  },

  deleteJob: async (id: string) => {
    try {
      set({ loading: true, error: null });

      // Eliminar el trabajo de la base de datos
      await prisma.queueJob.delete({
        where: { id },
      });

      // Actualizar el estado
      set(state => ({
        items: state.items.filter(item => item.id !== id),
        selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
        selectedItems: state.selectedItems.filter(item => item.id !== id),
        loading: false,
      }));

      queueJobLogger.info(`🗑️ Trabajo eliminado:`, { id });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      queueJobLogger.error(`❌ Error al eliminar trabajo:`, { id, error });
      return false;
    }
  },

  // Acciones - Selección
  selectJob: (job: QueueJobExtended) => {
    set(state => ({
      selectedItem: job,
      selectedItems: [...state.selectedItems.filter(item => item.id !== job.id), job],
    }));
  },

  deselectJob: (id: string) => {
    set(state => ({
      selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
      selectedItems: state.selectedItems.filter(item => item.id !== id),
    }));
  },

  toggleJobSelection: (job: QueueJobExtended, isMultiSelect = false) => {
    const state = get();
    const isSelected = state.selectedItems.some(item => item.id === job.id);

    if (!isMultiSelect) {
      set({
        selectedItem: isSelected ? null : job,
        selectedItems: isSelected ? [] : [job],
      });
      return;
    }

    if (isSelected) {
      get().deselectJob(job.id);
    } else {
      get().selectJob(job);
    }
  },

  clearSelection: () => {
    set({
      selectedItem: null,
      selectedItems: [],
    });
  },

  // Acciones - Paginación
  nextPage: async () => {
    const { pagination } = get();
    if (pagination.page < pagination.totalPages) {
      await get().loadJobs({}, { page: pagination.page + 1 });
    }
  },

  prevPage: async () => {
    const { pagination } = get();
    if (pagination.page > 1) {
      await get().loadJobs({}, { page: pagination.page - 1 });
    }
  },

  goToPage: async (page: number) => {
    const { pagination } = get();
    if (page >= 1 && page <= pagination.totalPages) {
      await get().loadJobs({}, { page });
    }
  },

  setLimit: async (limit: number) => {
    await get().loadJobs({}, { limit, page: 1 });
  },

  // Acciones - Filtros
  setFilters: async (filters: QueueJobFilters) => {
    set({ filters });
    await get().loadJobs(filters, { page: 1 });
  },

  clearFilters: async () => {
    set({ filters: {} });
    await get().loadJobs({}, { page: 1 });
  },

  // Acciones - Estadísticas
  loadStats: async () => {
    try {
      set({ loading: true, error: null });

      const stats = await countJobsByStatus();

      set({
        stats,
        loading: false,
      });

      queueJobLogger.info(`📊 Estadísticas cargadas`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      queueJobLogger.error(`❌ Error al cargar estadísticas:`, { error });
    }
  },

  loadQueueStats: async () => {
    try {
      set({ loading: true, error: null });

      const queueStats = await getQueueStats();

      set({
        queueStats,
        loading: false,
      });

      queueJobLogger.info(`📊 Estadísticas por cola cargadas`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      queueJobLogger.error(`❌ Error al cargar estadísticas por cola:`, { error });
    }
  },

  // Acciones - Operaciones especiales
  retryJob: async (id: string) => {
    try {
      set({ loading: true, error: null });

      // Obtener el trabajo actual
      const currentJob = await prisma.queueJob.findUnique({
        where: { id },
      });

      if (!currentJob) {
        throw new Error(`Trabajo no encontrado: ${id}`);
      }

      // Actualizar el trabajo para reintentar
      const job = await prisma.queueJob.update({
        where: { id },
        data: {
          status: QueueJobStatus.PENDING,
          retryAt: new Date(),
          attempts: 0, // Reiniciar intentos
          error: null,
          progress: 0,
        },
      });

      // Transformar el trabajo para la UI
      const transformedJob = transformQueueJob(job);

      // Actualizar el estado
      set(state => ({
        items: state.items.map(item => item.id === id ? transformedJob : item),
        selectedItem: state.selectedItem?.id === id ? transformedJob : state.selectedItem,
        selectedItems: state.selectedItems.map(item => item.id === id ? transformedJob : item),
        loading: false,
      }));

      queueJobLogger.info(`🔄 Trabajo programado para reintento:`, { id });
      return transformedJob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      queueJobLogger.error(`❌ Error al reintentar trabajo:`, { id, error });
      return null;
    }
  },

  cancelJob: async (id: string) => {
    try {
      set({ loading: true, error: null });

      // Actualizar el trabajo para cancelarlo
      const job = await prisma.queueJob.update({
        where: { id },
        data: {
          status: QueueJobStatus.CANCELLED,
          finishedAt: new Date(),
        },
      });

      // Transformar el trabajo para la UI
      const transformedJob = transformQueueJob(job);

      // Actualizar el estado
      set(state => ({
        items: state.items.map(item => item.id === id ? transformedJob : item),
        selectedItem: state.selectedItem?.id === id ? transformedJob : state.selectedItem,
        selectedItems: state.selectedItems.map(item => item.id === id ? transformedJob : item),
        loading: false,
      }));

      queueJobLogger.info(`❌ Trabajo cancelado:`, { id });
      return transformedJob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      queueJobLogger.error(`❌ Error al cancelar trabajo:`, { id, error });
      return null;
    }
  },

  resetJob: async (id: string) => {
    try {
      set({ loading: true, error: null });

      // Actualizar el trabajo para resetearlo
      const job = await prisma.queueJob.update({
        where: { id },
        data: {
          status: QueueJobStatus.PENDING,
          attempts: 0,
          error: null,
          progress: 0,
          startedAt: null,
          finishedAt: null,
          retryAt: null,
        },
      });

      // Transformar el trabajo para la UI
      const transformedJob = transformQueueJob(job);

      // Actualizar el estado
      set(state => ({
        items: state.items.map(item => item.id === id ? transformedJob : item),
        selectedItem: state.selectedItem?.id === id ? transformedJob : state.selectedItem,
        selectedItems: state.selectedItems.map(item => item.id === id ? transformedJob : item),
        loading: false,
      }));

      queueJobLogger.info(`🔄 Trabajo reseteado:`, { id });
      return transformedJob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      queueJobLogger.error(`❌ Error al resetear trabajo:`, { id, error });
      return null;
    }
  },

  // Acciones - Control de cola
  pauseQueue: async (queue: string) => {
    try {
      set({ loading: true, error: null });

      // Actualizar todos los trabajos pendientes de la cola
      const result = await prisma.queueJob.updateMany({
        where: {
          queue,
          status: QueueJobStatus.PENDING,
        },
        data: {
          status: "paused", // Este estado no está en el enum pero lo usamos para pausar
        },
      });

      set({ loading: false });

      // Si es necesario, recargar los trabajos
      await get().loadJobs();

      queueJobLogger.info(`⏸️ Cola pausada:`, { queue, affected: result.count });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      queueJobLogger.error(`❌ Error al pausar cola:`, { queue, error });
      return false;
    }
  },

  resumeQueue: async (queue: string) => {
    try {
      set({ loading: true, error: null });

      // Actualizar todos los trabajos pausados de la cola
      const result = await prisma.queueJob.updateMany({
        where: {
          queue,
          status: "paused", // Este estado no está en el enum pero lo usamos para pausar
        },
        data: {
          status: QueueJobStatus.PENDING,
        },
      });

      set({ loading: false });

      // Si es necesario, recargar los trabajos
      await get().loadJobs();

      queueJobLogger.info(`▶️ Cola reanudada:`, { queue, affected: result.count });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      queueJobLogger.error(`❌ Error al reanudar cola:`, { queue, error });
      return false;
    }
  },

  clearQueue: async (queue: string) => {
    try {
      set({ loading: true, error: null });

      // Eliminar todos los trabajos pendientes de la cola
      const result = await prisma.queueJob.deleteMany({
        where: {
          queue,
          status: QueueJobStatus.PENDING,
        },
      });

      set({ loading: false });

      // Si es necesario, recargar los trabajos
      await get().loadJobs();

      queueJobLogger.info(`🧹 Cola limpiada:`, { queue, deleted: result.count });
      return result.count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      set({ error: new Error(errorMessage), loading: false });
      queueJobLogger.error(`❌ Error al limpiar cola:`, { queue, error });
      return 0;
    }
  },
}));