import os
import sipconfig
from PyQt4 import pyqtconfig

# The name of the SIP build file generated by SIP and used by the build
# system.
build_file = "italc.sbf"

# Get the PyQt configuration information.
config = pyqtconfig.Configuration()

# Get the extra SIP flags needed by the imported qt module.  Note that
# this normally only includes those flags (-x and -t) that relate to SIP's
# versioning system.
qt_sip_flags = config.pyqt_sip_flags

# Run SIP to generate the code.  Note that we tell SIP where to find the qt
# module's specification files using the -I flag.
os.system(" ".join([config.sip_bin, "-c", ".", "-b", build_file, "-I", config.pyqt_sip_dir, qt_sip_flags, "../italc.sip"]))

# We are going to install the SIP specification file for this module and
# its configuration module.
installs = []

installs.append(["italc.sip", os.path.join(config.default_sip_dir, "italc")])

installs.append(["italcconfig.py", config.default_mod_dir])

# Create the Makefile.  The QtModuleMakefile class provided by the
# pyqtconfig module takes care of all the extra preprocessor, compiler and
# linker flags needed by the Qt library.
#makefile = sipconfig.SIPModuleMakefile(config, build_file)

makefile = pyqtconfig.QtGuiModuleMakefile(
	configuration=config,
	build_file=build_file,
	#installs=installs
)

# Add the library we are wrapping.  The name doesn't include any platform
# specific prefixes or extensions (e.g. the "lib" prefix on UNIX, or the
# ".dll" extension on Windows).
makefile.extra_libs = ["ItalcCore"]
# makefile.extra_lib_dirs.append("/usr/lib/italc")

extra_include_dirs = ["/usr/include", "/usr/include/libitalc", "/usr/include/libitalc/rfb"]
makefile.extra_include_dirs.extend(extra_include_dirs)

# Generate the Makefile itself.
makefile.generate()

# Now we create the configuration module.  This is done by merging a Python
# dictionary (whose values are normally determined dynamically) with a
# (static) template.
content = {
    # Publish where the SIP specifications for this module will be
    # installed.
    "italc_sip_dir":    config.default_sip_dir,

    # Publish the set of SIP flags needed by this module.  As these are the
    # same flags needed by the qt module we could leave it out, but this
    # allows us to change the flags at a later date without breaking
    # scripts that import the configuration module.
    "italc_sip_flags":  qt_sip_flags
}

# This creates the italcconfig.py module from the italcconfig.py.in
# template and the dictionary.
#sipconfig.create_config_module("italcconfig.py", "config.py.in", content)

