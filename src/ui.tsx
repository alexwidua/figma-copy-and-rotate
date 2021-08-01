/**
 * @file ...
 */

import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
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

const Plugin = ({ selection, ui }: any) => {
	/**
	 * 💅 UI options
	 */
	const skipSelectOptions: Array<DropdownOption> = [
		{ children: 'Skip instances', value: 'SPECIFIC' },
		{ children: 'Skip every', value: 'EVERY' }
	]
	const buttonMap: SelectionTypeMap = {
		EMPTY: 'No items selected',
		INVALID: 'Node type not supported',
		VALID_UPDATEABLE: 'Update items',
		VALID_NONUPDATEABLE: 'Rotate items',
		MULTIPLE: 'Group multiple nodes before rotation'
	}

	/**
	 * Vars
	 */

	const initSelection: SelectionLayout = {
		height: selection.height,
		width: selection.width,
		rotation: selection.rotation,
		type: selection.type
	}
	const adaptiveRadius: number = (selection.width + selection.height) / 4
	const radiusToString: string = adaptiveRadius.toFixed(0)

	/**
	 * 💾 States
	 */
	// UI exposed states
	const [numItems, setNumItems] = useState<string>('8')
	const [radius, setRadius] = useState<string>(radiusToString)
	const [skipSelect, setSkipSelect] = useState<SkipType>('SPECIFIC')
	const [skipSpecific, setSkipSpecific] = useState<string>('')
	const [skipEvery, setSkipEvery] = useState<string>('')
	const [rotateItems, setRotateItems] = useState<boolean>(true)
	const [sweepAngle, setSweepAngle] = useState<number>(360)

	// Internal states
	const [selectionLayout, setSelectionLayout] =
		useState<SelectionLayout>(initSelection)
	const [selectionState, setSelectionState] = useState<SelectionType>('EMPTY')
	const [showRadiusBadge, setShowRadiusBadge] = useState<boolean>(false)
	const [showNumBadge, setShowNumBadge] = useState<boolean>(false)
	const [isSweeping, setIsSweeping] = useState<boolean>(false)

	/**
	 * 📎 Hooks
	 */
	useEffect(() => {
		if (selection) {
			// Set adaptive radius on startup
			const { width, height } = selection
			const average = (width + height) / 2
			setRadius((average / 2).toFixed(1))
		}
	}, [])

	/**
	 *  💪 Event handlers
	 */

	function handleNumItemsInput(
		e: h.JSX.TargetedEvent<HTMLInputElement>
	): void {
		const value = e.currentTarget.value
		if (parseFloat(value) > 1 && parseFloat(value) % 1 == 0) {
			setNumItems(e.currentTarget.value)
		}
	}

	function handleRadiusInput(e: h.JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.value
		if (parseFloat(value) >= 0) {
			setRadius(e.currentTarget.value)
		}
		setShowRadiusBadge(true)
	}

	function handleSkipSelectMenu(
		e: h.JSX.TargetedEvent<HTMLInputElement>
	): void {
		setSkipSelect(e.currentTarget.value as SkipType)
	}

	function handleSkipSpecificInput(
		e: h.JSX.TargetedEvent<HTMLInputElement>
	): void {
		const value = e.currentTarget.value
		setSkipSpecific(value)
	}

	function handleSkipEveryInput(
		e: h.JSX.TargetedEvent<HTMLInputElement>
	): void {
		const value = e.currentTarget.value
		setSkipEvery(value)
	}

	function handleRotateItems(e: h.JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.checked
		setRotateItems(value)
	}

	function handleInstanceClick(index: number): void {
		setSkipSelect('SPECIFIC')

		// Get current skipped instances
		const skipped = skipSpecific.split(',').map(Number)
		if (skipped[0] === 0) {
			skipped.shift()
		}
		// Check if clicked instance has already been selected
		const findIndex = skipped.indexOf(index + 1)
		if (findIndex > -1) {
			skipped.splice(findIndex, 1)
		} else {
			skipped.push(index + 1)
		}

		const stringifyArr: string = skipped.toString()
		setSkipSpecific(stringifyArr)
	}

	function handleSweepChange(sweepAngle: number): void {
		setSweepAngle(sweepAngle)
	}

	function handleSweep(isSweeping: boolean): void {
		setIsSweeping(isSweeping)
	}

	function handleButtonClick(): void {
		emit('TRANSFORM', {
			numItems,
			radius,
			skipSelect,
			skipSpecific,
			skipEvery,
			rotateItems,
			sweepAngle
		})

		// Additionally set selection state because generated node is always updateable.
		// setSelectionState('VALID_UPDATEABLE')
	}

	/**
	 * 👂 Event listeners
	 */
	function handleSelectionChange({ msg, selection }: SelectionMessage): void {
		setSelectionState(msg)

		if (
			selection &&
			(msg === 'VALID_UPDATEABLE' || msg === 'VALID_NONUPDATEABLE')
		) {
			const { width, height, rotation, type } = selection
			setSelectionLayout({ width, height, rotation, type })
		}
	}

	// Listen to messages from plugin side
	on('SELECTION_CHANGE', handleSelectionChange)
	on('TRANSFORM_CALLBACK', (success) => {
		if (!success) return
		else {
			setSelectionState('VALID_UPDATEABLE')
		}
	})

	/**
	 *  Validators
	 */
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

	return (
		<div>
			<Preview
				uiWidth={ui.width}
				selectionState={selectionState}
				selectionHeight={selectionLayout.height}
				selectionWidth={selectionLayout.width}
				selectionRotation={selectionLayout.rotation}
				selectionType={selectionLayout.type}
				numItems={numItems}
				itemRadius={radius}
				skipSelect={skipSelect}
				skipSpecific={skipSpecific}
				skipEvery={skipEvery}
				rotateItems={rotateItems}
				isSweeping={isSweeping}
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
					{skipSelect === 'SPECIFIC' && (
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
										'calc(var(--local-icon-size) * 2)'
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
					{skipSelect === 'EVERY' && (
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
					<Text>Align instances radially</Text>
				</Checkbox>
				<VerticalSpace space="medium" />
				<Button
					onClick={handleButtonClick}
					fullWidth
					disabled={
						selectionState === 'INVALID' ||
						selectionState === 'EMPTY' ||
						selectionState === 'MULTIPLE' ||
						skipSpecific.split(',').length === parseInt(numItems)
					}>
					{buttonMap[selectionState]}
				</Button>
			</Container>
		</div>
	)
}

export default render(Plugin)
