/**
 * @file Individual item that gets mapped radially. Expects to be a child of ./Preview.
 */

import { h } from 'preact'
import style from './style.css'

interface ItemProps extends Partial<PreviewProps> {
	index: number
	x: number
	y: number
	itemHeight: number
	itemWidth: number
	angle: number
	elevateClick: Function
}

const Item = ({
	index,
	x,
	y,
	itemHeight,
	itemWidth,
	angle,
	selectionState,
	selectionRotation,
	selectionType,
	skipSelect,
	skipSpecific = [-1],
	skipEvery = 0,
	alignRadially,
	showRadiusBadge,
	showNumBadge,
	elevateClick
}: ItemProps) => {
	const isValidSelection: boolean = selectionState === 'VALID'
	const rotation: LayoutMixin['rotation'] = selectionRotation || 0
	const isSkipped: boolean =
		(skipSelect === 'EVERY' && skipEvery && !((index + 1) % skipEvery)) ||
		(skipSelect === 'SPECIFIC' && skipSpecific.includes(index + 1))

	// Styles
	const inlineItem: h.JSX.CSSProperties = {
		width: itemWidth,
		height: itemHeight,
		top: y,
		left: x,
		border: showRadiusBadge
			? '0.1px solid var(--color-red)'
			: isValidSelection
			? isSkipped
				? 'var(--item-border-deselected)'
				: 'var(--item-border-active)'
			: 'var(--item-border-inactive)',
		transform: `rotate(${
			alignRadially ? angle + (rotation + 90) * -1 : rotation + -90
		}deg)`,
		background: isSkipped ? 'none' : 'var(--color-item-fill)',
		borderRadius:
			selectionType === 'ELLIPSE' ? '100%' : 'var(--border-radius-2)'
	}

	const inlineIndex: h.JSX.CSSProperties = {
		opacity: showNumBadge ? 1 : 0,
		background: isSkipped
			? 'var(--color-item-inactive)'
			: 'var(--color-local-accent)',
		transform: `rotate(${
			alignRadially ? angle * -1 + rotation + 90 : 90
		}deg)`
	}

	return (
		<div
			onClick={() => elevateClick()}
			class={`${style.item} ${index === 0 ? style.og : ''}`}
			style={inlineItem}>
			<span class={style.index} style={inlineIndex}>
				{index + 1}
			</span>
		</div>
	)
}

export default Item
