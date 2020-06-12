/*! Copyright 2017 Ayogo Health Inc. */

import cleanup from 'rollup-plugin-cleanup';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
    output: {
        format: 'umd',
        banner: '/*! Copyright 2020 Ayogo Health Inc. */',
        sourcemap: true,
        globals: {
            'angular': 'angular',
            'utilities': 'utilities'
        }
    },
    external: ['angular'],
    plugins: [
        cleanup(),
        sourcemaps()
    ]
};
