/* 加载方法
frappe.require("/assets/bbl_app/js/utils.js", () => {
    console.log("require over");
});
 */
frappe.provide("bbl");
bbl.utils = {
    test_str: "abc",
}
bbl.utils.t1 = "t12";



console.log("utils.js loaded");