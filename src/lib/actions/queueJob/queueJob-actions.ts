"use server";

import { serverLogger } from "@/lib/logger/server-logger";
import { prisma } from "@/lib/prisma";
import {
    calculateNextRetryTime,
    cleanupOldJobs,
    countJobsByStatus,
    getPaginatedQueueJobs
} from "@/lib/utils/queueJob/queueJob-utils";
import {
    stringifyQueueJobData,
    stringifyQueueJobMetadata,
    transformQueueJob
} from "@/transformers/queueJob/queueJob-transformers";
import {
    type CreateQueueJobInput,
    type QueueJobFilters,
    type QueueJobPaginationOptions,
    QueueJobStatus,
    type UpdateQueueJobInput
} from "@/types/entities/queueJob/queueJob-types";
import { revalidatePath } from "next/cache";

// Logger específico para server actions
const actionLogger = serverLogger.withContext("queueJob-actions");

/**
 * Obtiene una lista paginada de trabajos en cola
 */
export async function getQueueJobs(
  filters: QueueJobFilters = {},
  pagination: QueueJobPaginationOptions = {}
) {
  try {
    actionLogger.debug("🔍 Obteniendo trabajos en cola", { filters, pagination });

    const result = await getPaginatedQueueJobs(filters, pagination);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    actionLogger.error("❌ Error al obtener trabajos en cola", { error });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Obtiene un trabajo en cola por su ID
 */
export async function getQueueJobById(id: string) {
  try {
    actionLogger.debug("🔍 Obteniendo trabajo en cola por ID", { id });

    const job = await prisma.queueJob.findUnique({
      where: { id },
    });

    if (!job) {
      return {
        success: false,
        error: `Trabajo no encontrado: ${id}`,
      };
    }

    const transformedJob = transformQueueJob(job);

    return {
      success: true,
      data: transformedJob,
    };
  } catch (error) {
    actionLogger.error("❌ Error al obtener trabajo en cola", { id, error });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Crea un nuevo trabajo en cola
 */
export async function createQueueJob(data: CreateQueueJobInput) {
  try {
    actionLogger.debug("✨ Creando trabajo en cola", { queue: data.queue });

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

    const transformedJob = transformQueueJob(job);

    // Revalidar paths relevantes
    revalidatePath("/admin/queue");
    revalidatePath(`/admin/queue/${job.id}`);

    actionLogger.info("✅ Trabajo en cola creado", { id: job.id, queue: job.queue });

    return {
      success: true,
      data: transformedJob,
    };
  } catch (error) {
    actionLogger.error("❌ Error al crear trabajo en cola", { error });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Actualiza un trabajo en cola existente
 */
export async function updateQueueJob(id: string, data: UpdateQueueJobInput) {
  try {
    actionLogger.debug("📝 Actualizando trabajo en cola", { id });

    // Verificar que el trabajo existe
    const existingJob = await prisma.queueJob.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return {
        success: false,
        error: `Trabajo no encontrado: ${id}`,
      };
    }

    // Preparar los datos para actualizar
    const updateData: Record<string, unknown> = {};

    if (data.status !== undefined) {
      updateData.status = data.status;

      // Si cambiamos el estado a "processing", actualizamos startedAt
      if (data.status === QueueJobStatus.PROCESSING && !existingJob.startedAt) {
        updateData.startedAt = new Date();
      }

      // Si cambiamos el estado a "completed" o "failed", actualizamos finishedAt
      if ((data.status === QueueJobStatus.COMPLETED || data.status === QueueJobStatus.FAILED) && !existingJob.finishedAt) {
        updateData.finishedAt = new Date();
      }
    }

    if (data.progress !== undefined) {
      updateData.progress = data.progress;
    }

    if (data.error !== undefined) {
      updateData.error = data.error;

      // Si hay un error, incrementamos el contador de intentos
      if (data.error && existingJob.status === QueueJobStatus.PROCESSING) {
        updateData.attempts = existingJob.attempts + 1;

        // Si no hemos excedido el número máximo de intentos, calculamos el próximo reintento
        if ((existingJob.attempts + 1) < existingJob.maxAttempts) {
          updateData.retryAt = calculateNextRetryTime(existingJob.attempts + 1);
        }
      }
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

    const transformedJob = transformQueueJob(job);

    // Revalidar paths relevantes
    revalidatePath("/admin/queue");
    revalidatePath(`/admin/queue/${job.id}`);

    actionLogger.info("✅ Trabajo en cola actualizado", { id });

    return {
      success: true,
      data: transformedJob,
    };
  } catch (error) {
    actionLogger.error("❌ Error al actualizar trabajo en cola", { id, error });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Elimina un trabajo en cola
 */
export async function deleteQueueJob(id: string) {
  try {
    actionLogger.debug("🗑️ Eliminando trabajo en cola", { id });

    // Verificar que el trabajo existe
    const existingJob = await prisma.queueJob.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return {
        success: false,
        error: `Trabajo no encontrado: ${id}`,
      };
    }

    // Eliminar el trabajo
    await prisma.queueJob.delete({
      where: { id },
    });

    // Revalidar paths relevantes
    revalidatePath("/admin/queue");

    actionLogger.info("✅ Trabajo en cola eliminado", { id });

    return {
      success: true,
    };
  } catch (error) {
    actionLogger.error("❌ Error al eliminar trabajo en cola", { id, error });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Reintenta un trabajo fallido
 */
export async function retryQueueJob(id: string) {
  try {
    actionLogger.debug("🔄 Reintentando trabajo en cola", { id });

    // Verificar que el trabajo existe
    const existingJob = await prisma.queueJob.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return {
        success: false,
        error: `Trabajo no encontrado: ${id}`,
      };
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

    const transformedJob = transformQueueJob(job);

    // Revalidar paths relevantes
    revalidatePath("/admin/queue");
    revalidatePath(`/admin/queue/${job.id}`);

    actionLogger.info("✅ Trabajo en cola programado para reintento", { id });

    return {
      success: true,
      data: transformedJob,
    };
  } catch (error) {
    actionLogger.error("❌ Error al reintentar trabajo en cola", { id, error });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Cancela un trabajo pendiente o en progreso
 */
export async function cancelQueueJob(id: string) {
  try {
    actionLogger.debug("❌ Cancelando trabajo en cola", { id });

    // Verificar que el trabajo existe
    const existingJob = await prisma.queueJob.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return {
        success: false,
        error: `Trabajo no encontrado: ${id}`,
      };
    }

    // Si el trabajo ya está completado o cancelado, no hacemos nada
    if (existingJob.status === QueueJobStatus.COMPLETED || existingJob.status === QueueJobStatus.CANCELLED) {
      return {
        success: false,
        error: `No se puede cancelar un trabajo que ya está ${existingJob.status}`,
      };
    }

    // Actualizar el trabajo para cancelarlo
    const job = await prisma.queueJob.update({
      where: { id },
      data: {
        status: QueueJobStatus.CANCELLED,
        finishedAt: new Date(),
      },
    });

    const transformedJob = transformQueueJob(job);

    // Revalidar paths relevantes
    revalidatePath("/admin/queue");
    revalidatePath(`/admin/queue/${job.id}`);

    actionLogger.info("✅ Trabajo en cola cancelado", { id });

    return {
      success: true,
      data: transformedJob,
    };
  } catch (error) {
    actionLogger.error("❌ Error al cancelar trabajo en cola", { id, error });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Limpia trabajos antiguos completados o fallidos
 */
export async function cleanupOldQueueJobs(olderThanDays = 30) {
  try {
    actionLogger.debug("🧹 Limpiando trabajos antiguos", { olderThanDays });

    const olderThan = new Date();
    olderThan.setDate(olderThan.getDate() - olderThanDays);

    const count = await cleanupOldJobs(olderThan);

    // Revalidar paths relevantes
    revalidatePath("/admin/queue");

    actionLogger.info("✅ Trabajos en cola eliminados", { count });

    return {
      success: true,
      count,
    };
  } catch (error) {
    actionLogger.error("❌ Error al limpiar trabajos antiguos", { error });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Obtiene estadísticas de los trabajos
 */
export async function getQueueJobStats() {
  try {
    actionLogger.debug("📊 Obteniendo estadísticas de trabajos");

    const stats = await countJobsByStatus();

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    actionLogger.error("❌ Error al obtener estadísticas de trabajos", { error });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Pausa una cola (marca todos los trabajos pendientes como pausados)
 */
export async function pauseQueue(queue: string) {
  try {
    actionLogger.debug("⏸️ Pausando cola", { queue });

    const result = await prisma.queueJob.updateMany({
      where: {
        queue,
        status: QueueJobStatus.PENDING,
      },
      data: {
        status: "paused", // Este estado no está en el enum pero lo usamos para pausar
      },
    });

    // Revalidar paths relevantes
    revalidatePath("/admin/queue");

    actionLogger.info("✅ Cola pausada", { queue, count: result.count });

    return {
      success: true,
      count: result.count,
    };
  } catch (error) {
    actionLogger.error("❌ Error al pausar cola", { queue, error });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Reanuda una cola (marca todos los trabajos pausados como pendientes)
 */
export async function resumeQueue(queue: string) {
  try {
    actionLogger.debug("▶️ Reanudando cola", { queue });

    const result = await prisma.queueJob.updateMany({
      where: {
        queue,
        status: "paused", // Este estado no está en el enum pero lo usamos para pausar
      },
      data: {
        status: QueueJobStatus.PENDING,
      },
    });

    // Revalidar paths relevantes
    revalidatePath("/admin/queue");

    actionLogger.info("✅ Cola reanudada", { queue, count: result.count });

    return {
      success: true,
      count: result.count,
    };
  } catch (error) {
    actionLogger.error("❌ Error al reanudar cola", { queue, error });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Limpia una cola (elimina todos los trabajos pendientes)
 */
export async function clearQueue(queue: string) {
  try {
    actionLogger.debug("🧹 Limpiando cola", { queue });

    const result = await prisma.queueJob.deleteMany({
      where: {
        queue,
        status: QueueJobStatus.PENDING,
      },
    });

    // Revalidar paths relevantes
    revalidatePath("/admin/queue");

    actionLogger.info("✅ Cola limpiada", { queue, count: result.count });

    return {
      success: true,
      count: result.count,
    };
  } catch (error) {
    actionLogger.error("❌ Error al limpiar cola", { queue, error });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}