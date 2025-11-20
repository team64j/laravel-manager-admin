<script>
// Introduce the Tinymce editor
import Editor from '@tinymce/tinymce-vue'
// Introduce rich text editor theme js and CSS
// import 'tinymce/skins/content/default/content.css'
// Import mode Import tinymce files in node_modules
// import 'tinymce/skins/ui/oxide/skin.min.css' // Import the editor icon icon, not to display the corresponding icon
// import 'tinymce/skins/ui/oxide/content.min.css'
import 'tinymce/skins/ui/oxide-dark/skin.min.css'
import 'tinymce/skins/ui/oxide-dark/content.min.css'
// import 'tinymce/skins/content/default/content.min.css'
// import 'tinymce/skins/content/dark/content.min.css'
import tinymce from 'tinymce/tinymce' // Tinymce default hidden, not to display the editor
import 'tinymce/themes/silver' // Editor theme, do not introduce an error
//import 'tinymce/icons/default'
// Introduce the editor plug-in
import 'tinymce/plugins/advlist' // Advanced list
import 'tinymce/plugins/anchor' // the anchor
import 'tinymce/plugins/autolink' // Automatic link
import 'tinymce/plugins/autoresize' // The editor is highly adaptive. Note: the height set in Init is invalid when plugins are added to plugins
import 'tinymce/plugins/autosave' // Automatically save manuscripts
import 'tinymce/plugins/charmap' // Special characters
import 'tinymce/plugins/code' // Edit the source code
import 'tinymce/plugins/codesample' // Code examples
import 'tinymce/plugins/directionality' // Text direction
//import 'tinymce/plugins/emoticons' // expressions
import 'tinymce/plugins/fullpage' // Document attributes
import 'tinymce/plugins/fullscreen' // full screen
import 'tinymce/plugins/help' // help
import 'tinymce/plugins/hr' // Horizontal divider
import 'tinymce/plugins/image' // Insert edit image
import 'tinymce/plugins/importcss' // into the CSS
import 'tinymce/plugins/insertdatetime' // Insert date and time
import 'tinymce/plugins/link' // hyperlinks
import 'tinymce/plugins/lists' // List plugins
import 'tinymce/plugins/media' // Insert edit media
import 'tinymce/plugins/nonbreaking' // Insert uninterrupted space
import 'tinymce/plugins/pagebreak' // Insert a page break
import 'tinymce/plugins/paste' // Paste the plugin
import 'tinymce/plugins/preview' // the preview
import 'tinymce/plugins/print' // print
import 'tinymce/plugins/quickbars' // Quick toolbar
import 'tinymce/plugins/save' // save
import 'tinymce/plugins/searchreplace' // Find the replacement
// import // 'tinymce/plugins/spellchecker' spell check, temporary not to join the localization, is not recommended
import 'tinymce/plugins/tabfocus' // Cut out, press TAB to cut out the editor, enter other input fields on the page
import 'tinymce/plugins/table' // form
import 'tinymce/plugins/template' // Content template
import 'tinymce/plugins/textcolor' // Text color
import 'tinymce/plugins/textpattern' // Quick layout
import 'tinymce/plugins/toc' // Directory generator
import 'tinymce/plugins/visualblocks' // Displays the range of elements
import 'tinymce/plugins/visualchars' // Display invisible characters
import 'tinymce/plugins/wordcount' // Word count
// import '.. /.. /public/tinymce/axupimgs' //
import { defineComponent, onMounted, reactive, ref, toRefs, watch } from 'vue'

