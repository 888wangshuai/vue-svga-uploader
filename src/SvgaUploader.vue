<template>
	<div>
		<el-upload
			class="upload-demo"
			action=""
			:http-request="uploadFile"
			:before-upload="beforeUpload"
			:file-list="fileList"
			:limit="props.limit"
			list-type="picture-card"
			:on-remove="handleRemove"
			:on-preview="handlePreview"
			@exceed="handleExceed"
		>
			<template #file="{ file }">
				<div class="custom-thumb-wrapper">
					<div class="custom-thumb">
						<img
							v-if="isImage(file)"
							:src="file.url"
							class="thumb-img"
						/>
						<video
							v-else-if="isVideo(file)"
							:src="file.url"
							class="thumb-img"
							muted
							autoplay
							loop
							playsinline
						></video>
						<div
							v-else
							class="thumb-svga"
							:id="`svga-thumb-${file.uid}`"
						></div>

						<div
							v-if="uploadingMap[file.uid]"
							class="uploading-overlay"
						>
							<el-icon class="spinning"><Loading /></el-icon>
							<span class="uploading-text">上传中...</span>
						</div>
					</div>

					<span class="el-upload-list__item-actions">
						<span
							class="el-upload-list__item-preview"
							@click.stop="handlePreview(file)"
						>
							<el-icon><ZoomIn /></el-icon>
						</span>
						<span
							class="el-upload-list__item-delete"
							@click.stop="
								!uploadingMap[file.uid] && removeFile(file)
							"
							:style="{
								cursor: uploadingMap[file.uid]
									? 'not-allowed'
									: 'pointer',
							}"
						>
							<el-icon><Delete /></el-icon>
						</span>
					</span>
				</div>
			</template>

			<template #trigger>
				<el-icon><Plus /></el-icon>
			</template>
		</el-upload>
		<!-- 
        支持外部传入插槽自定义预览 
         previewVisible 控制弹窗显示
         previewDialogId 弹窗id
         isPreviewImage 是否是图片
         previewImageUrl  图片预览地址
         onClose 关闭弹窗回调
        -->
		<slot
			name="preview"
			:previewVisible="previewVisible"
			:isPreviewImage="isPreviewImage"
			:previewImageUrl="previewImageUrl"
			:previewDialogId="previewDialogId"
			:isPreviewVideo="isPreviewVideo"
			:onClose="() => (previewVisible = false)"
		>
			<!-- 默认预览弹窗 -->
			<el-dialog
				v-model="previewVisible"
				width="300px"
				title="预览动画"
				destroy-on-close
			>
				<template v-if="isPreviewImage">
					<img
						:src="previewImageUrl"
						alt="预览图"
						style="width: 100%; height: auto"
					/>
				</template>
				<template v-else-if="isPreviewVideo">
					<video
						:src="previewImageUrl"
						style="width: 100%; height: auto"
						controls
						autoplay
						playsinline
					></video>
				</template>
				<template v-else>
					<div :id="previewDialogId" class="svga-dialog-box"></div>
				</template>
			</el-dialog>
		</slot>
	</div>
</template>

<script setup>
import { ref, nextTick, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, ZoomIn, Delete, Loading } from '@element-plus/icons-vue'
import SVGA from 'svgaplayerweb'

const props = defineProps({
	uploadFn: { type: Function, required: true },
	removeFn: { type: Function, required: true },
	acceptTypes: {
		type: Array,
		default: () => ['png', 'jpg', 'jpeg', 'gif', 'svga', 'mp4', 'mov'],
	},
	limit: { type: Number, default: 1 },
	initialFiles: { type: Array, default: () => [] },
})
// 文件列表
const fileList = ref([])
const uploadingMap = ref({})
const previewVisible = ref(false)
const previewDialogId = 'svga-dialog-preview'
const isPreviewImage = ref(false)
const isPreviewVideo = ref(false)
const previewImageUrl = ref('')

const handleExceed = () => {
	ElMessage.warning(`最多只能上传 ${props.limit} 个文件`)
}

const beforeUpload = (file) => {
	const ext = file.name.split('.').pop()?.toLowerCase()
	if (!props.acceptTypes.map((i) => i.toLowerCase()).includes(ext)) {
		ElMessage.error(`仅支持文件类型：${props.acceptTypes.join(', ')}`)
		return false
	}
	return true
}

