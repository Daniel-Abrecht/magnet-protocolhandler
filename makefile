SOURCES = $(wildcard lib/*.js)

TARGETS += dist/magnet-protocolhandler.js
TARGETS += dist/magnet-protocolhandler.min.js
TARGETS += dist/magnet-protocolhandler.min.js.map


all: $(TARGETS)

dist/magnet-protocolhandler.js: $(SOURCES)
	mkdir -p dist
	printf '"use strict";\n\n' > $@
	printf 'console.warn(' >> $@
	printf   '"'"magnet-protocolhandler.js is depracted, since the browsers debugger won't show the original files and linenumbers.\\\\n" >> $@
	printf   'Use magnet-protocolhandler.min.js and magnet-protocolhandler.min.js.map instead."' >> $@
	printf ');\n\n' >> $@
	cat $^ >> $@

dist/magnet-protocolhandler.min.js dist/magnet-protocolhandler.min.js.map: $(SOURCES)
	cd dist && echo '"use strict";' | ../node_modules/uglify-es/bin/uglifyjs \
          --mangle --compress -o magnet-protocolhandler.min.js \
          --source-map url=magnet-protocolhandler.min.js.map -- /dev/stdin $(addprefix ../,$^)

clean:
	rm -f $(TARGETS)
