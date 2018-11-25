all:		test

clean:
	rm -rf lib node_modules

prepare:
	yarn

build:		prepare
	yarn run tsc

test:		build
	yarn run alsatian lib/test/*.js

publish:	clean build test
	@[[ -z "$$(git status --porcelain)" && "$$(git describe)" =~ ^v[0-9]+\.[0-9]+\.[0-9]$$ ]] || (git describe; git status; false)
	yarn publish --non-interactive --access public

.PHONY:		all clean prepare build publish
