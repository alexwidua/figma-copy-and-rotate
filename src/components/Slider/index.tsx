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

	const sin: number = -Math.sin(sweepAngle * (Math.PI / 180))
	const cos: number = -Math.cos(sweepAngle * (Math.PI / 180))

	/**
	 * Hooks
	 */

	const sweepPercentage: string = useMemo(() => {
		return ((sweepAngle / (360 - offset)) * 100).toFixed(1)
	}, [sweepAngle])

	useEffect(() => {
		// Preserve sweep percentage after changing num items
		const temp: number = 360 - offset
		const preserve: number =
			temp - temp * ((100 - parseInt(sweepPercentage)) / 100)

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
	const inlineBar: h.JSX.CSSProperties = {
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

	// Make sure that badge stays centered during rotation
	const badgeHeight: number = 20
	const paddingLR: number = 4
	const inset: number = 20
	const inlineBadge: h.JSX.CSSProperties = {
		transform: `
		rotate(${-sweepAngle}deg) 
		translateX(calc(${50 * cos}% + ${inset * sin}px))
		translateY(calc(${inset * sin}% + ${
			(paddingLR + badgeHeight + badgeHeight / 2) * sin
		}px))
		`,
		left: '50%',
		top: `${inset}%`,
		height: `${badgeHeight}px`,
		lineHeight: `${badgeHeight}px`,
		padding: `0px ${paddingLR}px`
	}

	const inlineHelper: h.JSX.CSSProperties = {
		transform: `rotate(${sweepAngle}deg) translateX(-50%)`
	}

	const inlineHandle: h.JSX.CSSProperties = {
		transform: `rotate(${sweepAngle}deg) translateX(-50%)`
	}

	/**
	 * Event handlers
	 */
	function handleMouseDown(): void {
		setIsMouseDown(true)
	}

	function handleMouseUp(): void {
		setIsMouseDown(false)
	}

	function handleMouseMove(e: MouseEvent) {
		if (isMouseDown) {
			const rect = slider.current?.getBoundingClientRect()

			if (rect) {
				const origin: XY = {
					x: rect.width / 2 + rect.left,
					y: rect.height / 2 + rect.top
				}
				const absolute: XY = {
					x: origin.x - e.clientX,
					y: origin.y - e.clientY
				}
				let theta: number =
					Math.atan2(absolute.y, absolute.x) * (180 / Math.PI) - 90

				// Normalize sweepAngle from -180..180 to 0..360
				const normalizeDeg: number = (theta + 360) % 360
				const diff: number = Math.abs(normalizeDeg - sweepAngle)

				// Prevent handle from going beyond 0 / 360-offset
				if (diff < 180 && normalizeDeg <= 360 - offset) {
					//Snap to steps on shiftDown
					if (e.shiftKey) {
						const steps: number = 10
						const snapValue: number =
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
				<div class={style.bar} style={inlineBar} />
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
