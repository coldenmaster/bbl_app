// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Semi Handover", {
    onload(frm) {
        set_employee_select(frm);
        set_employee_require(frm);
    },
	refresh(frm) {
        set_employee_require(frm);
	},
    // validate: function(frm) {
    //     check_employee(frm)
    // },
    from_employee(frm) {
        check_employee_same(frm);
    },
    to_employee(frm) {
        check_employee_same(frm);
    }

});

function set_employee_select(frm) {
    employee = frappe.session.user_fullname
    // from_employee 和 to_employee 的选择项都设置为当前用户
    let from_li = [""];
    let to_li = [""];
    if (v = frm.doc.from_employee) {
        from_li.push(v)
    } else {
        from_li.push(employee)
    } 
    from_employee_df = frm.get_field("from_employee")
    from_employee_df.df.options = from_li
    if (v = frm.doc.to_employee) {
        from_li.push(v)
    } else {
        to_li.push(employee)
    }
    to_employee_df = frm.get_field("to_employee")
    to_employee_df.df.options = to_li;

}

function check_employee_same(frm) {
    from_employee = frm.doc.from_employee
    to_employee = frm.doc.to_employee
    if (from_employee == to_employee) {
        frappe.throw("发货人".bold() + "和" + "收货人".bold() + "不能是同一个人员");
    }
}

function set_employee_require(frm) {
    if (!frm.is_new()) {
        frm.toggle_reqd("from_employee", true);
        frm.toggle_reqd("to_employee", true);
    }
}