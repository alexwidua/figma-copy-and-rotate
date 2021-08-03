/**
 * @file Preview component that enables the user to view and modify the radial pattern.
 */

import { h } from 'preact'
import style from './style.css'
import { baseDeg } from '../../utils/transform'
import Item from './item'

const Preview = ({
	uiWidth,
	selectionState,
	selectionWidth,
	selectionHeight,
	selectionRotation,
	selectionType,
	numItems,
	radius,
	skipSelect,
	skipSpecific,
	skipEvery,
	alignRadially,
	isSweeping,
	sweepAngle,
	showRadiusBadge,
	showNumBadge,
	onInstanceClick,
	children
}: PreviewProps) => {
	const previewPadding: number = 60

	const length: number = numItems
	const width: LayoutMixin['width'] = selectionWidth
	const height: LayoutMixin['height'] = selectionHeight
	const isWiderOrSquare: boolean = width >= height
	// const radius: number = parseInt(itemRadius)
	const diameter: number = radius * 2

	// Scale items down if item size + radius exceed preview container bounds
	const factor: number = isWiderOrSquare
		? (width * 2 + diameter) / (uiWidth - previewPadding)
		: (height * 2 + diameter) / (uiWidth - previewPadding)

	// Proportional height, width and radius
	const propHeight: number = height / factor
	const propWidth: number = width / factor
	const propRadius: number = radius / factor
	const d = propRadius * 2

	/**
	 * Map items radially
	 */
	const circle = Array.from({ length }, (e, i) => {
		// See ./core/transform.ts
		// We subtract 1 from numItems to account for the sweep offset, see ./Slider
		const deg: number = baseDeg + (sweepAngle / (numItems - 1)) * i
		const rad: number = deg * (Math.PI / 180)

		// Normalize shape if item is oblong
		const diff: number = Math.abs(propWidth - propHeight)
		const normalizeShape: number =
			propWidth >= propHeight
				? -((diff / 2) * Math.cos(Math.abs(deg) * (Math.PI / 180)))
				: (diff / 2) * Math.cos(Math.abs(deg) * (Math.PI / 180))

		const normRadian: number = selectionRotation * (Math.PI / 180)
		const normalizeRadius: number =
			propWidth === propHeight
				? 0
				: propWidth > propHeight
				? (-diff / 2) * Math.sin(Math.abs(normRadian))
				: (diff / 2) * Math.sin(Math.abs(normRadian))

		const x: number =
			(propRadius + propWidth / 2 - normalizeRadius) * Math.cos(rad) +
			(d + propWidth) / 2 -
			propWidth / 2 +
			normalizeShape

		const y: number =
			(propRadius + propHeight / 2 - normalizeRadius) * Math.sin(rad) +
			(d + propHeight) / 2 -
			propHeight / 2

		return (
			<Item
				index={i}
				x={x}
				y={y}
				itemHeight={propHeight}
				itemWidth={propWidth}
				angle={deg}
				selectionState={selectionState}
				selectionRotation={selectionRotation}
				selectionType={selectionType}
				skipSelect={skipSelect}
				skipSpecific={skipSpecific}
				skipEvery={skipEvery}
				alignRadially={alignRadially}
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
		height: d + propHeight,
		width: d + propWidth,
		pointerEvents: isSweeping ? 'none' : 'all'
	}

	const inlineCircumference: h.JSX.CSSProperties = {
		height: isWiderOrSquare ? d + propWidth : d + propHeight,
		width: isWiderOrSquare ? d + propWidth : d + propHeight
	}

	const inlineRadius: h.JSX.CSSProperties = {
		opacity: showRadiusBadge ? 1 : 0
	}

	const inlineDistance: h.JSX.CSSProperties = {
		height: `${radius / factor}px`,
		top: `${(radius / factor) * -1}px`
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
