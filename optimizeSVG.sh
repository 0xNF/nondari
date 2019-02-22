# #!/usr/bin/env bash

# # make necessary dirs first
# mkdir -p src/img/ingredients/
# mkdir -p src/img/glasses/

# # copy the raw SVGs
# cp RawSVGs/glasses/* src/img/glasses/
# cp RawSVGs/ingredients/droplet/* src/img/ingredients/
# cp RawSVGs/ingredients/drops/* src/img/ingredients/
# cp RawSVGs/ingredients/ice/* src/img/ingredients/
# cp RawSVGs/ingredients/slices/* src/img/ingredients/
# cp RawSVGs/ingredients/sugar/* src/img/ingredients/
# cp RawSVGs/ingredients/twists/* src/img/ingredients/
# cp RawSVGs/ingredients/wedges/* src/img/ingredients/
# cp RawSVGs/ingredients/*.svg src/img/ingredients/

# # optimize the svgs
# node_modules/svgo/bin/svgo -f ./src/img/glasses/ --multipass
# node_modules/svgo/bin/svgo -f ./src/img/ingredients/ --multipass