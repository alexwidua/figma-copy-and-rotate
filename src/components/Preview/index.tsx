/**
 * @file Preview wrapper component that shows a preview of the radial pattern.
 */

import { h } from 'preact'
import style from './style.css'
import { baseDeg } from '../../core/transform'
import Item from './item'

const Preview = ({
	uiWidth,
	selectionState,
	selectionWidth,
	selectionHeight,
	selectionRotation,
	selectionType,
	numItems,
	itemRadius,
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
	// Padding of items to preview container bounds
	const padding: number = 80

	const length: number = parseInt(numItems)
	const width: LayoutMixin['width'] = selectionWidth
	const height: LayoutMixin['height'] = selectionHeight
	const isWiderOrSquare: boolean = width >= height
	const radius: number = parseInt(itemRadius)
	const diameter: number = radius * 2

	// Scale items down if item size + radius exceed preview container bounds
	const factor: number = isWiderOrSquare
		? (width * 2 + diameter) / (uiWidth - padding)
		: (height * 2 + diameter) / (uiWidth - padding)

	const proportionalHeight: number = height / factor
	const proportionalWidth: number = width / factor
	const proportionalRadius: number = radius / factor

	/**
	 * Map items radially
	 */
	const circle = Array.from({ length }, (e, i) => {
		// Pulled from ./core/transform.ts
		const deg: number =
			baseDeg + (sweepAngle / (parseInt(numItems) - 1)) * i
		const rad: number = deg * (Math.PI / 180)

		// Normalize shape if item is oblong
		const diff: number = Math.abs(proportionalWidth - proportionalHeight)
		const normalizeShape: number =
			proportionalWidth >= proportionalHeight
				? -((diff / 2) * Math.cos(Math.abs(deg) * (Math.PI / 180)))
				: (diff / 2) * Math.cos(Math.abs(deg) * (Math.PI / 180))

		const normRadian: number = selectionRotation * (Math.PI / 180)
		const normalizeRadius: number =
			proportionalWidth === proportionalHeight
				? 0
				: proportionalWidth > proportionalHeight
				? -proportionalHeight * Math.sin(Math.abs(normRadian))
				: proportionalWidth * Math.sin(Math.abs(normRadian))

		const x: number =
			(proportionalRadius + proportionalWidth / 2 - normalizeRadius) *
				Math.cos(rad) +
			(proportionalRadius * 2 + proportionalWidth) / 2 -
			proportionalWidth / 2 +
			normalizeShape

		const y: number =
			(proportionalRadius + proportionalHeight / 2 - normalizeRadius) *
				Math.sin(rad) +
			(proportionalRadius * 2 + proportionalHeight) / 2 -
			proportionalHeight / 2

		return (
			<Item
				index={i}
				x={x}
				y={y}
				itemHeight={proportionalHeight}
				itemWidth={proportionalWidth}
				angle={deg}
				selectionState={selectionState}
				selectionRotation={selectionRotation}
				selectionType={selectionType}
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

	const inlineWrapper: h.JSX.CSSProperties = {
		width: uiWidth,
		height: uiWidth
	}

	const inlineContainer: h.JSX.CSSProperties = {
		height: proportionalRadius * 2 + proportionalHeight,
		width: proportionalRadius * 2 + proportionalWidth,
		pointerEvents: isSweeping ? 'none' : 'all'
	}

	const inlineCircumference: h.JSX.CSSProperties = {
		height: isWiderOrSquare
			? proportionalRadius * 2 + proportionalWidth
			: proportionalRadius * 2 + proportionalHeight,
		width: isWiderOrSquare
			? proportionalRadius * 2 + proportionalWidth
			: proportionalRadius * 2 + proportionalHeight
	}

	const inlineRadius: h.JSX.CSSProperties = {
		opacity: showRadiusBadge ? 1 : 0
	}

	const inlineDistance: h.JSX.CSSProperties = {
		height: `${parseInt(itemRadius) / factor}px`,
		top: `${(parseInt(itemRadius) / factor) * -1}px`
	}

	return (
		<div class={style.wrapper} style={inlineWrapper}>
			{children}
			<div class={style.container} style={inlineContainer}>
				<div class={style.circumference} style={inlineCircumference} />
				{circle}
				<div class={style.radius} style={inlineRadius}>
					<div class={style.distance} style={inlineDistance} />
					<span class={style.badge}>{radius}</span>
					<span class={style.origin} />
				</div>
			</div>
		</div>
	)
}

export default Preview
