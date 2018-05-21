
SOURCES = $(wildcard lib/*.js)

TARGETS += dist/magnet-protocolhandler.js
TARGETS += dist/magnet-protocolhandler.min.js

all: $(TARGETS)

dist/magnet-protocolhandler.js: $(SOURCES)
	mkdir -p dist
	cat $^ > $@

dist/magnet-protocolhandler.min.js: dist/magnet-protocolhandler.js
	./node_modules/uglify-es/bin/uglifyjs --mangle --compress -o $@ -- $^

clean:
	rm -f dist/protocolloadfallbackhandler.js
