import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main/index.ts',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },

  //  target: "electron-main", // ✅ Ensures correct environment for Node native modules
  //  externals: {
  //   keytar: 'commonjs keytar',
  //   'node-machine-id': 'commonjs node-machine-id',
  // },
  // node: {
  //   __dirname: false,
  //   __filename: false, // ✅ Makes sure __dirname/__filename resolve properly
  // },
};
