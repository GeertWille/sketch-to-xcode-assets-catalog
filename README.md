# sketch-to-xcode-assets-catalog

Export assets for iOS directly from Sketch into Xcodes assets catalog

## Installation

The basic procedure is the same regardless of which version of Sketch
you're running, and how you installed it; simply check out this
repository into your Sketch plugins directory and you're good to go.

The actual location of your Sketch plugins directory will vary,
however, depending on how you installed Sketch:

* If you bought Sketch 3 from the App Store, use the
  `~/Library/Containers/com.bohemiancoding.sketch3/Data/Library/Application Support/com.bohemiancoding.sketch3/Plugins`
  directory
* If you downloaded Sketch 3 from the Bohemian Coding site, use the
  `~/Library/Application Support/com.bohemiancoding.sketch3/Plugins`
  directory

Once you have checked out the plugin repository into the relevant
directory, you'll find the plugin functions under the Plugins menu in Sketch.

## Layer naming convention

* `extension_device_filename`
  * Extension: Can be "j" (jpg), "p" (png), or "v" (PDF vector).
  * Device: Can be "u" (universal), "m" (mobile) or "t" (tablet).

### Valid examples
* `v_u_pepe-button`
* `p_u_green-button`
* `j_t_green_button`
* `p_m_greenbutton`
* `j_m_green-mobile-button`

## Assumptions

~~The plugin assumes you design your layouts in mdpi, which means 1px = 1dp~~

From now on this is configurable!

## Shortcuts

* Export: cmd + &

## Adding Padding to slices
From now on you can manually decide how big you want your exported asset to be. Just include a slicelayer in the group of that asset and it will not use the size of the group but the size of that slicelayer...

## Credits
This plugin is based on my other project [sketch-export-assets]. Now it's even more easier for our designers to deliver the assets to our iOS developers.


[sketch-export-assets]:https://github.com/geertwille/sketch-export-assets

PDF vector export support by [markiv](https://github.com/markiv).
