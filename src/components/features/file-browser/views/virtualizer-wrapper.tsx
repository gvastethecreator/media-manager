import { motion } from 'framer-motion'
import React, { forwardRef } from 'react'
import { Virtuoso, VirtuosoGrid, VirtuosoGridProps, VirtuosoProps } from 'react-virtuoso'

export type VirtualizerType = 'list' | 'grid'

export interface VirtualizerWrapperProps<T> {
	type: VirtualizerType
	data: T[]
	itemContent: (index: number, item: T) => React.ReactNode
	overscan?: number
	itemSize?: number
	listClassName?: string
	gridClassName?: string
	gridItemClassName?: string
	layoutId?: string
	animatePresence?: boolean
}

const MotionVirtuoso = motion(Virtuoso)
const MotionVirtuosoGrid = motion(VirtuosoGrid)

/**
 * Componente wrapper para estandarizar el uso de react-virtuoso
 * Permite usar tanto Virtuoso (lista) como VirtuosoGrid (grid) con una API unificada
 */
export const VirtualizerWrapper = forwardRef<HTMLDivElement, VirtualizerWrapperProps<any>>(
	(
		{
			type,
			data,
			itemContent,
			overscan = 100,
			itemSize = 150,
			listClassName,
			gridClassName,
			gridItemClassName,
			layoutId,
			animatePresence = true,
		},
		ref
	) => {
		const listProps: VirtuosoProps<any> = {
			data,
			overscan,
			itemContent,
			className: listClassName,
			components: {
				List: forwardRef((props, listRef) => (
					<div {...props} ref={listRef} className={`${props.className || ''} w-full`} />
				)),
			},
		}

		const gridProps: VirtuosoGridProps<any> = {
			data,
			overscan,
			itemContent,
			className: gridClassName,
			listClassName: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4',
			itemClassName: `${gridItemClassName || ''} w-full aspect-square`,
			components: {
				List: forwardRef((props, gridRef) => (
					<div {...props} ref={gridRef} className={`${props.className || ''} w-full`} />
				)),
			},
		}

		const animationProps = animatePresence
			? {
				layoutId: layoutId || `virtuoso-${type}`,
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
				transition: { duration: 0.2 },
			}
			: {}

		if (type === 'list') {
			return <MotionVirtuoso {...listProps} {...animationProps} ref={ref} />
		}

		return <MotionVirtuosoGrid {...gridProps} {...animationProps} ref={ref} />
	}
)

VirtualizerWrapper.displayName = 'VirtualizerWrapper'