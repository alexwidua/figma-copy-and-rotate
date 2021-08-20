import { h, JSX } from 'preact'
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
import { debounce } from './utils/debounce'
import './vars.css'
import style from './style.css'

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
		INVALID: '❌ Element type not supported',
		HAS_COMPONENT_CHILD: `Can't copy groups containing components`,
		IS_WITHIN_COMPONENT: 'Select the parent component',
		IS_WITHIN_INSTANCE: 'Select the parent instance',
		MULTIPLE: 'Group multiple elements before rotation',
		VALID: 'Apply rotation'
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
		emit('EMIT_UI_READY_TO_PLUGIN')
	}, [])

	/**
	 * Input handlers
	 */

	function handleNumItemsInput(e: JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.value
		if (parseInt(value) > 1 && parseFloat(value) % 1 == 0) {
			setNumItems(e.currentTarget.value)
			const data: Partial<TransformOptions> = {
				numItems: parseInt(e.currentTarget.value)
			}
			debounceNumItemsChange(data)
		}
	}

	function handleRadiusInput(e: JSX.TargetedEvent<HTMLInputElement>): void {
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

	function handleSkipMenu(e: JSX.TargetedEvent<HTMLInputElement>): void {
		setSkipSelect(e.currentTarget.value as SkipType)
		const data: Partial<TransformOptions> = {
			skipSelect: e.currentTarget.value as SkipType
		}
		emit('EMIT_INPUT_TO_PLUGIN', data)
	}

	function handleSkipSpecificInput(
		e: JSX.TargetedEvent<HTMLInputElement>
	): void {
		const value = e.currentTarget.value
		const map = e.currentTarget.value.split(',').map(Number)
		if (map.length > parseInt(numItems) - 2) {
			emit('EMIT_INPUT_TO_PLUGIN', {
				skipSelect: 'SPECIFIC',
				skipSpecific: []
			})
			emitError('CANT_SKIP_ALL')
			return setSkipSpecific('')
		}
		setSkipSpecific(value)
		const data: Partial<TransformOptions> = {
			skipSpecific: map
		}
		emit('EMIT_INPUT_TO_PLUGIN', data)
	}

	function handleSkipEveryInput(
		e: JSX.TargetedEvent<HTMLInputElement>
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

	function handleAlignRadially(e: JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.checked
		setAlignRadially(value)
		const data: Partial<TransformOptions> = {
			alignRadially: e.currentTarget.checked
		}
		emit('EMIT_INPUT_TO_PLUGIN', data)
	}

	function handleInCanvasPreview(
		e: JSX.TargetedEvent<HTMLInputElement>
	): void {
		const value = e.currentTarget.checked
		setInCanvasPreview(value)
		emit('EMIT_PREVIEW_CHANGE_TO_PLUGIN', value)
	}

	function handleInstanceClick(index: number): void {
		// index 0 is the original node and not skippable
		if (index === 0) {
			return emitError('CANT_SKIP_FIRST_INDEX')
		}
		let map: Array<number> = []
		if (skipSpecific) {
			map = skipSpecific.split(',').map(Number)
		}
		if (map.length > parseInt(numItems) - 3) {
			emit('EMIT_INPUT_TO_PLUGIN', {
				skipSelect: 'SPECIFIC',
				skipSpecific: []
			})
			emitError('CANT_SKIP_ALL')
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

	function handleSelectionChange({
		state,
		properties
	}: SelectionMessage): void {
		setSelectionState(state)
		const { width, height, rotation, type } = properties
		setSelectionProps({
			width: width,
			height: height,
			rotation: rotation,
			type: type
		})
	}

	/**
	 * Debounce events
	 */

	const debounceWaitTime = 200

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

	/**
	 * Emit to UI handlers
	 */
	function emitInputChange(data: any) {
		emit('EMIT_INPUT_TO_PLUGIN', data)
	}

	function emitError(error: PluginError) {
		emit('UI_ERROR', error)
	}

	/**
	 * Input validators
	 */

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

	/**
	 * Parsed vals
	 */

	const parsedNumItems = parseInt(numItems)
	const parsedRadius = parseInt(radius)
	const parsedSkipEvery = parseInt(skipEvery)
	const mappedSkipSpecific = skipSpecific.split(',').map(Number)

	return (
		<div
			style={
				selectionState === 'VALID'
					? '--computed-color-accent: #18a0fb'
					: '--computed-color-accent: #a8a8a8'
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
						<Text>Canvas preview</Text>
					</Checkbox>
				</div>
			</div>
			<Container space="small">
				<VerticalSpace space="medium" />
				<Columns space="small">
					<TextboxNumeric
						onInput={handleNumItemsInput}
						icon={
							<svg
								width="12"
								height="12"
								viewBox="0 0 12 12"
								fill="none"
								xmlns="http://www.w3.org/2000/svg">
								<path
									fill-rule="evenodd"
									clip-rule="evenodd"
									d="M5.25 0.75H1.5C1.08579 0.75 0.75 1.08579 0.75 1.5V5.25C0.75 5.66421 1.08579 6 1.5 6H5.25C5.66421 6 6 5.66421 6 5.25V1.5C6 1.08579 5.66421 0.75 5.25 0.75ZM1.5 0C0.671573 0 0 0.671573 0 1.5V5.25C0 6.07843 0.671573 6.75 1.5 6.75H5.25C6.07843 6.75 6.75 6.07843 6.75 5.25V1.5C6.75 0.671573 6.07843 0 5.25 0H1.5Z"
									fill="#8C8C8C"
								/>
								<path
									fill-rule="evenodd"
									clip-rule="evenodd"
									d="M6.17582 11.8862L6.46311 11.1934C6.5505 11.2296 6.64692 11.25 6.75 11.25H7.6875V12H6.75C6.54661 12 6.35268 11.9595 6.17582 11.8862ZM9.5625 12V11.25H10.5C10.6031 11.25 10.6995 11.2296 10.7869 11.1934L11.0742 11.8862C10.8973 11.9595 10.7034 12 10.5 12H9.5625ZM12 7.6875H11.25V6.75C11.25 6.64692 11.2296 6.5505 11.1934 6.46311L11.8862 6.17582C11.9595 6.35268 12 6.54661 12 6.75V7.6875ZM7.6875 5.25H6.75C6.54661 5.25 6.35268 5.29048 6.17582 5.36382L6.46311 6.05662C6.5505 6.02038 6.64692 6 6.75 6H7.6875V5.25ZM5.25 9.5625H6V10.5C6 10.6031 6.02038 10.6995 6.05662 10.7869L5.36382 11.0742C5.29048 10.8973 5.25 10.7034 5.25 10.5V9.5625ZM5.25 7.6875H6V6.75C6 6.64692 6.02038 6.5505 6.05662 6.46311L5.36382 6.17582C5.29048 6.35268 5.25 6.54661 5.25 6.75V7.6875ZM9.5625 5.25V6H10.5C10.6031 6 10.6995 6.02038 10.7869 6.05662L11.0742 5.36382C10.8973 5.29048 10.7034 5.25 10.5 5.25H9.5625ZM12 9.5625H11.25V10.5C11.25 10.6031 11.2296 10.6995 11.1934 10.7869L11.8862 11.0742C11.9595 10.8973 12 10.7034 12 10.5V9.5625Z"
									fill="#8C8C8C"
								/>
							</svg>
						}
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
					<Text>Align copies radially</Text>
				</Checkbox>
				<VerticalSpace space="medium" />
				<Button
					onClick={handleButtonClick}
					fullWidth
					disabled={
						(selectionState as SelectionState) === 'INVALID' ||
						(selectionState as SelectionState) === 'EMPTY' ||
						(selectionState as SelectionState) === 'MULTIPLE' ||
						(selectionState as SelectionState) ===
							'HAS_COMPONENT_CHILD' ||
						(selectionState as SelectionState) ===
							'IS_WITHIN_COMPONENT' ||
						(selectionState as SelectionState) ===
							'IS_WITHIN_INSTANCE' ||
						mappedSkipSpecific.length === parsedNumItems - 1
					}>
					{buttonMap[selectionState]}
				</Button>
			</Container>
		</div>
	)
}

export default render(Plugin)
