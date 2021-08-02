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
		EMPTY: 'No element selected',
		INVALID: 'Selected type not supported',
		IS_INSTANCE: 'TODO',
		HAS_COMPONENT: 'TODO',
		VALID: 'Valid',
		MULTIPLE: 'Group multiple selection before rotating'
	}
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

	// Set adaptive radius on startup
	useEffect(() => {
		if (selection) {
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
		if (parseInt(value) > 1 && parseFloat(value) % 1 == 0) {
			setNumItems(e.currentTarget.value)
			const data: Partial<TransformOptions> = {
				numItems: parseInt(e.currentTarget.value)
			}
			emit('EMIT_INPUT_TO_PLUGIN', data)
		}
	}

	function handleRadiusInput(e: h.JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.value
		if (parseFloat(value) >= 0) {
			setRadius(e.currentTarget.value)
			const data: Partial<TransformOptions> = {
				radius: parseInt(e.currentTarget.value)
			}
			emit('EMIT_INPUT_TO_PLUGIN', data)
		}
		setShowRadiusBadge(true)
	}

	function handleSkipSelectMenu(
		e: h.JSX.TargetedEvent<HTMLInputElement>
	): void {
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
		setSkipSpecific(value)
		const data: Partial<TransformOptions> = {
			skipSpecific: e.currentTarget.value.split(',').map(Number)
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

	function handleResetSkip() {
		setSkipEvery('')
		setSkipSpecific('')
		const data: Partial<TransformOptions> = {
			skipEvery: 0,
			skipSpecific: []
		}
		emit('EMIT_INPUT_TO_PLUGIN', data)
	}

	function handleRotateItems(e: h.JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.checked
		setRotateItems(value)
		const data: Partial<TransformOptions> = {
			rotateItems: e.currentTarget.checked
		}
		emit('EMIT_INPUT_TO_PLUGIN', data)
	}

	function handleInstanceClick(index: number): void {
		const mappedToNumberArr = skipSpecific.split(',').map(Number)

		if (mappedToNumberArr[0] === 0) {
			mappedToNumberArr.shift()
		}

		const isAlreadySelected = mappedToNumberArr.indexOf(index + 1)

		if (isAlreadySelected > -1) {
			mappedToNumberArr.splice(isAlreadySelected, 1)
		} else {
			mappedToNumberArr.push(index + 1)
		}

		const stringifyArr: string = mappedToNumberArr.toString()
		setSkipSelect('SPECIFIC')
		setSkipSpecific(stringifyArr)

		const data: Partial<TransformOptions> = {
			skipSelect: 'SPECIFIC',
			skipSpecific: mappedToNumberArr
		}
		emit('EMIT_INPUT_TO_PLUGIN', data)
	}

	function handleSweepChange(sweepAngle: number): void {
		setSweepAngle(sweepAngle)

		const data: Partial<TransformOptions> = {
			sweepAngle
		}
		emit('EMIT_INPUT_TO_PLUGIN', data)
	}

	function handleSweep(isSweeping: boolean): void {
		setIsSweeping(isSweeping)
	}

	function handleButtonClick(): void {
		emit('APPLY_TRANSFORMATION')
	}

	/**
	 * 👂 Event listeners
	 */
	function handleSelectionChange({ selectionType, selection }: any): void {
		setSelectionState(selectionType)

		if (selectionType === 'VALID') {
			const { width, height, rotation, type } = selection
			setSelectionLayout({ width, height, rotation, type })
		}
	}
	on('EMIT_SELECTION_CHANGE_TO_UI', handleSelectionChange)

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
		const split = value.split(',').map(Number)
		const temp: any = split.filter(
			(e, i) => e > 0 && e % 1 == 0 && split.indexOf(e) == i
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
									onClick={handleResetSkip}
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
									onClick={handleResetSkip}
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
