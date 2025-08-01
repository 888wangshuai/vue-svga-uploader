import SvgaUploader from './src/SvgaUploader.vue'

// 支持按需引入
export { SvgaUploader }

// 支持全局注册（用于 app.use()）
export default {
	install(app) {
		app.component('SvgaUploader', SvgaUploader)
	},
}
