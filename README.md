# vue-svga-uploader

一个基于 Element Plus 和 SVGAPlayerWeb 的上传组件，支持图片、视频、`.gif`和 `.svga` 动画上传与预览，适配 Vue 3 + Vite 项目。支持自定义上传逻辑、删除逻辑、上传数量限制、传入等功能。

---

## 功能特性

- 支持 `.png` / `.jpg` / `.jpeg` / `.svga`/`.gif`/`.mp4`/`mov`/格式文件上传
- 图片缩略图预览
- 视频缩略图预览
- SVGA 动画缩略图和弹窗播放预览
- 自定义上传函数和删除函数
- 上传中状态遮罩动画
- 文件上传数量限制
- 支持外部传入初始文件数组
- 支持插槽自定义预览弹窗

---

## 安装依赖

```bash
npm install vue-svga-uploader svgaplayerweb

yarn add vue-svga-uploader svgaplayerweb
```

## 使用示例

### main.js 或 main.ts 引入组件

```js
import { createApp } from 'vue'
// 引入组件
import VueSvgaUploader from 'vue-svga-uploader'
// 引入样式
import 'vue-svga-uploader/dist/style.css'

const app = createApp(App)
//注册组件
app.use(VueSvgaUploader) 
app.mount('#app')
```

```vue
<template>
  <svga-uploader
    :upload-fn="uploadFn"
    :remove-fn="removeFn"
    :initial-files="fileUrls"
    :limit="3"
  />
</template>

<script setup>
// 外部初始文件
const fileUrls = [
  'https://xxx.com/image.png',
  'https://xxx.com/demo.svga'
]
// 上传逻辑
const uploadFn = async (file) => {
  // 返回格式示例：{ data: { url, ossId, fileName } }
  return await api.upload(file)
}
// 删除逻辑
const removeFn = async (file) => {
  // 根据 删除文件
  return await api.deleteFile()
}
</script>

```

## Props 说明

| 属性名            | 类型       | 默认值                              | 说明                                                      |
| ----------------  | --------  | -------------------------------- | -------------------------------------------------           |
| `uploadFn`       | Function   | —                                | 自定义上传逻辑，必须返回 `{ data: { url, ossId, fileName } }` |
| `removeFn`       | Function   | —                                | 自定义删除逻辑                                               |
| `acceptTypes`    | Array      | `['png', 'jpg', 'jpeg', 'svga']` | 支持的文件类型                                               |
| `limit`          | Number     | `1`                              | 限制最多上传文件数                                            |
| `initialFiles`   | Array      | `[]`                             | 初始文件 URL 数组                                             |

## 插槽

| 插槽名       | 说明                 |
| --------- | ------------------ |
| `preview` | 自定义预览弹窗内容，接收预览相关参数 |

```vue
<!-- 使用示例 -->
<template
#preview="{previewVisible,isPreviewImage,previewImageUrl,previewDialogId,isPreviewVideo,onClose,}">
    <el-dialog
    :model-value="previewVisible"
    @update:model-value="(val) => !val && onClose?.()"
    title="✨自定义预览✨"
    width="400px">
        <div v-if="isPreviewImage">
            <img :src="previewImageUrl" style="width: 100%" />
        </div>
        <div v-if="isPreviewVideo">
            <video :src="previewImageUrl"style="width: 100%; height: auto"controlsautoplay playsinline></video>
        </div>
        <div v-else :id="previewDialogId" class="svga-dialog-box"></div>
    </el-dialog>
</template>

```

## 上传返回格式说明

```js
{
  data: {
    url: 'https://your-cdn.com/file.svga',
    ossId: 'unique-file-id',
    fileName: 'file.svga'
  }
}
```

## 依赖

### Vue 3

### Element Plus

### svgaplayerweb
