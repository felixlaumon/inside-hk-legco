# useful ref: http://www.cprogramming.com/tutorial/makefiles_continued.html

jade = node_modules/.bin/jade
browserify = node_modules/.bin/browserify
stylus = node_modules/.bin/stylus
nib = ./node_modules/nib/lib/nib
server = ./node_modules/.bin/http-server
PORT ?= 7000

all: app.js index.html main.css

# https://github.com/mklabs/tiny-lr#using-make
include node_modules/tiny-lr/tasks/tiny-lr.mk

# - to ignore error in case tiny-lr is not running
app.js: app/*.js app/models/*.js app/collections/*.js app/views/*.js app/dataviz/*.js
	$(browserify) app/app.js -o app.js
	-curl -silent -X POST http://localhost:35729/changed -d '{ "files": "$?" }'

index.html: app/index.jade app/views/*.jade
	$(jade) app/index.jade -o ./ --pretty
	-curl -silent -X POST http://localhost:35729/changed -d '{ "files": "$?" }'

main.css: app/main.styl app/views/*.styl variables.styl
	$(stylus) app/main.styl -u $(nib) -o ./
	-curl -silent -X POST http://localhost:35729/changed -d '{ "files": "$?" }'

clean:
	rm -f app.js index.html main.css

serve:
	$(server) -p $(PORT)

.PHONY: clean serve