const isImage = (file) => /\.(png|jpg|jpeg|gif)$/i.test(file.name)

const isVideo = (file) => /\.(mp4|mov)$/i.test(file.name)

const isSVGA = (file) => /\.(svga)$/i.test(file.name)
const uploadFile = async ({ file, onSuccess, onError }) => {
	uploadingMap.value[file.uid] = true
	try {
		const result = await props.uploadFn(file)
		const { url, ossId, fileName } = result?.data || {}
		if (!url || !ossId || !fileName) throw new Error('无效响应')

		const newItem = {
			uid: file.uid,
			name: fileName,
			url,
			type: file.type || '',
			ossId,
			fileName,
		}
		fileList.value.push(newItem)
		await nextTick()
		await nextTick()
		if (isSVGA(newItem)) {
			playSVGA(`svga-thumb-${newItem.uid}`, newItem.url)
		}
		onSuccess?.(result, file)
	} catch (err) {
		ElMessage.error('上传失败')
		onError?.(err)
	} finally {
		delete uploadingMap.value[file.uid]
	}
}

const removeFile = async (file) => {
	try {
		const matched = fileList.value.find((item) => item.uid === file.uid)
		if (!matched) return ElMessage.error('文件信息未找到')
		await props.removeFn(matched)
		fileList.value = fileList.value.filter((item) => item.uid !== file.uid)
	} catch {
		ElMessage.error('删除失败')
	}
}

const handleRemove = () => false

const handlePreview = async (file) => {
	isPreviewImage.value = isImage(file)
	isPreviewVideo.value = isVideo(file)

	previewImageUrl.value = file.url
	previewVisible.value = true

	if (isSVGA(file)) {
		await nextTick()
		playSVGA(previewDialogId, file.url)
	}
}

const playSVGA = (elementId, url) => {
	const container = document.getElementById(elementId)
	if (!container) return
	container.innerHTML = ''
	const player = new SVGA.Player(container)
	const parser = new SVGA.Parser()
	parser.load(url, (videoItem) => {
		player.setVideoItem(videoItem)
		player.startAnimation()
	})
}
watch(
	() => props.initialFiles,
	async (newFiles) => {
		fileList.value = newFiles.map((url, index) => {
			const isSVGA = url.endsWith('.svga')
			const fileName = url.split('/').pop() || `file-${index}`
			const uid = `${fileName}-${index}`

			return {
				uid,
				name: fileName,
				url,
				type: isSVGA ? 'application/octet-stream' : 'image/jpeg',
				ossId: uid, // 用文件名+索引作为唯一 ID
				fileName,
			}
		})

		await nextTick()

		fileList.value.forEach((item) => {
			if (isSVGA(item)) {
				playSVGA(`svga-thumb-${item.uid}`, item.url)
			}
		})
	},
	{ immediate: true }
)
</script>

<style scoped>
.custom-thumb-wrapper {
	position: relative;
	width: 100%;
	height: 100%;
}
.custom-thumb {
	width: 100%;
	height: 100%;
	overflow: hidden;
	position: relative;
}
.thumb-img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
.thumb-svga {
	width: 100%;
	height: 100%;
}
.svga-dialog-box {
	width: 200px;
	height: 200px;
	margin: 0 auto;
}
.uploading-overlay {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(255, 255, 255, 0.6);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 10;
}
.spinning {
	font-size: 30px;
	color: #409eff;
	animation: rotate 1s linear infinite;
}
.uploading-overlay {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(255, 255, 255, 0.6);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 10;
	flex-direction: column; /* 垂直排列也可以改成 row 横向 */
}

.spinning {
	font-size: 30px;
	color: #409eff;
	animation: rotate 1s linear infinite;
}

.uploading-text {
	margin-top: 8px;
	color: #409eff;
	font-size: 14px;
}

@keyframes rotate {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}
.el-upload-list__item-actions {
	position: absolute;
	top: 0;
	right: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.5);
	opacity: 0;
	transition: opacity 0.3s;
}
.custom-thumb-wrapper:hover .el-upload-list__item-actions {
	opacity: 1;
}
.el-upload-list__item-preview,
.el-upload-list__item-delete {
	color: #fff;
	font-size: 20px;
	margin: 0 5px;
}
</style>
