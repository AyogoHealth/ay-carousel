/*! Copyright 2017 Ayogo Health Inc. */

import cleanup from 'rollup-plugin-cleanup';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
    format: 'umd',
    banner: '/*! Copyright 2017 Ayogo Health Inc. */',
    sourceMap: true,
    plugins: [
        cleanup(),
        sourcemaps()
    ]
};
