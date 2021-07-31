/**
 * Checks if current selection is empty, multiple, valid or updateable.
 * @param selection - Current page selection
 * @param validNodes - Array containing all valid node types
 * @returns {SelectionType}
 */
export function validateSelection(
	selection: ReadonlyArray<SceneNode>,
	validNodes: Array<String>
): SelectionType {
	if (selection.length) {
		if (selection.length > 1) {
			return 'MULTIPLE'
		}
		const node: SceneNode = selection[0]
		if (validNodes.indexOf(node.type) >= 0) {
			const hasParentID: string = node.getSharedPluginData(
				'radial_items',
				'parentGroup'
			)
			if (
				node.parent?.id === hasParentID ||
				node.parent?.parent?.id === hasParentID
			) {
				return 'VALID_UPDATEABLE'
			} else {
				return 'VALID_NONUPDATEABLE'
			}
		} else {
			return 'INVALID'
		}
	} else {
		return 'EMPTY'
	}
}