export default defineComponent({
  components: {
    Editor
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    plugins: {
      type: [String, Array],
      default:
          'print preview searchreplace autolink directionality visualblocks visualchars fullscreen image link media template code codesample table charmap hr pagebreak nonbreaking anchor insertdatetime advlist lists wordcount textpattern autosave'
    },
    toolbar: {
      type: [String, Array],
      default:
          'fullscreen undo redo restoredraft | cut copy paste pastetext | forecolor backcolor bold italic underline strikethrough link anchor | alignleft aligncenter alignright alignjustify outdent indent | styleselect formatselect fontselect fontsizeselect | bullist numlist | blockquote subscript superscript removeformat | table image media charmap  hr pagebreak insertdatetime print preview | code selectall | indent2em lineheight formatpainter axupimgs'
    }
  },
  setup (props, ctx) {
    const state = reactive({
      contentValue: props.modelValue
    })
    const initOptions = ref({
      //emoticons_database_url: '/tinymce/emoticons/js/emojis.js',// Change the emoticons plugin path
      //language_url: '/tinymce/langs/zh_CN.js',// Import the language pack file
      //language: 'zh_CN',// Language type

      //skin_url: '/tinymce/skins/ui/oxide',// Skin: light color
      skin_URL: '/tinymce/skins/ui/oxide-dark',//

      plugins: props.plugins, // Plug-in configuration
      toolbar: props.toolbar, // Toolbar configuration, hidden if set to false
      // menubar: 'File edit', // Menu bar configuration, set to false to hide, not set to default to display all menus, You can also customize the configuration -- go to http://tinymce.ax-z.cn/configure/editor-appearance.php -- search for "Customize menu"

      fontsize_formats:
          '12px 14px 16px 18px 20px 22px 24px 28px 32px 36px 48px 56px 72px',// Font size
      font_formats:
          'Microsoft YaHei,Helvetica Neue,PingFang SC, Sans-Serif; PingFang SC,Microsoft YaHei,sans-serif; Song typeface = simsun, serif; Italics = FangSong, serif; Blackbody = SimHei, sans-serif. Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Book Antiqua=book antiqua,palatino; ',
      height: 600,// Note: This attribute is invalid when the autoresize plugin is introduced
      placeholder: 'Enter text here... ',
      branding: false,// Whether to display tiny support information
      resize: false,// Editor width and height can be changed, false- no,true- height can be changed, 'both'- width and height can be changed, note the quotes
      // statusbar: false, // Whether the element path and word count column are displayed at the bottom
      elementpath: false,// Whether the element path is displayed

      // content_style: 'img {max-width:100%; }', // Directly customize CSS styles for editable areas
      //content_css: '/tinymce/tinycontent.css',// Customize the CSS style of the editable area in the form of A CSS file, which needs to be created and imported by yourself

      // images_upload_url: '/demo/upimg.php', // The url of the backend handler
      // images_upload_base_path: '/demo', // Relative basic path -- for image upload recommended view --http://tinymce.ax-z.cn/general/upload-images.php
      // Here is the image upload function, this directly uses the base64 image form upload image,
      // for ajax upload https://www.tiny.cloud/docs/configure/file-image-upload/#images_upload_handler for reference
      images_upload_handler: (blobInfo, success, failure) => {
        const img = 'data:image/jpeg; base64,' + blobInfo.base64()
        success(img)
      }
    })
    const methods = reactive({
      onClick (e) {
        ctx.emit('onClick', e, tinymce)
      },
      // You can add your own custom events, such as content emptying
      clear () {
        state.contentValue = ' '
      }
    })
    onMounted(() => {
      tinymce.init({})
    })
    watch(
        () => props.modelValue,
        (newValue) => {
          state.contentValue = newValue
        }
    )
    watch(
        () => state.contentValue,
        (newValue) => {
          ctx.emit('input', newValue)
        }
    )
    return { initOptions, ...toRefs(state), ...toRefs(methods) }
  }
})
</script>

<template>
  <div class="app-tinymce">
    <Editor
        v-model="contentValue"
        :init="initOptions"
        :disabled="disabled"
        @onClick="onClick"
    />
  </div>
</template>

<style>
.app-tinymce .tox-tinymce {
  @apply !h-full border-0
}
.app-tinymce .tox-statusbar {
  @apply border-t-gray-50
}
</style>
