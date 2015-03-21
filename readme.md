# inside-hk-legco

Visualization for HK Legco Voting Record. Demo available at https://inside-hk-legco.herokuapp.com.

## build

````sh
$ npm install # install dependencies
$ http-server -p 3000 # start a static server
$ make livereload # start livereload server
$ watch make # watch and auto build, install watch by `brew install watch` or `brew install visionmedia-watch`
$ make livereload-stop # to stop livereload server
````

## interface TODO
- options to hide name
- extra links bug
- sometimes no transition between votes and party
- links not obvious enough
- make graph resuable http://bost.ocks.org/mike/chart/
- color background by party http://bl.ocks.org/GerHobbelt/3071239
- need to hide the vote breakdown in case no vote separation mechanism
- hide absent votes
- group by constituency
- group by fc vs gc

## data TODO
- extra english member info

## code TODO
- made modification to bootstrap-stylus for nib to be referenced correctly
- should not couple with en / ch prop name (abstract member object?)
- decouple from polymer
