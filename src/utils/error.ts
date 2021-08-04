export function handleErrorNotification(error: PluginError) {
	const errorMap: PluginErrorMap = {
		CANT_SKIP_FIRST_INDEX: `You can't skip the first instance.`,
		CANT_SKIP_ALL: `You can't skip all elements.`
	}
	figma.notify(errorMap[error])
}
