# es.upv.paella.captionsButtonPlugin

This plugins activates the subtitles bar below the video with the default browser language, and displays a popup for if you want to change the language instead of using the browser default.

![](images/captionsButtonPlugin.jpg)

## Plugin Type:
- [paella.ButtonPlugin](../plugin_type.md)

## Related Plugins

[**es.upv.paella.captionsPlugin**](es.upv.paella.captionsPlugin.md)

## Configuration Parameters

* searchOnCaptions
	This option let the user search for captions on a pop-up interface above the plugin button.
	- default value: false
	- range: true | false


## Config Example:

Here's are the config  lines for this plugin:

```json
{
	"es.upv.paella.captionsPlugin":
	{
		"enabled":true,
		"searchOnCaptions":false
	},
}
```