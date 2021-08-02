/**
 * Base rotation that is applied to transformation.
 * -90 because Figma sets origin (0°) to 3 o'clock.
 */
export const baseDeg: number = -90

/**
 * Instantiates and rotates a node by a given amount and radius. Assumes node is already componentized.
 * @param node - Node that will be instantiated and rotated
 * @param numItems - Number of copies/ instances
 * @param radius
 * @returns {Array<SceneNode}
 */
export function instantiateAndRotate(
	node: ComponentNode,
	numItems: number,
	radius: number,
	rotateItems: boolean,
	sweepAngle: number
): Array<InstanceNode> {
	const collection: Array<InstanceNode> = []

	Array.from({ length: numItems }, () => {
		const clonedNode: InstanceNode = node.createInstance()
		collection.push(clonedNode)
	})

	collection.forEach((e, i) => {
		const initX: LayoutMixin['x'] = node.x
		const initY: LayoutMixin['y'] = node.y
		const initDeg: LayoutMixin['rotation'] = Math.round(node.rotation) * -1
		const initRad: number = initDeg * (Math.PI / 180)

		const w: LayoutMixin['width'] = node.width / 2
		const h: LayoutMixin['height'] = node.height / 2
		const r = radius
		const d: number = r * 2

		// (items - 1) to account for the offset of the sweep slider
		const deg: number = baseDeg + (sweepAngle / (numItems - 1)) * i
		const rad: number = deg * (Math.PI / 180)

		// Normalize shape and radius if node is oblong
		const diff: number = Math.abs(w - h)
		const normalizeShape: number =
			w >= h
				? -(diff * Math.cos(Math.abs(deg) * (Math.PI / 180)))
				: diff * Math.cos(Math.abs(deg) * (Math.PI / 180))
		const normalizeRadius: number =
			w === h
				? 0
				: w > h
				? -diff * Math.sin(Math.abs(initRad))
				: diff * Math.sin(Math.abs(initRad))

		// Rotate instances in circle
		const translate: XY = {
			x:
				(r + w - normalizeRadius) * Math.cos(rad) +
				w * Math.sin(rad) +
				(d + w * 2) / 2 +
				normalizeShape,
			y:
				(r + h - normalizeRadius) * Math.sin(rad) -
				h * Math.cos(rad) +
				(d + h * 2) / 2
		}

		const radialTransform: Transform = [
			[Math.cos(rad), -Math.sin(rad), translate.x],
			[Math.sin(rad), Math.cos(rad), translate.y]
		]

		e.relativeTransform = radialTransform
		e.rotation = e.rotation + baseDeg

		// Shift circle down so that original node becomes position 0 (12:00)
		const x: LayoutMixin['x'] = e.x + initX
		const y: LayoutMixin['y'] = e.y + initY
		const sin: number = Math.sin(initRad)
		const cos: number = Math.cos(initRad)
		e.x = x + w * (1 - sin) - w * (1 - cos)
		e.y = y + h * (1 - sin) - h * (1 - cos) + h * sin

		// Restore the original nodes rotation by applying it to all instances
		// We need some extra math here to preserve the radius
		const newX: LayoutMixin['x'] = e.x
		const newY: LayoutMixin['y'] = e.y

		const baseDegRad: number = baseDeg * -1 * (Math.PI / 180)
		const newRad: number = rotateItems
			? rad + initRad + baseDegRad
			: initRad

		const rotateAroundOrigin: XY = {
			x:
				w -
				w * Math.cos(newRad) +
				h * Math.sin(newRad) -
				w * Math.sin(rad),
			y:
				h -
				w * Math.sin(newRad) -
				h * Math.cos(newRad) +
				h * Math.cos(rad)
		}

		const restoreInitRotation: Transform = [
			[Math.cos(newRad), -Math.sin(newRad), rotateAroundOrigin.x],
			[Math.sin(newRad), Math.cos(newRad), rotateAroundOrigin.y]
		]

		e.relativeTransform = restoreInitRotation
		e.x = e.x + newX
		e.y = e.y + newY
		e.name = `Rotated Instance ${i + 1}`
	})

	return collection
}
