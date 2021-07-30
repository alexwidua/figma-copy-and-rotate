/**
 * @file Item component that gets mapped radially. Expects to be a child of 'Preview'
 */

import { h } from 'preact'
import style from './style.css'

interface ItemProps extends Partial<PreviewProps> {
	index: number
	x: number
	y: number
	itemSize: number
	angle: number
	elevateClick: Function
}

const Item = ({
	index,
	x,
	y,
	itemSize,
	angle,
	selectionState,
	selectionRotation,
	skipSelect,
	skipSpecific,
	skipEvery = '0',
	rotateItems,
	showRadiusBadge,
	showNumBadge,
	elevateClick
}: ItemProps) => {
	const selection: string = selectionState || 'EMPTY'

	// check for both 'VALID_UPDATEABLE' and 'VALID_UNUPDATEABLE'
	const isValidSelection: boolean = selection[0] === 'V'
	const rotation: number = selectionRotation || 0

	const specific: Array<number> = skipSpecific?.split(',').map(Number) || [-1]
	const every: number = parseInt(skipEvery)
	const isSkipped =
		(skipSelect === 'every' && every && !((index + 1) % every)) ||
		(skipSelect === 'specific' && specific.includes(index + 1))

	const inlineItem = {
		width: itemSize,
		height: itemSize,
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
			rotateItems ? angle + (rotation + 90) * -1 : 0
		}deg)`,
		background: isSkipped ? 'none' : 'var(--color-item-fill)'
	}

	const inlineBadge = {
		opacity: showNumBadge ? 1 : 0,
		background: isSkipped
			? 'var(--color-item-inactive)'
			: 'var(--color-local-accent)'
	}

	return (
		<div
			onClick={() => elevateClick()}
			class={style.item}
			style={inlineItem}>
			<span
				style={{
					transform: `rotate(${
						rotateItems ? angle * -1 + rotation + 90 : 0
					}deg)`
				}}>
				<span class={style.numBadge} style={inlineBadge}>
					{index + 1}
				</span>
			</span>
		</div>
	)
}

export default Item
