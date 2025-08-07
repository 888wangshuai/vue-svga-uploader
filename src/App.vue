<template>
	<SvgaUploader
		:uploadFn="uploadToServer"
		:removeFn="handleRemove"
		:acceptTypes="['gif', 'svga', 'mp4']"
		:limit="3"
		:initial-files="fileListFromServer"
	>
		<template
			#preview="{
				previewVisible,
				isPreviewImage,
				previewImageUrl,
				previewDialogId,
				isPreviewVideo,
				onClose,
			}"
		>
			<el-dialog
				:model-value="previewVisible"
				@update:model-value="(val) => !val && onClose?.()"
				title="✨自定义预览✨"
				width="400px"
			>
				<div v-if="isPreviewImage">
					<img :src="previewImageUrl" style="width: 100%" />
				</div>
				<div v-if="isPreviewVideo">
					<video
						:src="previewImageUrl"
						style="width: 100%; height: auto"
						controls
						autoplay
						playsinline
					></video>
				</div>
				<div v-else :id="previewDialogId" class="svga-dialog-box"></div>
			</el-dialog>
		</template>
	</SvgaUploader>
</template>

<script setup>
import SvgaUploader from './SvgaUploader.vue'
import { ref } from 'vue'
// 初始文件列表
const fileListFromServer = ref([
	// 'http://localhost:3001/uploads/sports_car-xxx.svga',
	// 'http://localhost:3001/uploads/cat.jpg',
])
// 上传函数
const uploadToServer = async (file) => {
	try {
		const formData = new FormData()
		formData.append('file', file)

		const response = await fetch('http://localhost:3001/upload-svga', {
			method: 'POST',
			body: formData,
		})

		if (!response.ok) {
			throw new Error(`上传失败，状态码：${response.status}`)
		}

		const result = await response.json()
		// 这里后端返回格式是顶层字段，不是data包裹的
		// 你需要返回一个对象包含 data.url，和附加的 ossId 供后续删除用
		if (!result.url) {
			throw new Error('响应格式错误，未包含 url')
		}
		// 返回符合 SvgaUploader 组件上传成功预期的结构
		return {
			data: {
				url: result.url,
				fileName: result.fileName,
				ossId: result.ossId,
			},
		}
	} catch (error) {
		console.error('上传失败:', error)
		throw error
	}
}

// 删除函数
const handleRemove = async (file) => {
	try {
		if (!file.ossId) {
			throw new Error('缺少 ossId，无法删除')
		}
		const response = await fetch('http://localhost:3001/delete', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ ossId: file.ossId }),
		})
		if (!response.ok) {
			throw new Error(`删除失败，状态码：${response.status}`)
		}
		const resData = await response.json()
		if (!resData.success) {
			throw new Error('删除失败，服务器未返回成功状态')
		}
		console.log('删除成功', file)
	} catch (error) {
		console.error('删除失败:', error)
		throw error
	}
}
</script>
