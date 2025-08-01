// vite.config.mjs
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
	plugins: [vue()],
	build: {
		lib: {
			entry: path.resolve(__dirname, 'index.js'),
			name: 'VueSvgaUploader',
			fileName: (format) => `index.${format}.js`,
		},
		rollupOptions: {
			external: ['vue', 'element-plus', 'svgaplayerweb'],
			output: {
				globals: {
					vue: 'Vue',
					'element-plus': 'ElementPlus',
					svgaplayerweb: 'SVGA',
				},
			},
		},
	},
})
