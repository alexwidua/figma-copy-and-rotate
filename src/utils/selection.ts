/**
 * @file Utility functions that concern page selection queries.
 */

/**
 * Checks if current selection is empty, multiple, valid or updateable.
 * @param selection - Current page selection
 * @param validNodes - Array containing all valid node types
 * @returns {SelectionType}
 */
export function validateSelection(
	selection: ReadonlyArray<SceneNode>,
	validNodes: Array<String>
): SelectionState {
	if (selection.length) {
		if (selection.length > 1) {
			return 'MULTIPLE'
		}
		const node: SceneNode = selection[0]
		if (validNodes.indexOf(node.type) >= 0) {
			if (node.parent?.type === 'COMPONENT') {
				return 'IS_INSTANCE'
			} else if (node.type === 'GROUP' && hasComponentChild(node)) {
				return 'HAS_COMPONENT'
			} else {
				return 'VALID'
			}
		} else {
			return 'INVALID'
		}
	} else {
		return 'EMPTY'
	}
}

/**
 * Recursively search for child components that would prevent componentizing parent node.
 * @param selection
 * @returns - truthy value if component child has been found
 */
export function hasComponentChild(selection: SceneNode): boolean | undefined {
	let hasComponent
	if (selection.type === 'COMPONENT') {
		return true
	} else if (selection.type !== 'GROUP') {
		return false
	}
	selection.children.some(
		(child) => (hasComponent = hasComponentChild(child))
	)
	return hasComponent
}
