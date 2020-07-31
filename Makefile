NAME		:= $(shell node -p 'require(`./package.json`).name')
VERSION		:= $(shell node -p 'require(`./package.json`).version')

all:		build

clean:
	rm -rf lib node_modules coverage .nyc_output

prepare:
	yarn

build:		prepare
	yarn run tsc
	yarn run rollup -c rollup.config.js --format umd --file lib/bundle.umd.js

test:		build
	yarn run nyc --reporter=lcov --reporter=html alsatian lib/test/*.js
	yarn run nyc report

tag:
	@[[ -z "$$(git status --porcelain)" ]] || (git status; false)
	git tag -s v$(VERSION) -m "$(NAME) v$(VERSION)"

publish:	clean build test
	@[[ -z "$$(git status --porcelain)" && "$$(git describe)" =~ ^v[0-9]+\.[0-9]+\.[0-9]$$ ]] || (git describe; git status; false)
	yarn publish --non-interactive --access public

.PHONY:		all clean prepare build publish
