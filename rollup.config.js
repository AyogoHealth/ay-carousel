/*! Copyright 2017 Ayogo Health Inc. */

import cleanup from 'rollup-plugin-cleanup';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
    banner: '/*! Copyright 2017 Ayogo Health Inc. */',
    sourcemap: true,
    output: {
        format: 'umd',
    },
    globals: {
        'angular': 'angular',
        'utilities': 'utilities'
    },
    plugins: [
        cleanup(),
        sourcemaps()
    ]
};
