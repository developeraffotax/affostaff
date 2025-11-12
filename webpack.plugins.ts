import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import CopyPlugin from "copy-webpack-plugin";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
  }),
  new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "assets"),   // e.g. your “assets” folder in project root
          to: path.resolve(__dirname, ".webpack/main/assets"), // or output path where your main bundle lands
        },
         {
        from: path.resolve(__dirname, "assets"),
        to: path.resolve(__dirname, ".webpack/renderer/assets")
      },

      
        {
          from: path.resolve(__dirname, 'node_modules/screenshot-desktop/lib/win32/screenCapture_1.3.2.bat'),
          to: path.resolve(__dirname, '.webpack/main'),
        },
        {
          from: path.resolve(__dirname, 'node_modules/screenshot-desktop/lib/win32/app.manifest'),
          to: path.resolve(__dirname, '.webpack/main'),
        },

        // {
        //   from: path.resolve(__dirname, 'node_modules/screenshot-desktop/lib/win32'),
        //   to: path.resolve(__dirname, './.webpack/main/win32'),
        // },
      ],
    }),
];
