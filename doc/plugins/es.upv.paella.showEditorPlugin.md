# es.upv.paella.showEditorPlugin

This plugin was made for add the zoom functionality to paella player for be able to zoom blackboard photos. It creates new icons hover the MasterVideo to enter in the photo display mode.


## Plugin Type:
- [paella.VideoOverlayButtonPlugin](../plugin_type.md)

## Configuration Parameters

* **alwaysVisible**

	Option for show allways the editor button, although the users dont have permission to edit.
	- default value: true
	- range: true | false

## Config Example:

Here's are the config lines for this plugin:

```json
{
	"es.upv.paella.ShowEditorPlugin":
	{
		"enabled":true,
		"alwaysVisible":true
	},
}
```