import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
    input: 'lib/src/index.js',
    plugins: [commonjs(), resolve(), sourcemaps()],
    output: {
        exports: 'named',
        name: '@divine.synchronization',
        amd: {
            id: '@divine/synchronization'
        },
        sourcemap: true,
    },
}
