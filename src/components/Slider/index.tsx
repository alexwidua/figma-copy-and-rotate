/**
 * @file Radial slider component that controls the sweep of the radial pattern.
 */

import { h } from 'preact'
import { useState, useRef, useEffect, useMemo } from 'preact/hooks'
import style from './style.css'

const Slider = ({ onSweepChange, onSweep, numItems }: SliderProp) => {
	// We don't want our radial slider to rotate 360 degs because the generated
	// circle doesn't span from 0..360 degree, but from 0..(360-(360-numItems)).
	// Because of that, we want to reduce the degree of freedom so the sweep doesn't
	// yield unexpected results
	const offset: number = 360 / parseInt(numItems)

	const slider = useRef<HTMLDivElement>(null)
	const [isMouseDown, setIsMouseDown] = useState<boolean>(false)
	const [sweepAngle, setSweepAngle] = useState<number>(360 - offset)

	const sin = -Math.sin(sweepAngle * (Math.PI / 180))
	const cos = -Math.cos(sweepAngle * (Math.PI / 180))

	/**
	 * Hooks
	 */

	const sweepPercentage: string = useMemo(() => {
		return ((sweepAngle / (360 - offset)) * 100).toFixed(1)
	}, [sweepAngle])

	useEffect(() => {
		// Preserve sweep percentage after changing num items
		const temp = 360 - offset
		const preserve = temp - temp * ((100 - parseInt(sweepPercentage)) / 100)

		setSweepAngle(preserve)
	}, [numItems])

	useEffect(() => {
		onSweepChange(sweepAngle)
	}, [sweepAngle])

	useEffect(() => {
		onSweep(isMouseDown)
	}, [isMouseDown])

	/**
	 * Styles
	 */
	const inlineArc = {
		background: `
		conic-gradient(
			${isMouseDown ? 'var(--color-local-accent)' : 'var(--color-container-bg)'} 0deg,
			${
				isMouseDown
					? 'var(--color-local-accent)'
					: 'var(--color-container-bg)'
			} ${sweepAngle}deg,
			var(--color-container-bg) ${sweepAngle + 0.01}deg,
			var(--color-container-bg) 360deg
			)
			`
	}

	const inlineBadge = {
		transform: `
		rotate(${-sweepAngle}deg) 
		translateX(calc(${50 * cos}% + ${14 * sin}px))
		translateY(calc(${16 * sin}% + ${36 * sin}px))
		`,
		left: '50%',
		top: '16%'
	}

	const inlineHelper = {
		transform: `rotate(${sweepAngle}deg) translateX(calc(-50% + 1px))`
	}

	const inlineHandle = {
		transform: `rotate(${sweepAngle}deg) translateX(-50%)`
	}

	/**
	 * Event handlers
	 */
	function handleMouseDown() {
		setIsMouseDown(true)
	}

	function handleMouseUp() {
		setIsMouseDown(false)
	}

	function handleMouseMove(e: MouseEvent) {
		if (isMouseDown) {
			const rect = slider.current?.getBoundingClientRect()

			if (rect) {
				const origin = {
					x: rect.width / 2 + rect.left,
					y: rect.height / 2 + rect.top
				}
				const absolute = {
					x: origin.x - e.clientX,
					y: origin.y - e.clientY
				}
				let theta =
					Math.atan2(absolute.y, absolute.x) * (180 / Math.PI) - 90

				// Normalize sweepAngle from -180..180 to 0..360
				const normalizeDeg = (theta + 360) % 360
				const diff = Math.abs(normalizeDeg - sweepAngle)

				// Prevent handle from going beyond 0 / 360-offset
				if (diff < 180 && normalizeDeg <= 360 - offset) {
					//Snap to steps on shiftDown
					if (e.shiftKey) {
						const steps = 10
						const snapValue =
							Math.round(normalizeDeg / steps) * steps
						setSweepAngle(snapValue)
					} else {
						// Snap handle to 360..270..180..90..0 deg
						const treshold = 5
						if (normalizeDeg < 0 + treshold && normalizeDeg > 0) {
							setSweepAngle(0)
						} else if (
							normalizeDeg < 360 - offset &&
							normalizeDeg > 360 - offset - treshold
						) {
							setSweepAngle(360 - offset)
						} else if (
							normalizeDeg < 270 + treshold &&
							normalizeDeg > 270 - treshold
						) {
							setSweepAngle(270)
						} else if (
							normalizeDeg < 180 + treshold &&
							normalizeDeg > 180 - treshold
						) {
							setSweepAngle(180)
						} else if (
							normalizeDeg < 90 + treshold &&
							normalizeDeg > 90 - treshold
						) {
							setSweepAngle(90)
						} else {
							setSweepAngle(Math.round(normalizeDeg))
						}
					}
				}
			}
		}
	}

	return (
		<div
			class={style.wrapper}
			onMouseUp={handleMouseUp}
			onMouseMove={handleMouseMove}>
			<div class={style.slider} ref={slider}>
				<div class={style.arc} style={inlineArc} />
				<div class={style.helper} style={inlineHelper} />
				<div
					class={style.handle}
					onMouseDown={handleMouseDown}
					style={inlineHandle}>
					<span
						class={`${style.badge} ${
							isMouseDown ? style.badgeActive : ''
						}`}
						style={inlineBadge}>
						Sweep {sweepPercentage}%
					</span>
				</div>
			</div>
		</div>
	)
}

export default Slider
