/**
 * @file Preview wrapper component that shows a preview of the radial pattern.
 */

import { h } from 'preact'
import style from './style.css'

import Item from './item'

const Preview = ({
	selectionState,
	width,
	numItems,
	selectionWidth,
	selectionHeight,
	selectionRotation,
	radius,
	skipSelect,
	skipSpecific,
	skipEvery,
	rotateItems,
	isSweeping,
	sweepAngle,
	showRadiusBadge,
	showNumBadge,
	onInstanceClick,
	children
}: PreviewProps) => {
	const itemBaseSize: number = 60
	const selectionAverage: number = (selectionWidth + selectionHeight) / 2
	const factor: number = Math.min(
		(parseInt(radius) * 2) / selectionAverage / 2,
		10
	)
	const itemSize: number = itemBaseSize / Math.max(factor, 1)

	const r: number = itemSize * factor
	const d: number = r * 2

	/**
	 * Map items radially
	 */
	const circle = Array.from({ length: parseInt(numItems) }, (e, i) => {
		const baseDeg: number = -90
		// (numItems - 1) to account for the offset of the sweep slider
		const deg: number =
			baseDeg + (sweepAngle / (parseInt(numItems) - 1)) * i
		const rad: number = deg * (Math.PI / 180)

		const x: number =
			(r + itemSize / 2) * Math.cos(rad) +
			(d + itemSize) / 2 -
			itemSize / 2
		const y: number =
			(r + itemSize / 2) * Math.sin(rad) +
			(d + itemSize) / 2 -
			itemSize / 2

		return (
			<Item
				index={i}
				x={x}
				y={y}
				itemSize={itemSize}
				angle={deg}
				selectionState={selectionState}
				selectionRotation={selectionRotation}
				skipSelect={skipSelect}
				skipSpecific={skipSpecific}
				skipEvery={skipEvery}
				rotateItems={rotateItems}
				showRadiusBadge={showRadiusBadge}
				showNumBadge={showNumBadge}
				elevateClick={() => onInstanceClick(i)}
			/>
		)
	})

	return (
		<div class={style.wrapper} style={{ width, height: width }}>
			{children}
			<div
				class={style.container}
				style={{
					height: d + itemSize,
					width: d + itemSize,
					pointerEvents: isSweeping ? 'none' : 'all'
				}}>
				{circle}
				<span
					class={style.radiusIndicator}
					style={{
						opacity: showRadiusBadge ? 1 : 0
					}}>
					<span
						class={style.radiusLine}
						style={{
							height: `${itemSize * factor}px`,
							top: `${itemSize * factor * -1}px`
						}}
					/>
					<span class={style.radiusBadge}>{radius}</span>
					<span
						class={style.radiusOrigin}
						style={{ transform: 'rotate(45deg)' }}
					/>
					<span
						class={style.radiusOrigin}
						style={{ transform: 'rotate(-45deg)' }}
					/>
				</span>
			</div>
		</div>
	)
}

export default Preview
