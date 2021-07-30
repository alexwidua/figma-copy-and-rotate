/**
 * @file ...
 */

import { h } from 'preact'
import { useState } from 'preact/hooks'
import { on, emit } from '@create-figma-plugin/utilities'
import {
	render,
	Container,
	Columns,
	Divider,
	VerticalSpace,
	Text,
	Button,
	Textbox,
	TextboxNumeric,
	Dropdown,
	DropdownOption,
	Checkbox
} from '@create-figma-plugin/ui'
import './vars.css'
import style from './style.css'
import Preview from './components/Preview'
import Slider from './components/Slider'

interface UISelectionDimensions {
	height: number
	width: number
	rotation: number
}

interface buttonStates {
	EMPTY: string
	INVALID: string
	VALID_UPDATEABLE: string
	VALID_NONUPDATEABLE: string
	MULTIPLE: string
}

const Plugin = ({ selection, ui }: UIProps) => {
	/**
	 * States
	 */

	// UI exposed states
	const [numItems, setNumItems] = useState<string>('8')
	const [radius, setRadius] = useState<string>(
		((selection.width + selection.height) / 4).toFixed(1)
	)
	const [skipSelect, setSkipSelect] = useState<string>('specific')
	const [skipSpecific, setSkipSpecific] = useState<string>('')
	const [skipEvery, setSkipEvery] = useState<string>('')
	const [rotateItems, setRotateItems] = useState<boolean>(true)
	const [sweepAngle, setSweepAngle] = useState<number>(360)

	// Internal states
	const [selectionDimensions, setSelectionDimensions] =
		useState<UISelectionDimensions>({
			height: selection.height,
			width: selection.width,
			rotation: 0
		})
	const [selectionState, setSelectionState] = useState<string>('EMPTY')
	const [showRadiusBadge, setShowRadiusBadge] = useState<boolean>(false)
	const [showNumBadge, setShowNumBadge] = useState<boolean>(false)
	const [sweep, setSweep] = useState<boolean>(false)

	/**
	 * UI options
	 */
	const skipSelectOptions: Array<DropdownOption> = [
		{ children: 'Skip instances', value: 'specific' },
		{ children: 'Skip every', value: 'every' }
	]
	// For generate button
	const buttonMap: buttonStates = {
		EMPTY: 'No items selected',
		INVALID: 'Node type not supported',
		VALID_UPDATEABLE: 'Update items',
		VALID_NONUPDATEABLE: 'Rotate items',
		MULTIPLE: 'Group multiple nodes before rotation'
	}

	/**
	 *  Event handlers
	 */
	function handleNumItemsInput(e: h.JSX.TargetedEvent<HTMLInputElement>) {
		const value = e.currentTarget.value
		if (parseFloat(value) > 1 && parseFloat(value) % 1 == 0) {
			setNumItems(e.currentTarget.value)
		}
	}

	function handleRadiusInput(e: h.JSX.TargetedEvent<HTMLInputElement>) {
		const value = e.currentTarget.value
		if (parseFloat(value) >= 0) {
			setRadius(e.currentTarget.value)
		}
		setShowRadiusBadge(true)

		// Disable adaptive radius after user interacted
		emit('DISABLE_ADAPTIVE_RADIUS')
	}

	function handleSkipSelectMenu(
		event: h.JSX.TargetedEvent<HTMLInputElement>
	) {
		setSkipSelect(event.currentTarget.value)
	}

	function handleSkipSpecificInput(
		event: h.JSX.TargetedEvent<HTMLInputElement>
	) {
		const value = event.currentTarget.value
		setSkipSpecific(value)
	}

	function handleSkipEveryInput(
		event: h.JSX.TargetedEvent<HTMLInputElement>
	) {
		const value = event.currentTarget.value
		setSkipEvery(value)
	}

	function handleRotateItems(event: h.JSX.TargetedEvent<HTMLInputElement>) {
		const value = event.currentTarget.checked
		setRotateItems(value)
	}

	function handleInstanceClick(index: number) {
		setSkipSelect('specific')

		const temp = skipSpecific.split(',').map(Number)
		if (temp[0] === 0) {
			temp.shift()
		}
		const findIndex = temp.indexOf(index + 1)

		if (findIndex > -1) {
			temp.splice(findIndex, 1)
		} else {
			temp.push(index + 1)
		}

		setSkipSpecific(temp.toString())
	}

	function handleSweepChange(sweepAngle: number) {
		setSweepAngle(sweepAngle)
	}

	function handleSweep(isSweeping: boolean) {
		setSweep(isSweeping)
	}

	function handleButtonClick() {
		emit('GENERATE', {
			numItems,
			radius,
			skipSelect,
			skipSpecific,
			skipEvery,
			rotateItems,
			sweepAngle
		})

		// If we generate a circle, the selected node will be always updateable
		setSelectionState('VALID_UPDATEABLE')
	}

	/**
	 *  Validators
	 */

	// Validate min value here since setting the minimum prop to min={1} prevents entering
	// numbers that start with 1
	function validateMinValue(
		value: null | number,
		min: number
	): null | number | boolean {
		return value !== null && value >= min
	}

	function validateSkipSpecific(value: string): string | boolean {
		const split = value.split(',')
		// Check if not empty, is number > 0 (since 0 is OG node) and whole number
		const temp = split.filter(
			(e) => e && parseFloat(e) > 0 && parseFloat(e) % 1 == 0
		)
		return temp.toString()
	}

	function validateSkipEvery(value: string): string | boolean {
		return (
			(parseFloat(value) > 1 && parseFloat(value) % 1 == 0) ||
			value === ''
		)
	}

	/**
	 * Event listeners
	 */

	function handleSelectionChange({
		msg,
		dimensions,
		adaptiveRadius
	}: PluginSelectionMsg) {
		setSelectionState(msg)

		// 'VALID_UPDATEABLE' or 'VALID_NONUPDATEABLE'
		if (dimensions && msg[0] === 'V') {
			const { width, height, rotation } = dimensions

			setSelectionDimensions({ width, height, rotation })

			if (adaptiveRadius) {
				const average = (width + height) / 2
				setRadius((average / 2).toFixed(1))
			}
		}
	}

	// Listen to messages from plugin side
	on('SELECTION_CHANGE', handleSelectionChange)

	return (
		<div>
			<Preview
				selectionState={selectionState}
				width={ui.width}
				numItems={numItems}
				selectionHeight={selectionDimensions.height}
				selectionWidth={selectionDimensions.width}
				selectionRotation={selectionDimensions.rotation}
				radius={radius}
				skipSelect={skipSelect}
				skipSpecific={skipSpecific}
				skipEvery={skipEvery}
				rotateItems={rotateItems}
				isSweeping={sweep}
				sweepAngle={sweepAngle}
				showRadiusBadge={showRadiusBadge}
				showNumBadge={showNumBadge}
				onInstanceClick={handleInstanceClick}>
				<Slider
					onSweepChange={handleSweepChange}
					onSweep={handleSweep}
					numItems={numItems}
				/>
			</Preview>
			<Container space="medium">
				<VerticalSpace space="medium" />
				<Columns space="small">
					<TextboxNumeric
						onInput={handleNumItemsInput}
						icon={'#'}
						maximum={9999}
						value={numItems}
						validateOnBlur={(e) => validateMinValue(e, 2)}
						onFocusCapture={() => setShowNumBadge(true)}
						onBlurCapture={() => setShowNumBadge(false)}
					/>
					<TextboxNumeric
						onInput={handleRadiusInput}
						icon={'R'}
						value={radius}
						validateOnBlur={(e) => validateMinValue(e, 0)}
						onFocusCapture={() => setShowRadiusBadge(true)}
						onBlurCapture={() => setShowRadiusBadge(false)}
					/>
				</Columns>
				<VerticalSpace space="medium" />
				<Divider />
				<VerticalSpace space="medium" />
				<Text muted>Advanced</Text>
				<VerticalSpace space="medium" />
				<Columns space="small">
					<Dropdown
						value={skipSelect}
						onChange={handleSkipSelectMenu}
						options={skipSelectOptions}
					/>
					{skipSelect === 'specific' && (
						<div class={style.textboxWrapper}>
							<Textbox
								value={skipSpecific}
								onInput={handleSkipSpecificInput}
								validateOnBlur={validateSkipSpecific}
								placeholder={'ex. 2,4,8'}
								onFocusCapture={() => setShowNumBadge(true)}
								onBlurCapture={() => setShowNumBadge(false)}
								style={{
									paddingRight:
										'calc(var(--local-icon-size) *2)'
								}}
							/>
							{skipSpecific && (
								<span
									onClick={() => setSkipSpecific('')}
									class={style.textboxClear}
								/>
							)}
						</div>
					)}
					{skipSelect === 'every' && (
						<div class={style.textboxWrapper}>
							<Textbox
								value={skipEvery}
								onInput={handleSkipEveryInput}
								validateOnBlur={validateSkipEvery}
								placeholder={'Skip every <n>th item'}
								onFocusCapture={() => setShowNumBadge(true)}
								onBlurCapture={() => setShowNumBadge(false)}
							/>
							{skipEvery && (
								<span
									onClick={() => setSkipEvery('')}
									class={style.textboxClear}
								/>
							)}
						</div>
					)}
				</Columns>
				<VerticalSpace space="medium" />
				<Checkbox onChange={handleRotateItems} value={rotateItems}>
					<Text>Align elements radially</Text>
				</Checkbox>
				<VerticalSpace space="medium" />
				<Button
					onClick={handleButtonClick}
					fullWidth
					disabled={
						selectionState === 'INVALID' ||
						selectionState === 'EMPTY' ||
						selectionState === 'MULTIPLE'
					}
					style={{
						background:
							selectionState[0] === 'V'
								? 'var(--color-local-accent)'
								: 'var(--color-local-disabled)'
					}}>
					{(buttonMap as any)[selectionState]}
				</Button>
			</Container>
		</div>
	)
}

export default render(Plugin)
