/* 这里打包， 加载方法 使用前手动加载
frappe.require("/assets/bbl_app/js/dialog/bbl_dialog.js", () => {
    console.log("加载完成");
});
 */

// import './map_defaults.js'
import './steel_batch_parse.js'
import './product_code_parse.js'

import './dialog/bbl_dialog.js';
import './dialog/raw2bar_dialog.js';