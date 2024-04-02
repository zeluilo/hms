const path = require('path');

module.exports = {
    entry: '/src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-react']
                    }
                }
            }
        ]
    },
    resolve: {
        fallback: {
            "stream": require.resolve("stream-browserify"),
            "crypto": require.resolve("crypto-browserify"),
            "http": require.resolve("stream-http"),
            "https": require.resolve("https-browserify"),
            "url": require.resolve("url/"),
            "path": require.resolve("path-browserify"),
            "util": require.resolve("util/"),
            "os": require.resolve("os-browserify/browser"),
            "zlib": require.resolve("browserify-zlib")
        }
    }    
};
