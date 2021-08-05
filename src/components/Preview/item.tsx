/**
 * @file The item component is part of the UI preview and represents a node
 * that gets mapped radially. Each item holds different visual states, such as
 * being highlighted, being skipped or being heighlighted when the radius is changed.
 * Must be a child of ./Preview.
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
	showRadiusHelper,
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
		transform: `rotate(${
			alignRadially ? angle + (rotation + 90) * -1 : rotation * -1
		}deg)`,
		borderRadius:
			selectionType === 'ELLIPSE' ? '100%' : 'var(--border-radius-2)'
	}

	const inlineIndexBadge: h.JSX.CSSProperties = {
		transform: `rotate(${
			alignRadially ? angle * -1 + rotation + 90 : 90
		}deg)`
	}

	return (
		<div
			onClick={() => elevateClick()}
			class={`${style.item} 
			${index === 0 && style.isInitial}
			${isSkipped && style.isSkipped}
			${showRadiusHelper && style.isRadiusHighlight}
			${showNumBadge! > 0 && style.showIndex}
			
			`}
			style={inlineItem}>
			<span
				class={`${style.indexBadge} ${isSkipped && style.isSkipped} $`}
				style={inlineIndexBadge}>
				{index + 1}
			</span>
		</div>
	)
}

export default Item
