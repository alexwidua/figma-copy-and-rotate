import { h } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks'
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
import { Preview, Slider } from './components'
import { debounce } from './utils/ui'
import './vars.css'
import style from './style.css'

type SelectionStateMap = { [type in SelectionState]: string }

const Plugin = ({ selection, ui }: any) => {
	/**
	 * UI options
	 */
	const skipSelectOptions: Array<DropdownOption> = [
		{ children: 'Skip instances', value: 'SPECIFIC' },
		{ children: 'Skip every', value: 'EVERY' }
	]
	const buttonMap: SelectionStateMap = {
		EMPTY: 'No element selected',
		INVALID: 'Selected type not supported',
		IS_INSTANCE: `Can't rotate instances`,
		HAS_COMPONENT: `Can't rotate group containing component`,
		VALID: 'Apply rotation',
		MULTIPLE: 'Group multiple elements before rotating'
	}
	const initSelection: SelectionProperties = {
		height: selection.height,
		width: selection.width,
		rotation: selection.rotation,
		type: selection.type
	}
	const adaptiveRadius: number = (selection.width + selection.height) / 4
	const radiusToString: string = adaptiveRadius.toFixed(0)

	/**
	 * States
	 */

	// UI exposed states
	const [numItems, setNumItems] = useState<string>('8')
	const [radius, setRadius] = useState<string>(radiusToString)
	const [skipSelect, setSkipSelect] = useState<SkipType>('SPECIFIC')
	const [skipSpecific, setSkipSpecific] = useState<string>('')
	const [skipEvery, setSkipEvery] = useState<string>('')
	const [alignRadially, setAlignRadially] = useState<boolean>(true)
	const [inCanvasPreview, setInCanvasPreview] = useState<boolean>(true)
	const [sweepAngle, setSweepAngle] = useState<number>(360)

	// Internal states
	const [selectionProps, setSelectionProps] =
		useState<SelectionProperties>(initSelection)
	const [selectionState, setSelectionState] =
		useState<SelectionState>('EMPTY')
	const [showRadiusHelper, setshowRadiusHelper] = useState<boolean>(false)
	const [showNumBadge, setShowNumBadge] = useState<number>(0)
	const [isSweeping, setIsSweeping] = useState<boolean>(false)

	useEffect(() => {
		on('EMIT_SELECTION_CHANGE_TO_UI', handleSelectionChange)
	}, [])

	/**
	 * Input handlers
	 */
	function handleNumItemsInput(
		e: h.JSX.TargetedEvent<HTMLInputElement>
	): void {
		const value = e.currentTarget.value
		if (parseInt(value) > 1 && parseFloat(value) % 1 == 0) {
			setNumItems(e.currentTarget.value)
			const data: Partial<TransformOptions> = {
				numItems: parseInt(e.currentTarget.value)
			}
			debounceNumItemsChange(data)
		}
	}

	function handleRadiusInput(e: h.JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.value
		if (parseFloat(value) >= 0) {
			setRadius(e.currentTarget.value)
			const data: Partial<TransformOptions> = {
				radius: parseInt(e.currentTarget.value)
			}
			debounceRadiusChange(data)
		}
		setshowRadiusHelper(true)
	}

	function handleSkipMenu(e: h.JSX.TargetedEvent<HTMLInputElement>): void {
		setSkipSelect(e.currentTarget.value as SkipType)
		const data: Partial<TransformOptions> = {
			skipSelect: e.currentTarget.value as SkipType
		}
		emit('EMIT_INPUT_TO_PLUGIN', data)
	}

	function handleSkipSpecificInput(
		e: h.JSX.TargetedEvent<HTMLInputElement>
	): void {
		const value = e.currentTarget.value
		const map = e.currentTarget.value.split(',').map(Number)
		if (map.length > parseInt(numItems) - 1) {
			emit('EMIT_INPUT_TO_PLUGIN', {
				skipSelect: 'SPECIFIC',
				skipSpecific: []
			})
			return setSkipSpecific('')
		}
		setSkipSpecific(value)
		const data: Partial<TransformOptions> = {
			skipSpecific: map
		}
		emit('EMIT_INPUT_TO_PLUGIN', data)
	}

	function handleSkipEveryInput(
		e: h.JSX.TargetedEvent<HTMLInputElement>
	): void {
		const value = e.currentTarget.value
		setSkipEvery(value)
		const data: Partial<TransformOptions> = {
			skipEvery: parseInt(e.currentTarget.value)
		}
		emit('EMIT_INPUT_TO_PLUGIN', data)
	}

	function clearSkipInputs() {
		setSkipEvery('')
		setSkipSpecific('')
		const data: Partial<TransformOptions> = {
			skipEvery: 0,
			skipSpecific: []
		}
		emit('EMIT_INPUT_TO_PLUGIN', data)
	}

	function handleAlignRadially(
		e: h.JSX.TargetedEvent<HTMLInputElement>
	): void {
		const value = e.currentTarget.checked
		setAlignRadially(value)
		const data: Partial<TransformOptions> = {
			alignRadially: e.currentTarget.checked
		}
		emit('EMIT_INPUT_TO_PLUGIN', data)
	}

	function handleInCanvasPreview(
		e: h.JSX.TargetedEvent<HTMLInputElement>
	): void {
		const value = e.currentTarget.checked
		setInCanvasPreview(value)
		emit('EMIT_PREVIEW_CHANGE_TO_PLUGIN', value)
	}

	function handleInstanceClick(index: number): void {
		// index 0 is the original node and not skippable
		if (index === 0) {
			return
		}
		let map: Array<number> = []
		if (skipSpecific) {
			map = skipSpecific.split(',').map(Number)
		}
		if (map.length > parseInt(numItems) - 2) {
			emit('EMIT_INPUT_TO_PLUGIN', {
				skipSelect: 'SPECIFIC',
				skipSpecific: []
			})
			return setSkipSpecific('')
		}
		const isAlreadySelected = map.indexOf(index + 1)
		if (isAlreadySelected > -1) {
			map.splice(isAlreadySelected, 1)
		} else {
			map.push(index + 1)
		}
		const stringified: string = map.toString()
		setSkipSelect('SPECIFIC')
		setSkipSpecific(stringified)

		const data: Partial<TransformOptions> = {
			skipSelect: 'SPECIFIC',
			skipSpecific: map
		}
		emit('EMIT_INPUT_TO_PLUGIN', data)
	}

	function handleSweepChange(sweepAngle: number): void {
		setSweepAngle(sweepAngle)

		const data: Partial<TransformOptions> = {
			sweepAngle
		}
		debounceSweepChange(data)
	}

	function handleSweep(isSweeping: boolean): void {
		setIsSweeping(isSweeping)
	}

	function handleButtonClick(): void {
		emit('APPLY_TRANSFORMATION')
	}

	function handleSelectionChange({ state, properties }: any): void {
		setSelectionState(state)
		console.log(properties)
		if (state === 'VALID') {
			const { width, height, rotation, type } = properties
			setSelectionProps({
				width: Math.round(width),
				height: Math.round(height),
				rotation: Math.round(rotation),
				type: type
			})
		}
	}

	// Debounce events
	const debounceWaitTime = 200

	const emitInputChange = (data: any) => {
		emit('EMIT_INPUT_TO_PLUGIN', data)
	}

	const debounceNumItemsChange = useCallback(
		debounce((data) => emitInputChange(data), debounceWaitTime),
		[]
	)

	const debounceRadiusChange = useCallback(
		debounce((data) => emitInputChange(data), debounceWaitTime),
		[]
	)

	const debounceSweepChange = useCallback(
		debounce((data) => emitInputChange(data), debounceWaitTime),
		[]
	)

	// Input validators
	function validateMinValue(
		value: null | number,
		min: number
	): null | number | boolean {
		return value !== null && value >= min
	}

	function validateSkipSpecific(value: string): string | boolean {
		const split = value.split(',').map(Number)
		const temp: any = split.filter(
			(e, i) => e > 1 && e % 1 == 0 && split.indexOf(e) == i
		)
		return temp.toString()
	}

	function validateSkipEvery(value: string): string | boolean {
		return (
			(parseFloat(value) > 1 && parseFloat(value) % 1 == 0) ||
			value === ''
		)
	}

	// Parsed values
	const parsedNumItems = parseInt(numItems)
	const parsedRadius = parseInt(radius)
	const parsedSkipEvery = parseInt(skipEvery)
	const mappedSkipSpecific = skipSpecific.split(',').map(Number)

	return (
		<div
			style={
				inCanvasPreview
					? '--local-color-purple: #7b61ff'
					: '--local-color-purple: #18a0fb'
			}>
			<Preview
				uiWidth={ui.width}
				selectionState={selectionState}
				selectionHeight={selectionProps.height || 100}
				selectionWidth={selectionProps.width || 100}
				selectionRotation={selectionProps.rotation || 0}
				selectionType={selectionProps.type || 'RECTANGLE'}
				numItems={parsedNumItems}
				radius={parsedRadius}
				skipSelect={skipSelect}
				skipSpecific={mappedSkipSpecific}
				skipEvery={parsedSkipEvery}
				alignRadially={alignRadially}
				isSweeping={isSweeping}
				sweepAngle={sweepAngle}
				showRadiusHelper={showRadiusHelper}
				showNumBadge={showNumBadge}
				onInstanceClick={handleInstanceClick}>
				<Slider
					onSweepChange={handleSweepChange}
					onSweep={handleSweep}
					numItems={parsedNumItems}
				/>
			</Preview>
			<div class={style.checkboxContainer}>
				<div class={style.checkbox}>
					<Checkbox
						onChange={handleInCanvasPreview}
						value={inCanvasPreview}>
						<Text>Live preview</Text>
					</Checkbox>
				</div>
			</div>
			<Container space="small">
				<VerticalSpace space="medium" />
				<Columns space="small">
					<TextboxNumeric
						onInput={handleNumItemsInput}
						icon={'#'}
						maximum={9999}
						value={numItems}
						validateOnBlur={(e) => validateMinValue(e, 2)}
						onFocusCapture={() => setShowNumBadge(1)}
						onBlurCapture={() => setShowNumBadge(0)}
					/>
					<TextboxNumeric
						onInput={handleRadiusInput}
						icon={'R'}
						value={radius}
						validateOnBlur={(e) => validateMinValue(e, 0)}
						onFocusCapture={() => setshowRadiusHelper(true)}
						onBlurCapture={() => setshowRadiusHelper(false)}
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
						onChange={handleSkipMenu}
						options={skipSelectOptions}
					/>
					{skipSelect === 'SPECIFIC' && (
						<div class={style.textboxContainer}>
							<Textbox
								value={skipSpecific}
								onInput={handleSkipSpecificInput}
								validateOnBlur={validateSkipSpecific}
								placeholder={'ex. 2,4,8'}
								onFocusCapture={() => setShowNumBadge(2)}
								onBlurCapture={() => setShowNumBadge(0)}
								style={{
									paddingRight:
										'calc(var(--local-icon-size) * 2)'
								}}
							/>
							{skipSpecific && (
								<span
									onClick={clearSkipInputs}
									class={style.textboxClear}
								/>
							)}
						</div>
					)}
					{skipSelect === 'EVERY' && (
						<div class={style.textboxContainer}>
							<Textbox
								value={skipEvery}
								onInput={handleSkipEveryInput}
								validateOnBlur={validateSkipEvery}
								placeholder={'Skip every <n>th item'}
								onFocusCapture={() => setShowNumBadge(2)}
								onBlurCapture={() => setShowNumBadge(0)}
								style={{
									paddingRight:
										'calc(var(--local-icon-size) * 2)'
								}}
							/>
							{skipEvery && (
								<span
									onClick={clearSkipInputs}
									class={style.textboxClear}
								/>
							)}
						</div>
					)}
				</Columns>
				<VerticalSpace space="medium" />
				<Checkbox onChange={handleAlignRadially} value={alignRadially}>
					<Text>Align instances radially</Text>
				</Checkbox>
				{/* <VerticalSpace space="medium" /> */}

				<VerticalSpace space="medium" />
				<Button
					onClick={handleButtonClick}
					fullWidth
					disabled={
						(selectionState as SelectionState) === 'INVALID' ||
						(selectionState as SelectionState) === 'EMPTY' ||
						(selectionState as SelectionState) === 'MULTIPLE' ||
						(selectionState as SelectionState) ===
							'HAS_COMPONENT' ||
						(selectionState as SelectionState) === 'IS_INSTANCE' ||
						mappedSkipSpecific.length === parsedNumItems - 1
					}>
					{buttonMap[selectionState]}
				</Button>
			</Container>
		</div>
	)
}

export default render(Plugin)
